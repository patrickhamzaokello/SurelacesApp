// src/store/invoicesStore.ts
import { create } from 'zustand';
import { apiClient } from '../api/apiClient';
import { Invoice, InvoiceItem } from '../types';
import { InvoicesDBService } from '../database/services/InvoicesDBService';

// Helper function to validate UUID format
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Helper to clean/validate invoice before syncing
const validateInvoiceForSync = (invoice: Invoice): boolean => {
  
  // Check all product IDs are UUIDs
  for (const item of invoice.items) {
    if (!isValidUUID(item.product)) {
      return false;
    }
  }
  
  return true;
};

interface InvoicesState {
  invoices: Invoice[];
  isLoading: boolean;
  error: string | null;

  loadInvoicesFromDB: (salespersonId?: string) => Promise<void>;
  createInvoice: (items: InvoiceItem[], userId: string, userName: string) => Promise<string>;
  fetchInvoices: (params?: any) => Promise<void>;
  syncPendingInvoices: () => Promise<void>;
  getInvoiceById: (id: string) => Invoice | undefined;
  getPendingInvoices: () => Invoice[];
  clearInvalidInvoices: () => Promise<void>;
}

export const useInvoicesStore = create<InvoicesState>((set, get) => ({
  invoices: [],
  isLoading: false,
  error: null,

  // Load invoices from SQLite database
  loadInvoicesFromDB: async (salespersonId?: string) => {
    try {
      const invoices = salespersonId
        ? await InvoicesDBService.getInvoicesBySalesperson(salespersonId)
        : await InvoicesDBService.getAllInvoices();

      set({ invoices });
    } catch (error: any) {
      console.error('Failed to load invoices from DB:', error);
    }
  },

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

      const subtotal = items.reduce((sum, item) => sum + (item.total ? parseFloat(item.total) : 0), 0);
      const tax = subtotal * 0.1;
      const total = subtotal + tax;

      const invoice: Omit<Invoice, 'id' | 'item_count'> = {
        invoice_number: `INV-${Date.now()}`,
        salesperson: userId,
        salesperson_name: userName,
        items,
        subtotal: subtotal.toString(),
        tax: tax.toString(),
        total: total.toString(),
        created_at: new Date().toISOString(),
        sync_status: 'PENDING',
      };

      // Save to SQLite (transactional - invoice + items)
      const invoiceId = await InvoicesDBService.createInvoice(invoice, items);

      // Update in-memory state
      await get().loadInvoicesFromDB(userId);

      // Try to sync immediately if online
      try {
        await get().syncPendingInvoices();
      } catch (syncError) {
        // Sync failure is okay, will retry later
      }

      return invoiceId;
    } catch (error: any) {
      set({ error: error.message || 'Failed to create invoice' });
      throw error;
    }
  },

  fetchInvoices: async (params?: any) => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.getInvoices(params);
      const fetchedInvoices = response.results;

      // Get pending invoices from DB
      const pendingInvoices = await InvoicesDBService.getPendingInvoices();
      const fetchedMap = new Map(fetchedInvoices.map((inv: { invoice_number: any }) => [inv.invoice_number, inv]));

      const stillPendingInvoices = pendingInvoices.filter(inv => !fetchedMap.has(inv.invoice_number));

      const mergedInvoices = [...stillPendingInvoices, ...fetchedInvoices];

      set({
        invoices: mergedInvoices,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || error.message || 'Failed to fetch invoices',
        isLoading: false,
      });

      // Fallback to loading from local DB
      const salespersonId = params?.salespersonId;
      await get().loadInvoicesFromDB(salespersonId);
    }
  },

  syncPendingInvoices: async () => {
    const pendingInvoices = await InvoicesDBService.getPendingInvoices();

    if (pendingInvoices.length === 0) {
      return;
    }

    // Filter out invalid invoices
    const validInvoices = pendingInvoices.filter(validateInvoiceForSync);
    const invalidCount = pendingInvoices.length - validInvoices.length;

    if (invalidCount > 0) {
      console.warn(`${invalidCount} invoice(s) have invalid UUIDs and will not be synced`);
    }

    if (validInvoices.length === 0) {
      throw new Error('No valid invoices to sync. All invoices have invalid UUIDs.');
    }

    try {
      // Format invoices for bulk sync endpoint - MUST match API spec exactly
      const formattedInvoices = validInvoices.map(invoice => ({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        salesperson: invoice.salesperson,
        salespersonName: invoice.salesperson_name,
        createdAt: invoice.created_at,
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        discount: invoice.discount || "0.00",  // API expects string, not null
        total: invoice.total,
        customer_name: invoice.customer_name || "",  // API expects empty string, not null
        customer_phone: invoice.customer_phone || "",
        notes: invoice.notes || "",  // API expects empty string, not null
        syncStatus: invoice.sync_status,
        items: invoice.items.map(item => ({
          product: item.product,
          product_name: item.product_name,
          product_code: item.product_code,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
      }));

      console.log(`Syncing ${formattedInvoices.length} invoice(s) to server...`);
      console.log('First invoice data:', JSON.stringify(formattedInvoices[0], null, 2));

      const response = await apiClient.bulkSyncInvoices({ invoices: formattedInvoices });

      if (response.failed > 0) {
        console.warn(`${response.failed} invoice(s) failed to sync`);
      }

      // Get successfully synced invoice numbers
      const failedInvoiceNumbers = new Set(
        response.failed_invoices?.map((f: { invoice_number: any }) => f.invoice_number) || []
      );

      const successfulInvoiceNumbers = validInvoices
        .filter(inv => !failedInvoiceNumbers.has(inv.invoice_number))
        .map(inv => inv.invoice_number);

      // Update sync status in database
      if (successfulInvoiceNumbers.length > 0) {
        await InvoicesDBService.bulkUpdateSyncStatus(successfulInvoiceNumbers);
      }

      // Reload invoices from DB to reflect updated sync status
      const currentInvoices = get().invoices;
      const salespersonId = currentInvoices[0]?.salesperson;
      await get().loadInvoicesFromDB(salespersonId);

      if (response.failed > 0) {
        const errorMessage = response.failed_invoices
          ?.map((f: { invoice_number: any; errors: any }) => `${f.invoice_number}: ${JSON.stringify(f.errors)}`)
          .join('\n');
        throw new Error(`${response.failed} invoice(s) failed to sync:\n${errorMessage}`);
      }
    } catch (error: any) {
      console.error('Sync failed with error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      // Provide more detailed error message
      const errorDetails = error.response?.data?.detail ||
                          error.response?.data?.message ||
                          error.message ||
                          'Unknown error';

      throw new Error(`Invoice sync failed: ${errorDetails}`);
    }
  },

  getInvoiceById: (id: string) => {
    return get().invoices.find(invoice => invoice.id === id);
  },

  getPendingInvoices: () => {
    return get().invoices.filter(invoice => invoice.sync_status === 'PENDING');
  },

  clearInvalidInvoices: async () => {
    try {
      const currentInvoices = get().invoices;
      const invalidInvoices = currentInvoices.filter(inv => !validateInvoiceForSync(inv));

      // Delete invalid invoices from database
      for (const inv of invalidInvoices) {
        await InvoicesDBService.deleteInvoice(inv.id);
      }

      // Reload from DB
      const salespersonId = currentInvoices[0]?.salesperson;
      await get().loadInvoicesFromDB(salespersonId);

      console.log(`Removed ${invalidInvoices.length} invalid invoice(s)`);
    } catch (error) {
      console.error('Failed to clear invalid invoices:', error);
    }
  },
}));