// src/api/apiClient.ts
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { secureStorage } from '../utils/secureStorage';

const API_BASE_URL = 'https://surelaces.mwonya.com/'; // Replace with your API URL

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
        
        if (tokens?.accessToken) {
          config.headers.Authorization = `Bearer ${tokens.accessToken}`;
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
            
            if (!tokens?.refreshToken) {
              throw new Error('No refresh token available');
            }

            // Call refresh endpoint
            const response = await axios.post(`${API_BASE_URL}/auth/auth/token/refresh/`, {
              refreshToken: tokens.refreshToken,
            });

            const { accessToken, refreshToken, expiresIn } = response.data;
            const expiresAt = Date.now() + expiresIn * 1000;

            await secureStorage.saveTokens({
              accessToken,
              refreshToken,
              expiresAt,
            });

            // Process queued requests
            this.processQueue(null, accessToken);

            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            await secureStorage.clearAll();
            
            // Trigger logout in the app
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

  // API Methods
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/auth/login/', { email, password });
    return response.data;
  }

  async getProducts() {
    const response = await this.client.get('/pos/products/');
    return response.data.results;
  }

  async createInvoice(invoice: any) {
    const response = await this.client.post('/pos/invoices/', invoice);
    return response.data;
  }

  async getInvoices(params?: { startDate?: string; endDate?: string; salespersonId?: string }) {
    const response = await this.client.get('/pos/invoices/', { params });
    return response.data.results;
  }

  async getDashboardStats() {
    const response = await this.client.get('/pos/dashboard/stats/');
    return response.data;
  }

  async syncPendingInvoices(invoices: any[]) {

    console.log('Syncing invoices:', invoices); // Debug log

    const response = await this.client.post('/pos/invoices/bulk-sync/', { invoices });
    return response.data;
  }

  // Add more API methods as needed
  getClient() {
    return this.client;
  }
}

export const apiClient = new ApiClient();