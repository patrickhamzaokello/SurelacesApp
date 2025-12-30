// src/store/cartStore.ts
import { create } from 'zustand';
import { Product, CartItem } from '../types';

interface CartState {
  items: CartItem[];
  
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTax: (taxRate?: number) => number;
  getTotal: (taxRate?: number) => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],

  addItem: (product: Product, quantity: number = 1) => {
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
  },

  removeItem: (productId: string) => {
    set({
      items: get().items.filter(item => item.product.id !== productId),
    });
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }

    set({
      items: get().items.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      ),
    });
  },

  clearCart: () => {
    set({ items: [] });
  },

  getSubtotal: () => {
    return get().items.reduce(
      (total, item) => total + item.product.price * item.quantity,
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