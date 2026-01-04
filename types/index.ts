// src/types/index.ts
export type UserRole = 'salesperson' | 'owner' | 'manager';

export interface User {
  user_id: string;
  name: string;
  email: string;
  username: string;
  phone?: string;
  bio?: string;
  store_id: string;
  store_name: string;
  role: UserRole;
  role_name?: string;
  is_verified: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  expiresAt?: number;
  loginTimestamp: number; // When user first logged in
  lastRefresh?: number; // When token was last refreshed
}

export interface Store {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  tax_rate?: string;
  currency?: string;
  is_active: boolean;
  user_count?: number;
  product_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string;
  permissions: {
    can_create_invoice: boolean;
    can_view_reports: boolean;
    can_manage_users?: boolean;
    can_manage_store?: boolean;
  };
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  parent?: string | null;
  product_count?: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  description?: string;
  category?: string;
  category_name?: string;
  price: string;
  cost?: string;
  stock: number;
  low_stock_threshold?: number;
  is_low_stock?: boolean;
  barcode?: string;
  image_url?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  image?: string; //  image URI
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type InvoiceStatus = 'PENDING' | 'SYNCED' | 'FAILED';

export interface InvoiceItem {
  id?: string;
  product: string;          // UUID - required by backend
  product_name: string;
  product_code: string;
  quantity: number;
  price: string;
  total?: string;
  created_at?: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  salesperson: string;
  salesperson_name: string;
  store_name?: string;
  items: InvoiceItem[];
  subtotal: string;
  tax: string;
  discount?: string;
  total: string;
  item_count?: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  notes?: string;
  sync_status: InvoiceStatus;
  synced_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface DashboardStats {
  today_sales: string;
  invoice_count: number;
  top_product: string;
  active_salespeople: number;
  week_sales: string;
  month_sales: string;
  low_stock_products: number;
}

export interface SalesReport {
  salesperson_id: string;
  salesperson_name: string;
  total_sales: string;
  invoice_count: number;
  average_sale: string;
}

export interface ProductReport {
  product_id: string;
  product_name: string;
  product_code: string;
  quantity_sold: number;
  total_revenue: string;
}

export interface SyncStatus {
  pending_invoices: number;
  last_sync_time: string | null;
  sync_status: 'online' | 'offline' | 'pending';
}

export interface SyncHistory {
  id: string;
  user_name: string;
  sync_type: string;
  status: 'completed' | 'failed';
  items_synced: number;
  items_failed: number;
  error_message: string;
  started_at: string;
  completed_at: string;
}

export interface BulkSyncResponse {
  synced: number;
  failed: number;
  failed_invoices: Array<{
    invoice_number: string;
    errors: any;
  }>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface SyncState {
  lastSyncTime: string | null;
  pendingInvoices: number;
  isSyncing: boolean;
  status: 'online' | 'offline' | 'syncing';
}