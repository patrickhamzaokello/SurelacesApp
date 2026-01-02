// src/types/index.ts
export type UserRole = 'salesperson' | 'owner' | 'manager';

export interface User {
  user_id: string;
  name: string;
  email: string;
  username: string;
  store_id: string;
  store_name: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  price: number;
  stock?: number;
  category?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type InvoiceStatus = 'PENDING' | 'SYNCED' | 'FAILED';

export interface InvoiceItem {
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  salesperson: string;
  salesperson_name: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  created_at: string;
  sync_status: InvoiceStatus;
  synced_at?: string;
}


export interface DailySales {
  date: string;
  totalSales: number;
  invoiceCount: number;
  topProduct?: string;
}

export interface SyncState {
  lastSyncTime: string | null;
  pendingInvoices: number;
  isSyncing: boolean;
  status: 'online' | 'offline' | 'syncing';
}