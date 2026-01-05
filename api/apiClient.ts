// src/api/apiClient.ts
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { secureStorage } from '../utils/secureStorage';
import type { 
  User, 
  AuthTokens, 
  Product, 
  Invoice, 
  Category, 
  Store, 
  Role, 
  DashboardStats, 
  SalesReport, 
  ProductReport,
  SyncStatus,
  SyncHistory,
  BulkSyncResponse,
  PaginatedResponse 
} from '../types';

const API_BASE_URL = 'https://surelaces.mwonya.com';

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - attach access token
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const tokens = await secureStorage.getTokens();
        
        if (tokens?.access) {
          config.headers.Authorization = `Bearer ${tokens.access}`;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue this request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.client(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const tokens = await secureStorage.getTokens();
            
            if (!tokens?.refresh) {
              throw new Error('No refresh token available');
            }

            // Call refresh endpoint
            const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
              refresh: tokens.refresh,
            });

            const { access, refresh } = response.data;

            const existingTokens = await secureStorage.getTokens();
            await secureStorage.saveTokens({
              access,
              refresh,
              expiresAt: Date.now() + 24 * 60 * 60 * 1000,
              loginTimestamp: existingTokens?.loginTimestamp || Date.now(),
              lastRefresh: Date.now(),
            });

            // Process queued requests
            this.processQueue(null, access);

            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${access}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            
            // Check if 7-day session is still valid before clearing
            const existingTokens = await secureStorage.getTokens();
            if (existingTokens?.loginTimestamp) {
              const sevenDays = 7 * 24 * 60 * 60 * 1000;
              const isWithinSevenDays = Date.now() - existingTokens.loginTimestamp < sevenDays;
              
              if (!isWithinSevenDays) {
                await secureStorage.clearAll();
              }
            } else {
              await secureStorage.clearAll();
            }
            
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach((promise) => {
      if (error) {
        promise.reject(error);
      } else {
        promise.resolve(token);
      }
    });

    this.failedQueue = [];
  }

  // Authentication Methods
  async register(data: {
    email: string;
    name: string;
    password: string;
    phone: string;
    store_id: string;
    role_id: string;
  }) {
    const response = await this.client.post('/auth/register/', data);
    return response.data;
  }

  async verifyEmail(email: string, code: string) {
    const response = await this.client.post('/auth/verify-email/', { email, code });
    return response.data;
  }

  async resendVerificationCode(email: string) {
    const response = await this.client.post('/auth/resend-verification-code/', { email });
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login/', { email, password });
    return response.data;
  }

  async logout(refreshToken: string) {
    const response = await this.client.post('/auth/logout/', { refresh: refreshToken });
    return response.data;
  }

  async requestPasswordReset(email: string) {
    const response = await this.client.post('/auth/request-reset-email/', { email });
    return response.data;
  }

  async verifyResetCode(email: string, code: string) {
    const response = await this.client.post('/auth/verify-reset-code/', { email, code });
    return response.data;
  }

  async completePasswordReset(password: string, token: string, uidb64: string) {
    const response = await this.client.patch('/auth/password-reset-complete/', {
      password,
      token,
      uidb64
    });
    return response.data;
  }

  // User Profile Methods
  async getProfile(): Promise<User> {
    const response = await this.client.get('/pos/profile/');
    return response.data;
  }

  async updateProfile(data: { name?: string; phone?: string; bio?: string }): Promise<User> {
    const response = await this.client.patch('/pos/profile/', data);
    return response.data;
  }

  // Store & Roles Methods
  async getStores(): Promise<Store[]> {
    const response = await this.client.get('/pos/stores/');
    return response.data;
  }

  async getMyStore(): Promise<Store> {
    const response = await this.client.get('/pos/stores/me/');
    return response.data;
  }

  async getRoles(): Promise<Role[]> {
    const response = await this.client.get('/pos/roles/');
    return response.data;
  }

  // Product Methods
  async getProducts(params?: {
    search?: string;
    ordering?: string;
    page?: number;
  }): Promise<PaginatedResponse<Product>> {
    const response = await this.client.get('/pos/products/', { params });
    return response.data;
  }

  async getProduct(id: string): Promise<Product> {
    const response = await this.client.get(`/pos/products/${id}/`);
    return response.data;
  }

  async createProduct(data: Partial<Product>): Promise<Product> {
    const response = await this.client.post('/pos/products/', data);
    return response.data;
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const response = await this.client.patch(`/pos/products/${id}/`, data);
    return response.data;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.client.delete(`/pos/products/${id}/`);
  }

  async getLowStockProducts(): Promise<Product[]> {
    const response = await this.client.get('/pos/products/low-stock/');
    return response.data;
  }

  // Category Methods
  async getCategories(params?: {
    search?: string;
    ordering?: string;
    page?: number;
  }): Promise<PaginatedResponse<Category>> {
    const response = await this.client.get('/pos/categories/', { params });
    return response.data;
  }

  async createCategory(data: Partial<Category>): Promise<Category> {
    const response = await this.client.post('/pos/categories/', data);
    return response.data;
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const response = await this.client.patch(`/pos/categories/${id}/`, data);
    return response.data;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.client.delete(`/pos/categories/${id}/`);
  }

  // Invoice Methods
  async getInvoices(params?: {
    ordering?: string;
    page?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<PaginatedResponse<Invoice>> {
    const response = await this.client.get('/pos/invoices/', { params });
    return response.data;
  }

  async getInvoice(id: string): Promise<Invoice> {
    const response = await this.client.get(`/pos/invoices/${id}/`);
    return response.data;
  }

  async createInvoice(data: Partial<Invoice>): Promise<Invoice> {
    const response = await this.client.post('/pos/invoices/', data);
    return response.data;
  }

  async bulkSyncInvoices(data: { invoices: any[] }): Promise<BulkSyncResponse> {
    const response = await this.client.post('/pos/invoices/bulk-sync/', data);
    console.log('Bulk sync response:', response.data);
    return response.data;
  }

  // Reports & Analytics Methods
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.client.get('/pos/dashboard/stats/');
    return response.data;
  }

  async getSalesReport(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<SalesReport[]> {
    const response = await this.client.get('/pos/reports/sales/', { params });
    return response.data;
  }

  async getProductsReport(params?: {
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<ProductReport[]> {
    const response = await this.client.get('/pos/reports/products/', { params });
    return response.data;
  }

  // Sync Management Methods
  async getSyncStatus(): Promise<SyncStatus> {
    const response = await this.client.get('/pos/sync/status/');
    return response.data;
  }

  async getSyncHistory(): Promise<SyncHistory[]> {
    const response = await this.client.get('/pos/sync/history/');
    return response.data;
  }

  // Social Authentication Methods
  async googleSignIn(authToken: string) {
    const response = await this.client.post('/social_auth/google/', { auth_token: authToken });
    return response.data;
  }

  async facebookSignIn(authToken: string) {
    const response = await this.client.post('/social_auth/facebook/', { auth_token: authToken });
    return response.data;
  }

  async appleSignIn(authToken: string) {
    const response = await this.client.post('/social_auth/apple/', { auth_token: authToken });
    return response.data;
  }

  getClient() {
    return this.client;
  }
}

export const apiClient = new ApiClient();