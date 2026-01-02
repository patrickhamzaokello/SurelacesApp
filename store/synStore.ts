// src/store/syncStore.ts
import NetInfo from '@react-native-community/netinfo';
import { create } from 'zustand';
import { SyncState } from '../types';
import { useInvoicesStore } from './invoicesStore';
import { useProductsStore } from './productsStore';

interface SyncStoreState extends SyncState {
  setOnlineStatus: (status: 'online' | 'offline') => void;
  startSync: () => Promise<void>;
  updateLastSyncTime: () => void;
  initNetworkListener: () => void;
}

export const useSyncStore = create<SyncStoreState>((set, get) => ({
  lastSyncTime: null,
  pendingInvoices: 0,
  isSyncing: false,
  status: 'offline',

  setOnlineStatus: (status: 'online' | 'offline') => {
    set({ status });
  },

  startSync: async () => {
    if (get().isSyncing) {
      console.log('Sync already in progress, skipping...');
      return;
    }

    try {
      set({ isSyncing: true, status: 'syncing' });
      console.log('Starting sync...');

      const invoicesStore = useInvoicesStore.getState();
      const productsStore = useProductsStore.getState();

      // 1. First, sync pending invoices
      try {
        await invoicesStore.syncPendingInvoices();
        console.log('Pending invoices synced');
      } catch (error) {
        console.error('Failed to sync pending invoices:', error);
        // Don't throw - continue with other sync operations
      }

      // 2. Fetch latest products
      try {
        await productsStore.fetchProducts();
        console.log('Products fetched');
      } catch (error) {
        console.error('Failed to fetch products:', error);
      }

      // 3. Fetch latest invoices (this will merge with local pending ones)
      try {
        await invoicesStore.fetchInvoices();
        console.log('Invoices fetched');
      } catch (error) {
        console.error('Failed to fetch invoices:', error);
      }

      const pendingCount = invoicesStore.getPendingInvoices().length;
      console.log(`Sync complete. ${pendingCount} invoices still pending.`);

      set({
        lastSyncTime: new Date().toISOString(),
        pendingInvoices: pendingCount,
        isSyncing: false,
        status: pendingCount > 0 ? 'offline' : 'online', // Show offline if there are pending items
      });
    } catch (error) {
      console.error('Sync failed:', error);
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
    NetInfo.addEventListener(state => {
      const isConnected = state.isConnected && state.isInternetReachable;
      const newStatus = isConnected ? 'online' : 'offline';
      
      console.log(`Network status changed: ${newStatus}`);
      set({ status: newStatus });

      // Auto-sync when coming back online and there are pending invoices
      if (isConnected) {
        const invoicesStore = useInvoicesStore.getState();
        const pendingCount = invoicesStore.getPendingInvoices().length;
        
        if (pendingCount > 0) {
          console.log(`Network restored. Syncing ${pendingCount} pending invoices...`);
          // Delay sync slightly to ensure connection is stable
          setTimeout(() => {
            get().startSync();
          }, 1000);
        }
      }
    });
  },
}));