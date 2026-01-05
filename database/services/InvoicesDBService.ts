/**
 * Invoices Database Service
 *
 * Handles all database operations for invoices including:
 * - Transactional invoice + items creation
 * - Sync status tracking
 * - Query by salesperson
 * - Pending invoice management
 */

import { getDB } from '../index';
import type { Invoice, InvoiceItem } from '@/types';

export class InvoicesDBService {
  /**
   * Create invoice with items (atomic transaction)
   * If any part fails, entire operation is rolled back
   */
  static async createInvoice(
    invoice: Omit<Invoice, 'id'> & { id?: string },
    items: InvoiceItem[]
  ): Promise<string> {
    const db = getDB();
    const invoiceId =
      invoice.id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      await db.withTransactionAsync(async () => {
        // Insert invoice
        await db.runAsync(
          `INSERT INTO invoices
          (id, invoice_number, salesperson, salesperson_name, store_name,
           subtotal, tax, discount, total, customer_name, customer_phone,
           customer_email, notes, sync_status, created_at, synced_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            invoiceId,
            invoice.invoice_number,
            invoice.salesperson,
            invoice.salesperson_name,
            invoice.store_name || null,
            invoice.subtotal,
            invoice.tax,
            invoice.discount || null,
            invoice.total,
            invoice.customer_name || null,
            invoice.customer_phone || null,
            invoice.customer_email || null,
            invoice.notes || null,
            invoice.sync_status,
            invoice.created_at,
            invoice.synced_at || null,
          ]
        );

        // Insert invoice items
        for (const item of items) {
          await db.runAsync(
            `INSERT INTO invoice_items
            (invoice_id, product_id, product_name, product_code, quantity, price, subtotal, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              invoiceId,
              item.product,
              item.product_name,
              item.product_code,
              item.quantity,
              item.price,
              item.total || null,
              new Date().toISOString(),
            ]
          );
        }
      });

