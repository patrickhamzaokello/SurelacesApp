// src/store/categoriesStore.ts
import { create } from 'zustand';
import { Category } from '../types';
import { apiClient } from '../api/apiClient';

interface CategoriesState {
  categories: Category[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  
  fetchCategories: (params?: { search?: string; ordering?: string; page?: number }) => Promise<void>;
  createCategory: (data: Partial<Category>) => Promise<Category>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;
  setCategories: (categories: Category[]) => void;
}

export const useCategoriesStore = create<CategoriesState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,
  lastUpdated: null,

  fetchCategories: async (params) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await apiClient.getCategories(params);
      const categories = response.results;
      
      set({
        categories,
        isLoading: false,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || error.message || 'Failed to fetch categories',
        isLoading: false,
      });
    }
  },

  createCategory: async (data) => {
    try {
      const category = await apiClient.createCategory(data);
      
      set(state => ({
        categories: [category, ...state.categories],
        lastUpdated: new Date().toISOString(),
      }));

      return category;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to create category';
      set({ error: message });
      throw new Error(message);
    }
  },

  updateCategory: async (id, data) => {
    try {
      const updatedCategory = await apiClient.updateCategory(id, data);
      
      set(state => ({
        categories: state.categories.map(cat => 
          cat.id === id ? updatedCategory : cat
        ),
        lastUpdated: new Date().toISOString(),
      }));

      return updatedCategory;
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to update category';
      set({ error: message });
      throw new Error(message);
    }
  },

  deleteCategory: async (id) => {
    try {
      await apiClient.deleteCategory(id);
      
      set(state => ({
        categories: state.categories.filter(cat => cat.id !== id),
        lastUpdated: new Date().toISOString(),
      }));
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Failed to delete category';
      set({ error: message });
      throw new Error(message);
    }
  },

  getCategoryById: (id: string) => {
    return get().categories.find(category => category.id === id);
  },

  setCategories: (categories: Category[]) => {
    set({ categories, lastUpdated: new Date().toISOString() });
  },
}));