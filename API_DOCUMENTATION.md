# API Documentation for React Native Surelaces Project

## Base Configuration
- **Base URL**: `https://surelaces.mwonya.com/`
- **Timeout**: 30 seconds
- **Authentication**: Bearer token (JWT)
- **Content-Type**: `application/json`

## Authentication & Token Management

### 1. Login
- **Endpoint**: `POST /auth/auth/login/`
- **Request Data**:
  ```typescript
  {
    email: string,
    password: string
  }
  ```
- **Response**:
  ```typescript
  {
    user_id: string,
    name: string,
    username: string,
    store_id: string,
    store_name: string,
    role: 'salesperson' | 'owner' | 'manager',
    tokens: {
      access: string,
      refresh: string
    }
  }
  ```

### 2. Token Refresh
- **Endpoint**: `POST /auth/auth/token/refresh/`
- **Request Data**:
  ```typescript
  {
    refreshToken: string
  }
  ```
- **Response**:
  ```typescript
  {
    accessToken: string,
    refreshToken: string,
    expiresIn: number
  }
  ```

## Products Management

### 3. Get Products
- **Endpoint**: `GET /pos/products/`
- **Headers**: Authorization Bearer token
- **Response**:
  ```typescript
  {
    results: Product[] // Array of products
  }
  
  Product = {
    id: string,        // UUID
    name: string,
    code: string,
    price: number,
    stock?: number,
    category?: string
  }
  ```

## Invoice Management

### 4. Create Invoice
- **Endpoint**: `POST /pos/invoices/`
- **Headers**: Authorization Bearer token
- **Request Data**:
  ```typescript
  {
    id: string,
    invoice_number: string,
    salesperson: string,        // UUID
    salesperson_name: string,
    items: InvoiceItem[],
    subtotal: number,
    tax: number,
    total: number,
    created_at: string,         // ISO date
    sync_status: 'PENDING' | 'SYNCED' | 'FAILED'
  }
  
  InvoiceItem = {
    product: string,            // UUID - required by backend
    product_name: string,
    product_code: string,
    quantity: number,
    price: number,
    total?: number
  }
  ```

### 5. Get Invoices
- **Endpoint**: `GET /pos/invoices/`
- **Headers**: Authorization Bearer token
- **Query Parameters** (optional):
  ```typescript
  {
    startDate?: string,         // ISO date
    endDate?: string,           // ISO date
    salespersonId?: string      // UUID
  }
  ```
- **Response**:
  ```typescript
  {
    results: Invoice[]
  }
  ```

### 6. Bulk Sync Invoices
- **Endpoint**: `POST /pos/invoices/bulk-sync/`
- **Headers**: Authorization Bearer token
- **Request Data**:
  ```typescript
  {
    invoices: {
      id: string,
      createdAt: string,        // ISO date
      invoice_number: string,
      salesperson: string,      // UUID - Must be valid
      salespersonName: string,
      subtotal: number,
      tax: number,
      total: number,
      syncStatus: string,
      items: {
        product: string,        // UUID - Must be valid
        product_name: string,
        product_code: string,
        quantity: number,
        price: number,
        total: number
      }[]
    }[]
  }
  ```
- **Response**:
  ```typescript
  {
    synced: number,             // Count of successfully synced invoices
    failed: number,             // Count of failed invoices
    failed_invoices?: {         // Array of failed invoice details
      invoice_number: string,
      errors: any
    }[]
  }
  ```

## Dashboard & Analytics

### 7. Dashboard Stats
- **Endpoint**: `GET /pos/dashboard/stats/`
- **Headers**: Authorization Bearer token
- **Response**:
  ```typescript
  {
    // Dashboard statistics data structure
    // (specific structure not fully defined in codebase)
  }
  ```

## Data Types & Models

### Core Types:
```typescript
// User roles
type UserRole = 'salesperson' | 'owner' | 'manager';

// User information
interface User {
  user_id: string;
  name: string;
  email: string;
  username: string;
  store_id: string;
  store_name: string;
  role: UserRole;
}

// Authentication tokens
interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// Product information
interface Product {
  id: string;           // UUID
  name: string;
  code: string;
  price: number;
  stock?: number;
  category?: string;
}

// Cart items (local state)
interface CartItem {
  product: Product;
  quantity: number;
}

// Invoice status types
type InvoiceStatus = 'PENDING' | 'SYNCED' | 'FAILED';

// Invoice items
interface InvoiceItem {
  product: string;          // UUID - required by backend
  product_name: string;
  product_code: string;
  quantity: number;
  price: number;
  total?: number;
}

// Complete invoice
interface Invoice {
  id: string;
  invoice_number: string;
  salesperson: string;      // UUID
  salesperson_name: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  created_at: string;       // ISO date
  sync_status: InvoiceStatus;
  synced_at?: string;       // ISO date
}

// Sync state information
interface SyncState {
  lastSyncTime: string | null;
  pendingInvoices: number;
  isSyncing: boolean;
  status: 'online' | 'offline' | 'syncing';
}
```

## Authentication Flow:
1. **Login** → Receives access/refresh tokens + user data
2. **Token Storage** → Tokens stored securely with expiration
3. **Auto-refresh** → 401 responses trigger automatic token refresh
4. **Request Queuing** → Failed requests queued during token refresh
5. **Logout** → All tokens and local data cleared

## Key Features:
- **Offline Support**: Local invoice storage with sync when online
- **Token Management**: Automatic refresh with request queuing
- **UUID Validation**: Strict UUID format validation for products/users
- **Bulk Operations**: Efficient bulk syncing of multiple invoices
- **Error Handling**: Comprehensive error handling with retry logic
- **Network Awareness**: Automatic sync when network connectivity restored