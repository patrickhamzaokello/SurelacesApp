// src/hooks/useSync.ts
import { useEffect } from 'react';
import { useSyncStore } from '@/store/syncStore';
import { useInvoicesStore } from '@/store/invoicesStore';

export const useSync = () => {
  const {
    lastSyncTime,
    pendingInvoices,
    isSyncing,
    status,
    startSync,
    initNetworkListener,
  } = useSyncStore();

  const { getPendingInvoices } = useInvoicesStore();

  useEffect(() => {
    initNetworkListener();
  }, []);

  const getSyncIndicator = () => {
    if (status === 'syncing') {
      return { color: 'orange', text: 'Syncing...', icon: '🔄' };
    }
    if (status === 'offline') {
      return { color: 'red', text: 'Offline', icon: '🔴' };
    }
    if (pendingInvoices > 0) {
      return { color: 'orange', text: `${pendingInvoices} pending`, icon: '🟡' };
    }
    return { color: 'green', text: 'Synced', icon: '🟢' };
  };

  return {
    lastSyncTime,
    pendingInvoices: getPendingInvoices().length,
    isSyncing,
    status,
    startSync,
    getSyncIndicator,
  };
};