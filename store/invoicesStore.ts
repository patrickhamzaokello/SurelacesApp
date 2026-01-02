// src/store/invoicesStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { apiClient } from '../api/apiClient';
import { Invoice, InvoiceItem } from '../types';

const INVOICES_KEY = 'local_invoices';

interface InvoicesState {
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;
  
  createInvoice: (items: InvoiceItem[], userId: string, userName: string) => Promise<string>;
  fetchInvoices: (params?: any) => Promise<void>;
  syncPendingInvoices: () => Promise<void>;
  getInvoiceById: (id: string) => Invoice | undefined;
  getPendingInvoices: () => Invoice[];
  loadLocalInvoices: () => Promise<void>;
  saveLocalInvoices: () => Promise<void>;
}

export const useInvoicesStore = create<InvoicesState>((set, get) => ({
  invoices: [],
  isLoading: false,
  error: null,

  createInvoice: async (items: InvoiceItem[], userId: string, userName: string) => {
    try {
      const subtotal = items.reduce((sum, item) => sum + (item.total ? item.total : 0), 0);
      const tax = subtotal * 0.1;
      const total = subtotal + tax;

      const invoice: Invoice = {
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        invoice_number: `INV-${Date.now()}`,
        salesperson: userId,
        salesperson_name: userName,
        items,
        subtotal,
        tax,
        total,
        created_at: new Date().toISOString(),
        sync_status: 'PENDING',
      };

      set(state => ({
        invoices: [invoice, ...state.invoices],
      }));

      await get().saveLocalInvoices();

      // Try to sync immediately if online
      try {
        const response = await apiClient.createInvoice(invoice);
        
        // Update with server response if it includes an ID
        set(state => ({
          invoices: state.invoices.map(inv =>
            inv.id === invoice.id
              ? { 
                  ...inv, 
                  id: response.id || inv.id, // Use server ID if provided
                  sync_status: 'SYNCED', 
                  synced_at: new Date().toISOString() 
                }
              : inv
          ),
        }));
        
        await get().saveLocalInvoices();
      } catch (syncError) {
        console.log('Invoice created locally, will sync later');
      }

      return invoice.id;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create invoice' });
      throw error;
    }
  },

  fetchInvoices: async (params?: any) => {
    try {
      set({ isLoading: true, error: null });
      
      const fetchedInvoices = await apiClient.getInvoices(params);
      
      // Get current invoices
      const currentInvoices = get().invoices;
      
      // Keep ALL pending invoices (they haven't synced yet)
      const pendingInvoices = currentInvoices.filter(inv => inv.sync_status === 'PENDING');
      
      // Create a map of fetched invoices by ID for easy lookup
      const fetchedMap = new Map(fetchedInvoices.map((inv: { id: any; }) => [inv.id, inv]));
      
      // Keep synced local invoices that might have been updated on server
      const updatedLocalInvoices = currentInvoices
        .filter(inv => inv.sync_status === 'SYNCED')
        .map(inv => fetchedMap.get(inv.id) || inv);
      
      // Add any new invoices from server that we don't have locally
      const localIds = new Set(currentInvoices.map(inv => inv.id));
      const newServerInvoices = fetchedInvoices.filter((inv: { id: string; }) => !localIds.has(inv.id));
      
      // Merge: pending invoices + updated local + new server invoices
      const mergedInvoices = [
        ...pendingInvoices,
        ...updatedLocalInvoices,
        ...newServerInvoices,
      ];
      
      set({
        invoices: mergedInvoices,
        isLoading: false,
      });

      await get().saveLocalInvoices();
    } catch (error: any) {
      console.error('Fetch invoices error:', error);
      set({
        error: error.message || 'Failed to fetch invoices',
        isLoading: false,
      });
      
      // Load local invoices if online fetch fails
      await get().loadLocalInvoices();
    }
  },

  syncPendingInvoices: async () => {
    const pendingInvoices = get().getPendingInvoices();
    
    if (pendingInvoices.length === 0) {
      console.log('No pending invoices to sync');
      return;
    }

    console.log(`Syncing ${pendingInvoices.length} pending invoices...`);

    try {
      // Sync each invoice individually and track results
      const syncResults = await Promise.allSettled(
        pendingInvoices.map(async (invoice) => {
          const response = await apiClient.createInvoice(invoice);
          return { localId: invoice.id, serverId: response.id, invoice };
        })
      );

      // Update successfully synced invoices
      set(state => ({
        invoices: state.invoices.map(inv => {
          const result = syncResults.find(
            r => r.status === 'fulfilled' && r.value.localId === inv.id
          );
          
          if (result && result.status === 'fulfilled') {
            return {
              ...inv,
              id: result.value.serverId || inv.id, // Update with server ID
              sync_status: 'SYNCED',
              synced_at: new Date().toISOString(),
            };
          }
          
          return inv;
        }),
      }));

      await get().saveLocalInvoices();
      
      const successCount = syncResults.filter(r => r.status === 'fulfilled').length;
      console.log(`Successfully synced ${successCount}/${pendingInvoices.length} invoices`);
      
    } catch (error) {
      console.error('Failed to sync pending invoices:', error);
      throw error;
    }
  },

  getInvoiceById: (id: string) => {
    return get().invoices.find(invoice => invoice.id === id);
  },

  getPendingInvoices: () => {
    return get().invoices.filter(invoice => invoice.sync_status === 'PENDING');
  },

  loadLocalInvoices: async () => {
    try {
      const data = await AsyncStorage.getItem(INVOICES_KEY);
      if (data) {
        const invoices = JSON.parse(data);
        set({ invoices });
        console.log(`Loaded ${invoices.length} local invoices`);
      }
    } catch (error) {
      console.error('Failed to load local invoices:', error);
    }
  },

  saveLocalInvoices: async () => {
    try {
      const invoices = get().invoices;
      await AsyncStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
      console.log(`Saved ${invoices.length} invoices to local storage`);
    } catch (error) {
      console.error('Failed to save local invoices:', error);
    }
  },
}));