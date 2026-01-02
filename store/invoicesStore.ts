// src/store/invoicesStore.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { apiClient } from '../api/apiClient';
import { Invoice, InvoiceItem } from '../types';

const INVOICES_KEY = 'local_invoices';

// Helper function to validate UUID format
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Helper to clean/validate invoice before syncing
const validateInvoiceForSync = (invoice: Invoice): boolean => {
  // Check salesperson is UUID
  if (!isValidUUID(invoice.salesperson)) {
    console.error(`Invalid salesperson UUID: ${invoice.salesperson}`);
    return false;
  }
  
  // Check all product IDs are UUIDs
  for (const item of invoice.items) {
    if (!isValidUUID(item.product)) {
      console.error(`Invalid product UUID in invoice ${invoice.invoice_number}: ${item.product}`);
      return false;
    }
  }
  
  return true;
};

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
  clearInvalidInvoices: () => Promise<void>; // New method
}

export const useInvoicesStore = create<InvoicesState>((set, get) => ({
  invoices: [],
  isLoading: false,
  error: null,

  createInvoice: async (items: InvoiceItem[], userId: string, userName: string) => {
    try {
      // Validate that we're getting proper UUIDs
      if (!isValidUUID(userId)) {
        throw new Error(`Invalid user ID format: ${userId}`);
      }
      
      for (const item of items) {
        if (!isValidUUID(item.product)) {
          throw new Error(`Invalid product ID format: ${item.product}`);
        }
      }
      
      const subtotal = items.reduce((sum, item) => sum + (item.total ? item.total : 0), 0);
      const tax = subtotal * 0.1;
      const total = subtotal + tax;

      const invoice: Invoice = {
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        invoice_number: `INV-${Date.now()}`,
        salesperson: userId, // This MUST be UUID
        salesperson_name: userName,
        items, // Items MUST have product as UUID
        subtotal,
        tax,
        total,
        created_at: new Date().toISOString(),
        sync_status: 'PENDING',
      };

      console.log('Creating invoice with salesperson UUID:', userId);
      console.log('Product UUIDs:', items.map(i => i.product));

      set(state => ({
        invoices: [invoice, ...state.invoices],
      }));

      await get().saveLocalInvoices();

      // Try to sync immediately if online
      try {
        await get().syncPendingInvoices();
      } catch (syncError) {
        console.log('Invoice created locally, will sync later:', syncError);
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
      
      const currentInvoices = get().invoices;
      const pendingInvoices = currentInvoices.filter(inv => inv.sync_status === 'PENDING');
      const fetchedMap = new Map(fetchedInvoices.map((inv: { invoice_number: any; }) => [inv.invoice_number, inv]));
      
      const stillPendingInvoices = pendingInvoices.filter(
        inv => !fetchedMap.has(inv.invoice_number)
      );
      
      const mergedInvoices = [
        ...stillPendingInvoices,
        ...fetchedInvoices,
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

    // Filter out invalid invoices
    const validInvoices = pendingInvoices.filter(validateInvoiceForSync);
    const invalidCount = pendingInvoices.length - validInvoices.length;
    
    if (invalidCount > 0) {
      console.warn(`Found ${invalidCount} invalid invoice(s) with bad UUIDs. They will be skipped.`);
    }
    
    if (validInvoices.length === 0) {
      throw new Error('No valid invoices to sync. All invoices have invalid UUIDs.');
    }

    try {
      // Format invoices for bulk sync endpoint
      const formattedInvoices = validInvoices.map(invoice => {
        console.log(`Formatting invoice ${invoice.invoice_number}:`, {
          salesperson: invoice.salesperson,
          products: invoice.items.map(i => i.product),
        });
        
        return {
          id: invoice.id,
          createdAt: invoice.created_at,
          invoice_number: invoice.invoice_number,
          salesperson: invoice.salesperson, // Must be UUID!
          salespersonName: invoice.salesperson_name,
          subtotal: invoice.subtotal,
          tax: invoice.tax,
          total: invoice.total,
          syncStatus: invoice.sync_status,
          items: invoice.items.map(item => ({
            product: item.product, // Must be UUID!
            product_name: item.product_name,
            product_code: item.product_code,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          })),
        };
      });

      const response = await apiClient.bulkSyncInvoices({ invoices: formattedInvoices });

      console.log(`Bulk sync response:`, response);
      console.log(`Successfully synced: ${response.synced}/${validInvoices.length}`);
      
      if (response.failed > 0) {
        console.error('Failed invoices:', response.failed_invoices);
      }

      const failedInvoiceNumbers = new Set(
        response.failed_invoices?.map((f: { invoice_number: any; }) => f.invoice_number) || []
      );

      set(state => ({
        invoices: state.invoices.map(inv => {
          if (inv.sync_status === 'PENDING' && !failedInvoiceNumbers.has(inv.invoice_number)) {
            return {
              ...inv,
              sync_status: 'SYNCED',
              synced_at: new Date().toISOString(),
            };
          }
          return inv;
        }),
      }));

      await get().saveLocalInvoices();
      
      if (response.failed > 0) {
        const errorMessage = response.failed_invoices
          ?.map((f: { invoice_number: any; errors: any; }) => `${f.invoice_number}: ${JSON.stringify(f.errors)}`)
          .join('\n');
        throw new Error(`${response.failed} invoice(s) failed to sync:\n${errorMessage}`);
      }
      
    } catch (error: any) {
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
        
        // Log any invoices with invalid format
        const invalidInvoices = invoices.filter((inv: Invoice) => !validateInvoiceForSync(inv));
        if (invalidInvoices.length > 0) {
          console.warn(`Found ${invalidInvoices.length} invoices with invalid UUID format`);
        }
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

  clearInvalidInvoices: async () => {
    try {
      const currentInvoices = get().invoices;
      const validInvoices = currentInvoices.filter(validateInvoiceForSync);
      const removedCount = currentInvoices.length - validInvoices.length;
      
      set({ invoices: validInvoices });
      await get().saveLocalInvoices();
      
      console.log(`Cleared ${removedCount} invalid invoice(s)`);
      return;
    } catch (error) {
      console.error('Failed to clear invalid invoices:', error);
    }
  }
}));