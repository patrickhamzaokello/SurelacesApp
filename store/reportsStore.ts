// src/store/reportsStore.ts
import { create } from 'zustand';
import { DashboardStats, SalesReport, ProductReport, SyncStatus, SyncHistory } from '../types';
import { apiClient } from '../api/apiClient';

interface ReportsState {
  dashboardStats: DashboardStats | null;
  salesReports: SalesReport[];
  productReports: ProductReport[];
  syncStatus: SyncStatus | null;
  syncHistory: SyncHistory[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  
  fetchDashboardStats: () => Promise<void>;
  fetchSalesReport: (params?: { start_date?: string; end_date?: string }) => Promise<void>;
  fetchProductsReport: (params?: { start_date?: string; end_date?: string; limit?: number }) => Promise<void>;
  fetchSyncStatus: () => Promise<void>;
  fetchSyncHistory: () => Promise<void>;
  clearReports: () => void;
}

export const useReportsStore = create<ReportsState>((set, get) => ({
  dashboardStats: null,
  salesReports: [],
  productReports: [],
  syncStatus: null,
  syncHistory: [],
  isLoading: false,
  error: null,
  lastUpdated: null,

  fetchDashboardStats: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const dashboardStats = await apiClient.getDashboardStats();
      
      set({
        dashboardStats,
        isLoading: false,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || error.message || 'Failed to fetch dashboard stats',
        isLoading: false,
      });
    }
  },

  fetchSalesReport: async (params) => {
    try {
      set({ isLoading: true, error: null });
      
      const salesReports = await apiClient.getSalesReport(params);
      
      set({
        salesReports,
        isLoading: false,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || error.message || 'Failed to fetch sales report',
        isLoading: false,
      });
    }
  },

  fetchProductsReport: async (params) => {
    try {
      set({ isLoading: true, error: null });
      
      const productReports = await apiClient.getProductsReport(params);
      
      set({
        productReports,
        isLoading: false,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || error.message || 'Failed to fetch products report',
        isLoading: false,
      });
    }
  },

  fetchSyncStatus: async () => {
    try {
      const syncStatus = await apiClient.getSyncStatus();
      
      set({
        syncStatus,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || error.message || 'Failed to fetch sync status',
      });
    }
  },

  fetchSyncHistory: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const syncHistory = await apiClient.getSyncHistory();
      
      set({
        syncHistory,
        isLoading: false,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.detail || error.message || 'Failed to fetch sync history',
        isLoading: false,
      });
    }
  },

  clearReports: () => {
    set({
      dashboardStats: null,
      salesReports: [],
      productReports: [],
      syncStatus: null,
      syncHistory: [],
      error: null,
    });
  },
}));