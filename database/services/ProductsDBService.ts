/**
 * Products Database Service
 *
 * Handles all database operations for products including:
 * - Bulk upsert for sync
 * - Fast FTS (Full-Text Search)
 * - CRUD operations
 */

import { getDB } from '../index';
import type { Product } from '@/types';

export class ProductsDBService {
  /**
   * Bulk insert/replace products (used during full sync from server)
   * Uses transaction for performance
   */
  static async bulkUpsertProducts(products: Product[]): Promise<void> {
    if (products.length === 0) return;

    const db = getDB();
    const now = new Date().toISOString();

    try {
      await db.withTransactionAsync(async () => {
        for (const product of products) {
          await db.runAsync(
            `INSERT OR REPLACE INTO products
            (id, name, code, description, category_id, category_name, price, cost,
             stock, low_stock_threshold, is_low_stock, barcode, image_url,
             is_active, created_at, updated_at, last_synced_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              product.id,
              product.name,
              product.code,
              product.description || null,
              product.category || null,
              product.category_name || null,
              product.price,
              product.cost || null,
              product.stock || 0,
              product.low_stock_threshold || null,
              product.is_low_stock ? 1 : 0,
              product.barcode || null,
              product.image_url || null,
              product.is_active ? 1 : 0,
              product.created_at || null,
              product.updated_at || null,
              now,
            ]
          );
        }
      });

      console.log(`Successfully upserted ${products.length} products`);
    } catch (error) {
      console.error('Failed to bulk upsert products:', error);
      throw error;
    }
  }

  /**
   * Fast FTS search for products
   * Uses Full-Text Search for blazing fast results
   */
  static async searchProducts(query: string, limit: number = 100): Promise<Product[]> {
    const db = getDB();

    try {
      // If no query, return all active products
      if (!query || query.trim() === '') {
        return this.getAllProducts(limit);
      }

      // FTS5 search with prefix matching
      const rows = await db.getAllAsync<any>(
        `SELECT p.* FROM products p
         INNER JOIN products_fts fts ON p.rowid = fts.rowid
         WHERE products_fts MATCH ?
         AND p.is_active = 1
         ORDER BY rank
         LIMIT ?`,
        [query + '*', limit]
      );

      return rows.map(this.mapRowToProduct);
    } catch (error) {
      console.error('Product search failed:', error);
      // Fallback to LIKE search if FTS fails
      return this.searchProductsFallback(query, limit);
    }
  }

  /**
   * Fallback search using LIKE (slower but more compatible)
   */
  private static async searchProductsFallback(query: string, limit: number = 100): Promise<Product[]> {
    const db = getDB();
    const searchTerm = `%${query}%`;

    try {
      const rows = await db.getAllAsync<any>(
        `SELECT * FROM products
         WHERE (name LIKE ? OR code LIKE ? OR category_name LIKE ?)
         AND is_active = 1
         ORDER BY name
         LIMIT ?`,
        [searchTerm, searchTerm, searchTerm, limit]
      );

      return rows.map(this.mapRowToProduct);
    } catch (error) {
      console.error('Fallback search failed:', error);
      return [];
    }
  }

  /**
   * Get all active products
   */
  static async getAllProducts(limit: number = 1000): Promise<Product[]> {
    const db = getDB();

    try {
      const rows = await db.getAllAsync<any>(
        'SELECT * FROM products WHERE is_active = 1 ORDER BY name LIMIT ?',
        [limit]
      );

      return rows.map(this.mapRowToProduct);
    } catch (error) {
      console.error('Failed to get all products:', error);
      return [];
    }
  }

  /**
   * Get product by ID
   */
  static async getProductById(id: string): Promise<Product | null> {
    const db = getDB();

    try {
      const row = await db.getFirstAsync<any>('SELECT * FROM products WHERE id = ?', [id]);

      return row ? this.mapRowToProduct(row) : null;
    } catch (error) {
      console.error('Failed to get product by ID:', error);
      return null;
    }
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(categoryId: string, limit: number = 100): Promise<Product[]> {
    const db = getDB();

    try {
      const rows = await db.getAllAsync<any>(
        'SELECT * FROM products WHERE category_id = ? AND is_active = 1 ORDER BY name LIMIT ?',
        [categoryId, limit]
      );

      return rows.map(this.mapRowToProduct);
    } catch (error) {
      console.error('Failed to get products by category:', error);
      return [];
    }
  }

  /**
   * Get product count
   */
  static async getProductCount(): Promise<number> {
    const db = getDB();

    try {
      const result = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM products WHERE is_active = 1'
      );
      return result?.count || 0;
    } catch (error) {
      console.error('Failed to get product count:', error);
      return 0;
    }
  }

  /**
   * Get low stock products
   */
  static async getLowStockProducts(limit: number = 100): Promise<Product[]> {
    const db = getDB();

    try {
      const rows = await db.getAllAsync<any>(
        'SELECT * FROM products WHERE is_low_stock = 1 AND is_active = 1 ORDER BY stock ASC LIMIT ?',
        [limit]
      );

      return rows.map(this.mapRowToProduct);
    } catch (error) {
      console.error('Failed to get low stock products:', error);
      return [];
    }
  }

  /**
   * Clear all products (used before full sync)
   */
  static async clearAllProducts(): Promise<void> {
    const db = getDB();

    try {
      await db.runAsync('DELETE FROM products');
      console.log('All products cleared');
    } catch (error) {
      console.error('Failed to clear products:', error);
      throw error;
    }
  }

  /**
   * Map database row to Product type
   */
  private static mapRowToProduct(row: any): Product {
    return {
      id: row.id,
      name: row.name,
      code: row.code,
      description: row.description,
      category: row.category_id,
      category_name: row.category_name,
      price: row.price,
      cost: row.cost,
      stock: row.stock,
      low_stock_threshold: row.low_stock_threshold,
      is_low_stock: row.is_low_stock === 1,
      barcode: row.barcode,
      image_url: row.image_url,
      is_active: row.is_active === 1,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
