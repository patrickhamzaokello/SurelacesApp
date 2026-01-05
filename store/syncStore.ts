// src/store/syncStore.ts
import NetInfo from '@react-native-community/netinfo';
import { create } from 'zustand';
import { useInvoicesStore } from './invoicesStore';
import { useProductsStore } from './productsStore';
import { InvoicesDBService } from '../database/services/InvoicesDBService';
import { ProductsDBService } from '../database/services/ProductsDBService';

interface SyncProgress {
  stage: 'idle' | 'products' | 'invoices' | 'complete';
  productsTotal: number;
  productsLoaded: number;
  message: string;
}

interface SyncState {
  lastSyncTime: string | null;
  pendingInvoices: number;
  isSyncing: boolean;
  status: 'online' | 'offline' | 'syncing';
  syncProgress: SyncProgress;
}

interface SyncStoreState extends SyncState {
  setOnlineStatus: (status: 'online' | 'offline') => void;
  startSync: () => Promise<void>;
  startInitialSync: () => Promise<void>;
  updateLastSyncTime: () => void;
  initNetworkListener: () => void;
}

export const useSyncStore = create<SyncStoreState>((set, get) => ({
  lastSyncTime: null,
  pendingInvoices: 0,
  isSyncing: false,
  status: 'offline',
  syncProgress: {
    stage: 'idle',
    productsTotal: 0,
    productsLoaded: 0,
    message: '',
  },

  setOnlineStatus: (status: 'online' | 'offline') => {
    set({ status });
  },

  // Full initial sync (products + invoices) - triggered on login
  startInitialSync: async () => {
    if (get().isSyncing) {
      console.log('Sync already in progress, skipping');
      return;
    }

    try {
      console.log('Starting initial sync...');
      set({
        isSyncing: true,
        status: 'syncing',
        syncProgress: {
          stage: 'products',
          productsTotal: 0,
          productsLoaded: 0,
          message: 'Syncing products...',
        },
      });

      const productsStore = useProductsStore.getState();
      const invoicesStore = useInvoicesStore.getState();
      let productCount = 0;

      // 1. Sync products (full replacement from server)
      try {
        console.log('Fetching products from server...');
        await productsStore.syncProductsFromServer();
        productCount = await ProductsDBService.getProductCount();
        console.log(`Successfully synced ${productCount} products`);
      } catch (error: any) {
        console.error('Product sync failed:', error.message);
        // Try to get count from existing DB
        productCount = await ProductsDBService.getProductCount();
        console.log(`Using ${productCount} products from local database`);
      }

      set({
        syncProgress: {
          stage: 'invoices',
          productsTotal: productCount,
          productsLoaded: productCount,
          message: 'Products synced. Syncing invoices...',
        },
      });

      // 2. Sync pending invoices
      console.log('Syncing pending invoices...');
      try {
        await invoicesStore.syncPendingInvoices();
        console.log('Pending invoices synced');
      } catch (error: any) {
        console.error('Pending invoice sync failed:', error.message);
        // Continue even if sync fails - invoices will remain pending
      }

      // 3. Fetch latest invoices from server
      console.log('Fetching latest invoices...');
      set({
        syncProgress: {
          stage: 'invoices',
          productsTotal: productCount,
          productsLoaded: productCount,
          message: 'Fetching invoices...',
        },
      });

      try {
        await invoicesStore.fetchInvoices();
        console.log('Latest invoices fetched');
      } catch (error: any) {
        console.error('Invoice fetch failed:', error.message);
      }

      const pendingCount = await InvoicesDBService.getPendingInvoiceCount();
      console.log(`Initial sync complete. Products: ${productCount}, Pending invoices: ${pendingCount}`);

      set({
        lastSyncTime: new Date().toISOString(),
        pendingInvoices: pendingCount,
        isSyncing: false,
        status: pendingCount > 0 ? 'offline' : 'online',
        syncProgress: {
          stage: 'complete',
          productsTotal: productCount,
          productsLoaded: productCount,
          message: 'Sync complete',
        },
      });

      console.log('Initial sync completed successfully');
    } catch (error) {
      console.error('Initial sync failed with unexpected error:', error);
      // Always reset syncing state even on error
      set({
        isSyncing: false,
        status: 'offline',
        syncProgress: {
          stage: 'idle',
          productsTotal: 0,
          productsLoaded: 0,
          message: 'Sync failed',
        },
      });
    }
  },

  // Manual/auto sync (lighter - just pending invoices and refresh)
  startSync: async () => {
    if (get().isSyncing) {
      console.log('Sync already in progress, skipping');
      return;
    }

    try {
      console.log('Starting manual/auto sync...');
      set({ isSyncing: true, status: 'syncing' });

      const invoicesStore = useInvoicesStore.getState();
      const productsStore = useProductsStore.getState();

      let invoiceSyncSuccess = false;
      let productSyncSuccess = false;

      // 1. Sync pending invoices
      try {
        console.log('Syncing pending invoices...');
        await invoicesStore.syncPendingInvoices();
        invoiceSyncSuccess = true;
        console.log('Invoice sync successful');
      } catch (error: any) {
        console.error('Invoice sync failed:', error.message);
        // Continue even if invoice sync fails
      }

      // 2. Refresh products (lighter - just fetch updates)
      try {
        console.log('Fetching products...');
        await productsStore.fetchProducts();
        productSyncSuccess = true;
        console.log('Product fetch successful');
      } catch (error: any) {
        console.error('Product fetch failed:', error.message);
        // Continue even if product fetch fails
      }

      // 3. Fetch latest invoices (merge with local)
      try {
        console.log('Fetching invoices...');
        await invoicesStore.fetchInvoices();
      } catch (error: any) {
        console.error('Invoice fetch failed:', error.message);
      }

      const pendingCount = await InvoicesDBService.getPendingInvoiceCount();
      console.log(`Sync complete. Pending invoices: ${pendingCount}`);

      set({
        lastSyncTime: new Date().toISOString(),
        pendingInvoices: pendingCount,
        isSyncing: false,
        status: pendingCount > 0 ? 'offline' : 'online',
      });

      console.log('Sync completed');
    } catch (error) {
      console.error('Sync failed with unexpected error:', error);
      // Always reset syncing state even on error
      set({
        isSyncing: false,
        status: 'offline',
      });
    }
  },

  updateLastSyncTime: () => {
    set({ lastSyncTime: new Date().toISOString() });
  },

  initNetworkListener: () => {
    // Get initial network state
    NetInfo.fetch().then(state => {
      const isConnected = state.isConnected === true;
      const initialStatus = isConnected ? 'online' : 'offline';
      console.log(`Initial network status: ${initialStatus}`, state);
      set({ status: initialStatus });
    });

    // Listen for network changes
    const unsubscribe = NetInfo.addEventListener(state => {
      console.log('Network state changed:', state);

      const isConnected = state.isConnected === true;
      const wasOnline = get().status === 'online';
      const newStatus = isConnected ? 'online' : 'offline';

      console.log(`Network status: ${newStatus} (was: ${get().status})`);
      set({ status: newStatus });

      // Auto-sync when coming back online (only if we were offline before)
      if (isConnected && !wasOnline) {
        console.log('Network restored! Checking for pending invoices...');

        // Small delay to ensure connection is stable
        setTimeout(async () => {
          try {
            const pendingCount = await InvoicesDBService.getPendingInvoiceCount();
            console.log(`Found ${pendingCount} pending invoice(s)`);

            if (pendingCount > 0) {
              console.log(`Starting auto-sync for ${pendingCount} pending invoice(s)...`);
              get().startSync();
            }
          } catch (error) {
            console.error('Failed to check pending invoices:', error);
          }
        }, 2000); // 2 second delay for stability
      }
    });

    console.log('Network listener initialized');

    // Return unsubscribe function (optional - for cleanup)
    return unsubscribe;
  },
}));
