// src/store/storesStore.ts
import { create } from 'zustand';
import { Store, Role } from '../types';
import { apiClient } from '../api/apiClient';

interface StoresState {
  stores: Store[];
  roles: Role[];
  currentStore: Store | null;
  isLoading: boolean;
  error: string | null;
  
  fetchStores: () => Promise<void>;
  fetchRoles: () => Promise<void>;
  fetchCurrentStore: () => Promise<void>;
  setCurrentStore: (store: Store) => void;
}

export const useStoresStore = create<StoresState>((set, get) => ({
  stores: [],
  roles: [],
  currentStore: null,
  isLoading: false,
  error: null,

  fetchStores: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const stores = await apiClient.getStores();
      
      set({
        stores,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || error.message || 'Failed to fetch stores',
        isLoading: false,
      });
    }
  },

  fetchRoles: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const roles = await apiClient.getRoles();
      
      set({
        roles,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || error.message || 'Failed to fetch roles',
        isLoading: false,
      });
    }
  },

  fetchCurrentStore: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const currentStore = await apiClient.getMyStore();
      
      set({
        currentStore,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || error.message || 'Failed to fetch current store',
        isLoading: false,
      });
    }
  },

  setCurrentStore: (store: Store) => {
    set({ currentStore: store });
  },
}));