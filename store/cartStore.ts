// src/store/cartStore.ts
import { create } from 'zustand';
import { Product, CartItem } from '../types';
import { CartDBService } from '../database/services/CartDBService';

interface CartState {
  items: CartItem[];

  loadCartFromDB: () => Promise<void>;
  addItem: (product: Product, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getSubtotal: () => number;
  getTax: (taxRate?: number) => number;
  getTotal: (taxRate?: number) => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  // Load cart from SQLite on app start
  loadCartFromDB: async () => {
    try {
      const items = await CartDBService.getCartItems();
      set({ items });
    } catch (error) {
      console.error('Failed to load cart from DB:', error);
    }
  },

  addItem: async (product: Product, quantity: number = 1) => {
    try {
      await CartDBService.addItem(product.id, quantity);

      // Update in-memory state
      const items = get().items;
      const existingItem = items.find(item => item.product.id === product.id);

      if (existingItem) {
        set({
          items: items.map(item =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
        });
      } else {
        set({
          items: [...items, { product, quantity }],
        });
      }
    } catch (error) {
      console.error('Failed to add item to cart:', error);
    }
  },

  removeItem: async (productId: string) => {
    try {
      await CartDBService.removeItem(productId);

      set({
        items: get().items.filter(item => item.product.id !== productId),
      });
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
    }
  },

  updateQuantity: async (productId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await get().removeItem(productId);
        return;
      }

      await CartDBService.updateQuantity(productId, quantity);

      set({
        items: get().items.map(item =>
          item.product.id === productId ? { ...item, quantity } : item
        ),
      });
    } catch (error) {
      console.error('Failed to update cart quantity:', error);
    }
  },

  clearCart: async () => {
    try {
      await CartDBService.clearCart();
      set({ items: [] });
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  },

  getSubtotal: () => {
    return get().items.reduce(
      (total, item) => total + parseFloat(item.product.price) * item.quantity,
      0
    );
  },

  getTax: (taxRate: number = 0) => {
    return get().getSubtotal() * taxRate;
  },

  getTotal: (taxRate: number = 0) => {
    return get().getSubtotal() + get().getTax(taxRate);
  },
}));