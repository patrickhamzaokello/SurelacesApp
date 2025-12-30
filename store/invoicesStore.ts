// src/store/invoicesStore.ts
import { create } from 'zustand';
import { Invoice, InvoiceItem } from '../types';
import { apiClient } from '../api/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const tax = subtotal * 0.1; // 10% tax, configurable
      const total = subtotal + tax;

      const invoice: Invoice = {
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        invoiceNumber: `INV-${Date.now()}`,
        salespersonId: userId,
        salespersonName: userName,
        items,
        subtotal,
        tax,
        total,
        createdAt: new Date().toISOString(),
        syncStatus: 'PENDING',
      };

      set(state => ({
        invoices: [invoice, ...state.invoices],
      }));

      await get().saveLocalInvoices();

      // Try to sync immediately if online
      try {
        const response = await apiClient.createInvoice(invoice);
        
        set(state => ({
          invoices: state.invoices.map(inv =>
            inv.id === invoice.id
              ? { ...inv, syncStatus: 'SYNCED', syncedAt: new Date().toISOString() }
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
      
      const invoices = await apiClient.getInvoices(params);
      
      set({
        invoices,
        isLoading: false,
      });

      await get().saveLocalInvoices();
    } catch (error: any) {
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
      return;
    }

    try {
      const response = await apiClient.syncPendingInvoices(pendingInvoices);
      
      set(state => ({
        invoices: state.invoices.map(inv =>
          inv.syncStatus === 'PENDING'
            ? { ...inv, syncStatus: 'SYNCED', syncedAt: new Date().toISOString() }
            : inv
        ),
      }));

      await get().saveLocalInvoices();
    } catch (error) {
      console.error('Failed to sync pending invoices:', error);
      throw error;
    }
  },

  getInvoiceById: (id: string) => {
    return get().invoices.find(invoice => invoice.id === id);
  },

  getPendingInvoices: () => {
    return get().invoices.filter(invoice => invoice.syncStatus === 'PENDING');
  },

  loadLocalInvoices: async () => {
    try {
      const data = await AsyncStorage.getItem(INVOICES_KEY);
      if (data) {
        const invoices = JSON.parse(data);
        set({ invoices });
      }
    } catch (error) {
      console.error('Failed to load local invoices:', error);
    }
  },

  saveLocalInvoices: async () => {
    try {
      const invoices = get().invoices;
      await AsyncStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
    } catch (error) {
      console.error('Failed to save local invoices:', error);
    }
  },
}));