      console.log(`Invoice ${invoiceId} created successfully with ${items.length} items`);
      return invoiceId;
    } catch (error) {
      console.error('Failed to create invoice:', error);
      throw error;
    }
  }

  /**
   * Get invoices by salesperson ID
   */
  static async getInvoicesBySalesperson(salespersonId: string): Promise<Invoice[]> {
    const db = getDB();

    try {
      const invoices = await db.getAllAsync<any>(
        `SELECT * FROM invoices
         WHERE salesperson = ?
         ORDER BY created_at DESC`,
        [salespersonId]
      );

      // Load items for each invoice
      return await Promise.all(
        invoices.map(async inv => {
          const items = await this.getInvoiceItems(inv.id);
          return this.mapRowToInvoice(inv, items);
        })
      );
    } catch (error) {
      console.error('Failed to get invoices by salesperson:', error);
      return [];
    }
  }

  /**
   * Get all invoices (admin view)
   */
  static async getAllInvoices(limit: number = 100): Promise<Invoice[]> {
    const db = getDB();

    try {
      const invoices = await db.getAllAsync<any>(
        'SELECT * FROM invoices ORDER BY created_at DESC LIMIT ?',
        [limit]
      );

      return await Promise.all(
        invoices.map(async inv => {
          const items = await this.getInvoiceItems(inv.id);
          return this.mapRowToInvoice(inv, items);
        })
      );
    } catch (error) {
      console.error('Failed to get all invoices:', error);
      return [];
    }
  }

  /**
   * Get pending invoices for sync
   */
  static async getPendingInvoices(): Promise<Invoice[]> {
    const db = getDB();

    try {
      const invoices = await db.getAllAsync<any>(
        `SELECT * FROM invoices
         WHERE sync_status = 'PENDING'
         ORDER BY created_at ASC`
      );
      console.log(`Found ${invoices.length} pending invoices for sync`);

      return await Promise.all(
        invoices.map(async inv => {
          const items = await this.getInvoiceItems(inv.id);
          return this.mapRowToInvoice(inv, items);
        })
      );
    } catch (error) {
      console.error('Failed to get pending invoices:', error);
      return [];
    }
  }

  /**
   * Get invoice by ID
   */
  static async getInvoiceById(invoiceId: string): Promise<Invoice | null> {
    const db = getDB();

    try {
      const invoice = await db.getFirstAsync<any>('SELECT * FROM invoices WHERE id = ?', [invoiceId]);

      if (!invoice) return null;

      const items = await this.getInvoiceItems(invoiceId);
      return this.mapRowToInvoice(invoice, items);
    } catch (error) {
      console.error('Failed to get invoice by ID:', error);
      return null;
    }
  }

  /**
   * Get invoice by invoice number
   */
  static async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null> {
    const db = getDB();

    try {
      const invoice = await db.getFirstAsync<any>('SELECT * FROM invoices WHERE invoice_number = ?', [
        invoiceNumber,
      ]);

      if (!invoice) return null;

      const items = await this.getInvoiceItems(invoice.id);
      return this.mapRowToInvoice(invoice, items);
    } catch (error) {
      console.error('Failed to get invoice by number:', error);
      return null;
    }
  }

  /**
   * Update sync status for a single invoice
   */
  static async updateSyncStatus(
    invoiceId: string,
    status: 'PENDING' | 'SYNCED' | 'FAILED',
    syncedAt?: string
  ): Promise<void> {
    const db = getDB();

    try {
      await db.runAsync('UPDATE invoices SET sync_status = ?, synced_at = ? WHERE id = ?', [
        status,
        syncedAt || null,
        invoiceId,
      ]);
    } catch (error) {
      console.error('Failed to update sync status:', error);
      throw error;
    }
  }

  /**
   * Bulk update sync status by invoice numbers (after successful sync)
   */
  static async bulkUpdateSyncStatus(invoiceNumbers: string[]): Promise<void> {
    if (invoiceNumbers.length === 0) return;

    const db = getDB();
    const now = new Date().toISOString();

    try {
      await db.withTransactionAsync(async () => {
        for (const invoiceNumber of invoiceNumbers) {
          await db.runAsync(
            `UPDATE invoices
             SET sync_status = 'SYNCED', synced_at = ?
             WHERE invoice_number = ?`,
            [now, invoiceNumber]
          );
        }
      });

      console.log(`Bulk updated ${invoiceNumbers.length} invoices to SYNCED`);
    } catch (error) {
      console.error('Failed to bulk update sync status:', error);
      throw error;
    }
  }

  /**
   * Get count of pending invoices
   */
  static async getPendingInvoiceCount(): Promise<number> {
    const db = getDB();

    try {
      const result = await db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM invoices WHERE sync_status = 'PENDING'"
      );

      return result?.count || 0;
    } catch (error) {
      console.error('Failed to get pending invoice count:', error);
      return 0;
    }
  }

  /**
   * Delete invoice (rarely used - mostly for failed invoices)
   */
  static async deleteInvoice(invoiceId: string): Promise<void> {
    const db = getDB();

    try {
      await db.withTransactionAsync(async () => {
        // Foreign key cascade will delete items automatically
        await db.runAsync('DELETE FROM invoices WHERE id = ?', [invoiceId]);
      });

      console.log(`Invoice ${invoiceId} deleted`);
    } catch (error) {
      console.error('Failed to delete invoice:', error);
      throw error;
    }
  }

  /**
   * Get invoice items for a specific invoice
   */
  private static async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    const db = getDB();

    try {
      const items = await db.getAllAsync<any>(
        'SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id',
        [invoiceId]
      );

      return items.map(item => ({
        id: item.id.toString(),
        product: item.product_id,
        product_name: item.product_name,
        product_code: item.product_code,
        quantity: item.quantity,
        price: item.price,
        total: item.subtotal,
        created_at: item.created_at,
      }));
    } catch (error) {
      console.error('Failed to get invoice items:', error);
      return [];
    }
  }

  /**
   * Map database row to Invoice type
   */
  private static mapRowToInvoice(row: any, items: InvoiceItem[]): Invoice {
    return {
      id: row.id,
      invoice_number: row.invoice_number,
      salesperson: row.salesperson,
      salesperson_name: row.salesperson_name,
      store_name: row.store_name,
      items,
      subtotal: row.subtotal,
      tax: row.tax,
      discount: row.discount,
      total: row.total,
      customer_name: row.customer_name,
      customer_phone: row.customer_phone,
      customer_email: row.customer_email,
      notes: row.notes,
      sync_status: row.sync_status as 'PENDING' | 'SYNCED' | 'FAILED',
      created_at: row.created_at,
      synced_at: row.synced_at,
      updated_at: row.updated_at,
      item_count: items.length,
    };
  }

  /**
   * Clear all invoices (used on logout or testing)
   */
  static async clearAllInvoices(): Promise<void> {
    const db = getDB();

    try {
      await db.withTransactionAsync(async () => {
        await db.runAsync('DELETE FROM invoice_items');
        await db.runAsync('DELETE FROM invoices');
      });

      console.log('All invoices cleared');
    } catch (error) {
      console.error('Failed to clear invoices:', error);
      throw error;
    }
  }
}
