// src/store/productsStore.ts
import { create } from 'zustand';
import { Product } from '../types';
import { apiClient } from '../api/apiClient';

interface ProductsState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  
  fetchProducts: () => Promise<void>;
  searchProducts: (query: string) => Product[];
  getProductById: (id: string) => Product | undefined;
  setProducts: (products: Product[]) => void;
}

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,
  lastUpdated: null,

  fetchProducts: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const products = await apiClient.getProducts();
      
      set({
        products,
        isLoading: false,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch products',
        isLoading: false,
      });
    }
  },

  searchProducts: (query: string) => {
    const products = get().products;
    
    if (!query.trim()) {
      return products;
    }

    const lowerQuery = query.toLowerCase();
    
    return products.filter(
      product =>
        product.name.toLowerCase().includes(lowerQuery) ||
        product.code.toLowerCase().includes(lowerQuery)
    );
  },

  getProductById: (id: string) => {
    return get().products.find(product => product.id === id);
  },

  setProducts: (products: Product[]) => {
    set({ products, lastUpdated: new Date().toISOString() });
  },
}));