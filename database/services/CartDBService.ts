/**
 * Cart Database Service
 *
 * Handles all database operations for shopping cart including:
 * - Add/update/remove items
 * - Load cart with product details
 * - Persist cart across app restarts
 */

import { getDB } from '../index';
import { ProductsDBService } from './ProductsDBService';
import type { CartItem, Product } from '@/types';

export class CartDBService {
  /**
   * Add item to cart or increment quantity if already exists
   */
  static async addItem(productId: string, quantity: number = 1): Promise<void> {
    const db = getDB();

    try {
      // Check if item already in cart
      const existing = await db.getFirstAsync<{ id: number; quantity: number }>(
        'SELECT id, quantity FROM cart_items WHERE product_id = ?',
        [productId]
      );

      if (existing) {
        // Update quantity
        await db.runAsync('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?', [quantity, existing.id]);
      } else {
        // Insert new item
        await db.runAsync('INSERT INTO cart_items (product_id, quantity, added_at) VALUES (?, ?, ?)', [
          productId,
          quantity,
          new Date().toISOString(),
        ]);
      }
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      throw error;
    }
  }

  /**
   * Update quantity for an item in cart
   * If quantity is 0 or negative, removes the item
   */
  static async updateQuantity(productId: string, quantity: number): Promise<void> {
    const db = getDB();

    try {
      if (quantity <= 0) {
        await this.removeItem(productId);
      } else {
        await db.runAsync('UPDATE cart_items SET quantity = ? WHERE product_id = ?', [quantity, productId]);
      }
    } catch (error) {
      console.error('Failed to update cart item quantity:', error);
      throw error;
    }
  }

  /**
   * Remove item from cart
   */
  static async removeItem(productId: string): Promise<void> {
    const db = getDB();

    try {
      await db.runAsync('DELETE FROM cart_items WHERE product_id = ?', [productId]);
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      throw error;
    }
  }

  /**
   * Get all cart items with full product details (JOIN)
   */
  static async getCartItems(): Promise<CartItem[]> {
    const db = getDB();

    try {
      const rows = await db.getAllAsync<any>(
        `SELECT
           c.id as cart_id,
           c.quantity,
           c.added_at,
           p.*
         FROM cart_items c
         INNER JOIN products p ON c.product_id = p.id
         ORDER BY c.added_at DESC`
      );

      return rows.map(row => ({
        product: ProductsDBService['mapRowToProduct'](row) as Product,
        quantity: row.quantity,
      }));
    } catch (error) {
      console.error('Failed to get cart items:', error);
      return [];
    }
  }

  /**
   * Get cart item by product ID
   */
  static async getCartItem(productId: string): Promise<CartItem | null> {
    const db = getDB();

    try {
      const row = await db.getFirstAsync<any>(
        `SELECT
           c.id as cart_id,
           c.quantity,
           c.added_at,
           p.*
         FROM cart_items c
         INNER JOIN products p ON c.product_id = p.id
         WHERE c.product_id = ?`,
        [productId]
      );

      if (!row) return null;

      return {
        product: ProductsDBService['mapRowToProduct'](row) as Product,
        quantity: row.quantity,
      };
    } catch (error) {
      console.error('Failed to get cart item:', error);
      return null;
    }
  }

  /**
   * Clear all items from cart
   */
  static async clearCart(): Promise<void> {
    const db = getDB();

    try {
      await db.runAsync('DELETE FROM cart_items');
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    }
  }

  /**
   * Get total number of items in cart (sum of quantities)
   */
  static async getItemCount(): Promise<number> {
    const db = getDB();

    try {
      const result = await db.getFirstAsync<{ count: number }>('SELECT SUM(quantity) as count FROM cart_items');

      return result?.count || 0;
    } catch (error) {
      console.error('Failed to get cart item count:', error);
      return 0;
    }
  }

  /**
   * Get number of unique products in cart
   */
  static async getUniqueItemCount(): Promise<number> {
    const db = getDB();

    try {
      const result = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM cart_items');

      return result?.count || 0;
    } catch (error) {
      console.error('Failed to get unique item count:', error);
      return 0;
    }
  }

  /**
   * Check if a product exists in cart
   */
  static async hasProduct(productId: string): Promise<boolean> {
    const db = getDB();

    try {
      const result = await db.getFirstAsync<{ exists: number }>(
        'SELECT EXISTS(SELECT 1 FROM cart_items WHERE product_id = ?) as exists',
        [productId]
      );

      return result?.exists === 1;
    } catch (error) {
      console.error('Failed to check if product in cart:', error);
      return false;
    }
  }
}
