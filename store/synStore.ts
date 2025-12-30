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
      return;
    }

    try {
      set({ isSyncing: true, status: 'syncing' });

      // Sync pending invoices
      const invoicesStore = useInvoicesStore.getState();
      await invoicesStore.syncPendingInvoices();

      // Fetch latest products
      const productsStore = useProductsStore.getState();
      await productsStore.fetchProducts();

      // Fetch latest invoices
      await invoicesStore.fetchInvoices();

      const pendingCount = invoicesStore.getPendingInvoices().length;

      set({
        lastSyncTime: new Date().toISOString(),
        pendingInvoices: pendingCount,
        isSyncing: false,
        status: 'online',
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
      set({
        status: isConnected ? 'online' : 'offline',
      });

      // Auto-sync when coming back online
      if (isConnected && get().pendingInvoices > 0) {
        get().startSync();
      }
    });
  },
}));