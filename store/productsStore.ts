// src/store/productsStore.ts
import { create } from 'zustand';
import { Product } from '../types';
import { apiClient } from '../api/apiClient';
import { ProductsDBService } from '../database/services/ProductsDBService';

interface ProductsState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;

  loadProductsFromDB: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  searchProducts: (query: string) => Promise<Product[]>;
  getProductById: (id: string) => Promise<Product | undefined>;
  setProducts: (products: Product[]) => void;
  syncProductsFromServer: () => Promise<void>;
  createProduct: (data: Partial<Product>) => Promise<Product>;
  updateProduct: (id: string, data: Partial<Product>) => Promise<Product>;
}

export const useProductsStore = create<ProductsState>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,
  lastUpdated: null,

  // Load products from local SQLite database (instant, offline-first)
  loadProductsFromDB: async () => {
    try {
      const products = await ProductsDBService.getAllProducts();
      set({ products, lastUpdated: new Date().toISOString() });
    } catch (error: any) {
      console.error('Failed to load products from DB:', error);
    }
  },

  // Fetch products from server and sync to SQLite (full replacement)
  fetchProducts: async () => {
    try {
      set({ isLoading: true, error: null });

      const response = await apiClient.getProducts();
      const serverProducts = response.results;

      // Save to SQLite (replaces all products - "server always wins")
      await ProductsDBService.clearAllProducts();
      await ProductsDBService.bulkUpsertProducts(serverProducts);

      // Update in-memory cache
      set({
        products: serverProducts,
        isLoading: false,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || error.message || 'Failed to fetch products',
        isLoading: false,
      });

      // Fallback to local DB on error
      await get().loadProductsFromDB();
    }
  },

  // Fast SQLite-powered search with FTS
  searchProducts: async (query: string) => {
    try {
      const results = await ProductsDBService.searchProducts(query);
      return results;
    } catch (error) {
      console.error('Search failed:', error);
      // Fallback to in-memory search
      const products = get().products;
      if (!query.trim()) return products;

      const lowerQuery = query.toLowerCase();
      return products.filter(
        product =>
          product.name.toLowerCase().includes(lowerQuery) ||
          product.code.toLowerCase().includes(lowerQuery)
      );
    }
  },

  getProductById: async (id: string) => {
    // Try memory first
    const memoryProduct = get().products.find(p => p.id === id);
    if (memoryProduct) return memoryProduct;

    // Fallback to DB
    const dbProduct = await ProductsDBService.getProductById(id);
    return dbProduct || undefined;
  },

  setProducts: (products: Product[]) => {
    set({ products, lastUpdated: new Date().toISOString() });
  },

  // Sync from server (called on login or manual sync)
  syncProductsFromServer: async () => {
    await get().fetchProducts();
  },

  // Create a new product
  createProduct: async (data: Partial<Product>) => {
    try {
      set({ isLoading: true, error: null });

      // Call API to create product
      const newProduct = await apiClient.createProduct(data);

      // Add to SQLite
      await ProductsDBService.bulkUpsertProducts([newProduct]);

      // Update in-memory state
      set({
        products: [...get().products, newProduct],
        isLoading: false,
      });

      return newProduct;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to create product';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },

  // Update an existing product
  updateProduct: async (id: string, data: Partial<Product>) => {
    try {
      set({ isLoading: true, error: null });

      // Call API to update product
      const updatedProduct = await apiClient.updateProduct(id, data);

      // Update in SQLite
      await ProductsDBService.bulkUpsertProducts([updatedProduct]);

      // Update in-memory state
      set({
        products: get().products.map(p => (p.id === id ? updatedProduct : p)),
        isLoading: false,
      });

      return updatedProduct;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to update product';
      set({ error: errorMessage, isLoading: false });
      throw new Error(errorMessage);
    }
  },
}));