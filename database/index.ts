/**
 * Database Manager - Singleton
 *
 * Manages SQLite database connection, initialization, and lifecycle.
 * Provides centralized access to the database instance throughout the app.
 */

import * as SQLite from 'expo-sqlite';
import { applyMigrations } from './migrations';

const DATABASE_NAME = 'surelaces.db';

class DatabaseManager {
  private static instance: DatabaseManager;
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Initialize database connection and run migrations
   * Safe to call multiple times - will only initialize once
   */
  async initialize(): Promise<void> {
    // If already initialized, return immediately
    if (this.isInitialized) {
      return;
    }

    // If initialization is in progress, wait for it
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Start initialization
    this.initializationPromise = this._initialize();
    await this.initializationPromise;
  }

  private async _initialize(): Promise<void> {
    try {
      console.log('Initializing database...');

      // Open database (creates if doesn't exist)
      this.db = await SQLite.openDatabaseAsync(DATABASE_NAME);

      // Enable foreign keys
      await this.db.execAsync('PRAGMA foreign_keys = ON;');

      // Enable Write-Ahead Logging for better performance
      await this.db.execAsync('PRAGMA journal_mode = WAL;');

      // Run migrations
      await applyMigrations(this.db);

      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      this.db = null;
      this.initializationPromise = null;
      throw error;
    }
  }

  /**
   * Get database instance
   * @throws Error if database not initialized
   */
  getDatabase(): SQLite.SQLiteDatabase {
    if (!this.db || !this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first');
    }
    return this.db;
  }

  /**
   * Check if database is initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.db !== null;
  }

  /**
   * Clear all data from all tables (used on logout)
   * Maintains table structure, only deletes data
   */
  async clearAllData(): Promise<void> {
    if (!this.db) {
      console.warn('Database not initialized, nothing to clear');
      return;
    }

    try {
      console.log('Clearing all database data...');

      // Delete in order to respect foreign key constraints
      const tables = ['invoice_items', 'invoices', 'cart_items', 'products_fts', 'products', 'sync_metadata'];

      for (const table of tables) {
        await this.db.execAsync(`DELETE FROM ${table}`);
      }

      // Reset FTS table
      await this.db.execAsync('DELETE FROM products_fts');

      console.log('All database data cleared successfully');
    } catch (error) {
      console.error('Failed to clear database data:', error);
      throw error;
    }
  }

  /**
   * Get database statistics (for debugging/monitoring)
   */
  async getStats(): Promise<{
    productCount: number;
    cartItemCount: number;
    invoiceCount: number;
    pendingInvoiceCount: number;
  }> {
    if (!this.db || !this.isInitialized) {
      return {
        productCount: 0,
        cartItemCount: 0,
        invoiceCount: 0,
        pendingInvoiceCount: 0,
      };
    }

    try {
      const productCount = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM products WHERE is_active = 1'
      );

      const cartItemCount = await this.db.getFirstAsync<{ count: number }>(
        'SELECT SUM(quantity) as count FROM cart_items'
      );

      const invoiceCount = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM invoices'
      );

      const pendingInvoiceCount = await this.db.getFirstAsync<{ count: number }>(
        "SELECT COUNT(*) as count FROM invoices WHERE sync_status = 'PENDING'"
      );

      return {
        productCount: productCount?.count || 0,
        cartItemCount: cartItemCount?.count || 0,
        invoiceCount: invoiceCount?.count || 0,
        pendingInvoiceCount: pendingInvoiceCount?.count || 0,
      };
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return {
        productCount: 0,
        cartItemCount: 0,
        invoiceCount: 0,
        pendingInvoiceCount: 0,
      };
    }
  }

  /**
   * Close database connection (rarely needed in mobile apps)
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.isInitialized = false;
      this.initializationPromise = null;
      console.log('Database closed');
    }
  }

  /**
   * Delete the database file entirely (nuclear option - for development/testing only)
   * Requires re-initialization after deletion
   */
  async deleteDatabase(): Promise<void> {
    try {
      if (this.db) {
        await this.close();
      }

      await SQLite.deleteDatabaseAsync(DATABASE_NAME);
      console.log('Database deleted');
    } catch (error) {
      console.error('Failed to delete database:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const dbManager = DatabaseManager.getInstance();

// Export convenience function for getting database
export const getDB = (): SQLite.SQLiteDatabase => {
  return dbManager.getDatabase();
};
