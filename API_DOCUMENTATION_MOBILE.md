# Kikubo POS Machine - API Documentation for Mobile Developers

**Base URL:** `https://surelaces.mwonya.com`  
**Version:** v1  
**Protocol:** HTTP/HTTPS

---

## 📋 Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Store & Roles](#store--roles)
4. [Products](#products)
5. [Categories](#categories)
6. [Invoices (Sales)](#invoices-sales)
7. [Reports & Analytics](#reports--analytics)
8. [Sync Management](#sync-management)
9. [Social Authentication](#social-authentication)
10. [Error Handling](#error-handling)
11. [Best Practices](#best-practices)

---

## 🔐 Authentication

All authenticated endpoints require a JWT Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### 1.1 User Registration

**Endpoint:** `POST /auth/register/`  
**Authentication:** None (Public)

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "password123",
  "phone": "+256700000000",
  "store_id": "uuid-of-store",
  "role_id": "uuid-of-role"
}
```

**Response (201 Created):**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "**hidden**",
  "phone": "+256700000000",
  "store_id": "uuid-of-store",
  "role_id": "uuid-of-role",
  "user_id": "generated-uuid",
  "username": "johndoe",
  "store_name": "Main Store",
  "role_name": "salesperson"
}
```

**Important Notes:**
- User must verify email before login
- Check available stores at `/pos/stores/`
- Check available roles at `/pos/roles/`
- A verification code will be sent to the email

---

### 1.2 Email Verification

**Endpoint:** `POST /auth/verify-email/`  
**Authentication:** None

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "user_id": "uuid",
  "email": "user@example.com",
  "username": "johndoe",
  "tokens": {
    "refresh": "refresh_token_here",
    "access": "access_token_here"
  }
}
```

---

### 1.3 Resend Verification Code

**Endpoint:** `POST /auth/resend-verification-code/`  
**Authentication:** None

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": "New verification code sent to your email",
  "message": "Please check your email for the new 6-digit verification code",
  "code_expires_in": "30 minutes"
}
```

---

### 1.4 User Login

**Endpoint:** `POST /auth/login/`  
**Authentication:** None (Public)

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "username": "johndoe",
  "user_id": "uuid",
  "store_id": "uuid",
  "store_name": "Main Store",
  "role": "salesperson",
  "tokens": {
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
}
```

**Important Notes:** 
- Store tokens securely
- Access token expires after 24 hours
- Use refresh token to get new access token
- User must be verified before login

---

### 1.5 Token Refresh

**Endpoint:** `POST /auth/token/refresh/`  
**Authentication:** None

**Request Body:**
```json
{
  "refresh": "your_refresh_token_here"
}
```

**Response (200 OK):**
```json
{
  "access": "new_access_token_here",
  "refresh": "your_refresh_token_here"
}
```

---

### 1.6 Logout

**Endpoint:** `POST /auth/logout/`  
**Authentication:** Required

**Request Body:**
```json
{
  "refresh": "your_refresh_token_here"
}
```

**Response (200 OK):**
```json
{
  "message": "Successfully logged out"
}
```

---

### 1.7 Password Reset Request

**Endpoint:** `POST /auth/request-reset-email/`  
**Authentication:** None

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": "If an account with this email exists, we have sent you a password reset code.",
  "message": "Please check your email for the 6-digit reset code.",
  "code_expires_in": "15 minutes"
}
```

---

### 1.8 Verify Reset Code

**Endpoint:** `POST /auth/verify-reset-code/`  
**Authentication:** None

**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Code verified successfully",
  "reset_token": "token_for_password_reset",
  "uidb64": "encoded_user_id",
  "expires_in": "10 minutes"
}
```

---

### 1.9 Complete Password Reset

**Endpoint:** `PATCH /auth/password-reset-complete/`  
**Authentication:** None

**Request Body:**
```json
{
  "password": "new_password123",
  "token": "reset_token_from_verify",
  "uidb64": "encoded_user_id_from_verify"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successful",
  "user_id": "uuid",
  "email": "user@example.com"
}
```

---

## 👤 User Management

### 2.1 Get User Profile

**Endpoint:** `GET /pos/profile/`  
**Authentication:** Required

**Response (200 OK):**
```json
{
  "user_id": "uuid",
  "username": "johndoe",
  "name": "John Doe",
  "email": "user@example.com",
  "phone": "+256700000000",
  "bio": "Salesperson at Main Store",
  "store_id": "uuid",
  "store_name": "Main Store",
  "role_name": "salesperson",
  "is_verified": true,
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-04T00:00:00Z"
}
```

---

### 2.2 Update User Profile

**Endpoint:** `PATCH /pos/profile/`  
**Authentication:** Required

**Request Body (updatable fields only):**
```json
{
  "name": "John Updated Doe",
  "phone": "+256700111111",
  "bio": "Senior Salesperson"
}
```

**Response (200 OK):**
```json
{
  "user_id": "uuid",
  "username": "johndoe",
  "name": "John Updated Doe",
  "email": "user@example.com",
  "phone": "+256700111111",
  "bio": "Senior Salesperson",
  "store_id": "uuid",
  "store_name": "Main Store",
  "role_name": "salesperson",
  "is_verified": true,
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-04T12:00:00Z"
}
```

**Note:** Cannot update: email, username, store_id, role_name

---

## 🏪 Store & Roles

### 3.1 List All Stores

**Endpoint:** `GET /pos/stores/`  
**Authentication:** None (Public)  
**Purpose:** Used during registration to select a store

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "Main Store",
    "code": "STORE001"
  },
  {
    "id": "uuid",
    "name": "Branch Store",
    "code": "STORE002"
  }
]
```

---

### 3.2 Get My Store Details

**Endpoint:** `GET /pos/stores/me/`  
**Authentication:** Required

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Main Store",
  "code": "STORE001",
  "address": "123 Main St, Kampala",
  "phone": "+256700000000",
  "email": "store@example.com",
  "tax_rate": "0.1800",
  "currency": "UGX",
  "is_active": true,
  "user_count": 10,
  "product_count": 250,
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2026-01-04T00:00:00Z"
}
```

---

### 3.3 List All Roles

**Endpoint:** `GET /pos/roles/`  
**Authentication:** None (Public)  
**Purpose:** Used during registration to select a role

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "salesperson",
    "display_name": "Salesperson",
    "description": "Can create invoices and manage products",
    "permissions": {
      "can_create_invoice": true,
      "can_view_reports": false
    }
  },
  {
    "id": "uuid",
    "name": "manager",
    "display_name": "Store Manager",
    "description": "Can manage store operations and view reports",
    "permissions": {
      "can_create_invoice": true,
      "can_view_reports": true,
      "can_manage_users": true
    }
  },
  {
    "id": "uuid",
    "name": "owner",
    "display_name": "Store Owner",
    "description": "Full access to all features",
    "permissions": {
      "can_create_invoice": true,
      "can_view_reports": true,
      "can_manage_users": true,
      "can_manage_store": true
    }
  }
]
```

---

## 📦 Products

### 4.1 List Products

**Endpoint:** `GET /pos/products/`  
**Authentication:** Required

**Query Parameters:**
- `search` (optional): Search by name, code, or barcode
- `ordering` (optional): Sort by field (e.g., `name`, `-price`, `stock`)
- `page` (optional): Page number for pagination

**Example:** `GET /pos/products/?search=laptop&ordering=-created_at&page=1`

**Response (200 OK):**
```json
{
  "count": 250,
  "next": "https://surelaces.mwonya.com/pos/products/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "name": "Dell Laptop XPS 15",
      "code": "LAPTOP001",
      "price": "1500000.00",
      "stock": 25,
      "is_active": true
    },
    {
      "id": "uuid",
      "name": "Samsung Phone",
      "code": "PHONE001",
      "price": "800000.00",
      "stock": 50,
      "is_active": true
    }
  ]
}
```

---

### 4.2 Get Product Details

**Endpoint:** `GET /pos/products/{product_id}/`  
**Authentication:** Required

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Dell Laptop XPS 15",
  "code": "LAPTOP001",
  "description": "High-performance laptop with 16GB RAM",
  "category": "uuid",
  "category_name": "Electronics",
  "price": "1500000.00",
  "cost": "1200000.00",
  "stock": 25,
  "low_stock_threshold": 5,
  "is_low_stock": false,
  "barcode": "123456789001",
  "image_url": "https://example.com/laptop.jpg",
  "is_active": true,
  "created_at": "2026-01-01T00:00:00Z",
  "updated_at": "2026-01-04T00:00:00Z"
}
```

---

### 4.3 Create Product

**Endpoint:** `POST /pos/products/`  
**Authentication:** Required

**Request Body:**
```json
{
  "name": "New Product",
  "code": "PROD001",
  "description": "Product description",
  "category": "uuid",
  "price": "100000.00",
  "cost": "80000.00",
  "stock": 50,
  "low_stock_threshold": 10,
  "barcode": "123456789",
  "image_url": "https://example.com/image.jpg"
}
```

**Response (201 Created):**
```json
{
  "id": "generated-uuid",
  "name": "New Product",
  "code": "PROD001",
  "description": "Product description",
  "category": "uuid",
  "category_name": "Category Name",
  "price": "100000.00",
  "cost": "80000.00",
  "stock": 50,
  "low_stock_threshold": 10,
  "is_low_stock": false,
  "barcode": "123456789",
  "image_url": "https://example.com/image.jpg",
  "is_active": true,
  "created_at": "2026-01-04T12:00:00Z",
  "updated_at": "2026-01-04T12:00:00Z"
}
```

---

### 4.4 Update Product

**Endpoint:** `PATCH /pos/products/{product_id}/`  
**Authentication:** Required

**Request Body (partial update):**
```json
{
  "price": "110000.00",
  "stock": 45
}
```

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "New Product",
  "code": "PROD001",
  "price": "110000.00",
  "stock": 45,
  ... // other fields
}
```

---

### 4.5 Delete Product (Soft Delete)

**Endpoint:** `DELETE /pos/products/{product_id}/`  
**Authentication:** Required

**Response (204 No Content)**

**Note:** Product is marked as inactive, not permanently deleted

---

### 4.6 Get Low Stock Products

**Endpoint:** `GET /pos/products/low-stock/`  
**Authentication:** Required

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "Product Low on Stock",
    "code": "PROD005",
    "price": "50000.00",
    "stock": 3,
    "is_active": true
  }
]
```

---

## 🏷️ Categories

### 5.1 List Categories

**Endpoint:** `GET /pos/categories/`  
**Authentication:** Required

**Query Parameters:**
- `search` (optional): Search by name
- `ordering` (optional): Sort by field
- `page` (optional): Page number

**Response (200 OK):**
```json
{
  "count": 15,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "name": "Electronics",
      "description": "Electronic devices",
      "parent": null,
      "product_count": 45,
      "is_active": true,
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-04T00:00:00Z"
    },
    {
      "id": "uuid",
      "name": "Furniture",
      "description": "Office furniture",
      "parent": null,
      "product_count": 20,
      "is_active": true,
      "created_at": "2026-01-01T00:00:00Z",
      "updated_at": "2026-01-04T00:00:00Z"
    }
  ]
}
```

---

### 5.2 Create Category

**Endpoint:** `POST /pos/categories/`  
**Authentication:** Required

**Request Body:**
```json
{
  "name": "New Category",
  "description": "Category description",
  "parent": null
}
```

**Response (201 Created):**
```json
{
  "id": "generated-uuid",
  "name": "New Category",
  "description": "Category description",
  "parent": null,
  "product_count": 0,
  "is_active": true,
  "created_at": "2026-01-04T12:00:00Z",
  "updated_at": "2026-01-04T12:00:00Z"
}
```

---

### 5.3 Update Category

**Endpoint:** `PATCH /pos/categories/{category_id}/`  
**Authentication:** Required

**Request Body:**
```json
{
  "name": "Updated Category Name",
  "description": "Updated description"
}
```

---

### 5.4 Delete Category

**Endpoint:** `DELETE /pos/categories/{category_id}/`  
**Authentication:** Required

**Response (204 No Content)**

---

## 🧾 Invoices (Sales)

### 6.1 List Invoices

**Endpoint:** `GET /pos/invoices/`  
**Authentication:** Required

**Query Parameters:**
- `ordering` (optional): Sort by field (e.g., `-created_at`)
- `page` (optional): Page number
- `start_date` (optional): Filter by start date (YYYY-MM-DD)
- `end_date` (optional): Filter by end date (YYYY-MM-DD)

**Important:**
- Salespeople only see their own invoices
- Owners/Managers see all store invoices

**Example:** `GET /pos/invoices/?start_date=2026-01-01&end_date=2026-01-31`

**Response (200 OK):**
```json
{
  "count": 150,
  "next": "https://surelaces.mwonya.com/pos/invoices/?page=2",
  "previous": null,
  "results": [
    {
      "id": "uuid",
      "invoice_number": "INV-001",
      "salesperson": "uuid",
      "salesperson_name": "John Doe",
      "items": [
        {
          "id": "uuid",
          "product": "uuid",
          "product_name": "Dell Laptop",
          "product_code": "LAPTOP001",
          "quantity": 2,
          "price": "1500000.00",
          "total": "3000000.00",
          "created_at": "2026-01-04T10:00:00Z"
        }
      ],
      "subtotal": "3000000.00",
      "tax": "540000.00",
      "discount": "0.00",
      "total": "3540000.00",
      "item_count": 1,
      "sync_status": "SYNCED",
      "created_at": "2026-01-04T10:00:00Z"
    }
  ]
}
```

---

### 6.2 Get Invoice Details

**Endpoint:** `GET /pos/invoices/{invoice_id}/`  
**Authentication:** Required

**Response (200 OK):**
```json
{
  "id": "uuid",
  "invoice_number": "INV-001",
  "salesperson": "uuid",
  "salesperson_name": "John Doe",
  "store_name": "Main Store",
  "items": [
    {
      "id": "uuid",
      "product": "uuid",
      "product_name": "Dell Laptop",
      "product_code": "LAPTOP001",
      "quantity": 2,
      "price": "1500000.00",
      "total": "3000000.00",
      "created_at": "2026-01-04T10:00:00Z"
    }
  ],
  "subtotal": "3000000.00",
  "tax": "540000.00",
  "discount": "0.00",
  "total": "3540000.00",
  "customer_name": "Jane Customer",
  "customer_phone": "+256700111111",
  "customer_email": "customer@example.com",
  "notes": "Special delivery instructions",
  "sync_status": "SYNCED",
  "synced_at": "2026-01-04T10:01:00Z",
  "created_at": "2026-01-04T10:00:00Z",
  "updated_at": "2026-01-04T10:01:00Z"
}
```

---

### 6.3 Create Invoice

**Endpoint:** `POST /pos/invoices/`  
**Authentication:** Required

**Request Body:**
```json
{
  "invoice_number": "INV-002",
  "salesperson": "uuid",
  "items": [
    {
      "product": "uuid",
      "product_name": "Dell Laptop",
      "product_code": "LAPTOP001",
      "quantity": 1,
      "price": "1500000.00"
    },
    {
      "product": "uuid",
      "product_name": "Mouse",
      "product_code": "MOUSE001",
      "quantity": 2,
      "price": "50000.00"
    }
  ],
  "discount": "50000.00",
  "customer_name": "Jane Customer",
  "customer_phone": "+256700111111",
  "customer_email": "customer@example.com",
  "notes": "Express delivery"
}
```

**Response (201 Created):**
```json
{
  "id": "generated-uuid",
  "invoice_number": "INV-002",
  "salesperson": "uuid",
  "salesperson_name": "John Doe",
  "store_name": "Main Store",
  "items": [
    {
      "id": "uuid",
      "product": "uuid",
      "product_name": "Dell Laptop",
      "product_code": "LAPTOP001",
      "quantity": 1,
      "price": "1500000.00",
      "total": "1500000.00",
      "created_at": "2026-01-04T12:00:00Z"
    },
    {
      "id": "uuid",
      "product": "uuid",
      "product_name": "Mouse",
      "product_code": "MOUSE001",
      "quantity": 2,
      "price": "50000.00",
      "total": "100000.00",
      "created_at": "2026-01-04T12:00:00Z"
    }
  ],
  "subtotal": "1600000.00",
  "tax": "288000.00",
  "discount": "50000.00",
  "total": "1838000.00",
  "customer_name": "Jane Customer",
  "customer_phone": "+256700111111",
  "customer_email": "customer@example.com",
  "notes": "Express delivery",
  "sync_status": "SYNCED",
  "synced_at": "2026-01-04T12:00:01Z",
  "created_at": "2026-01-04T12:00:00Z",
  "updated_at": "2026-01-04T12:00:01Z"
}
```

**Important Notes:**
- Stock is automatically reduced
- Subtotal, tax, and total are calculated automatically
- Transaction is atomic (all or nothing)
- Invoice cannot be created if insufficient stock

---

### 6.4 Bulk Invoice Sync (Offline Recovery)

**Endpoint:** `POST /pos/invoices/bulk-sync/`  
**Authentication:** Required  
**Purpose:** Sync multiple invoices created offline

**Request Body:**
```json
{
  "invoices": [
    {
      "id": "local-uuid-1",
      "invoice_number": "INV-OFFLINE-001",
      "salesperson": "uuid",
      "salespersonName": "John Doe",
      "createdAt": "2026-01-04T08:00:00Z",
      "subtotal": "1000000.00",
      "tax": "180000.00",
      "discount": "0.00",
      "total": "1180000.00",
      "customer_name": "Customer Name",
      "customer_phone": "+256700111111",
      "notes": "",
      "syncStatus": "PENDING",
      "items": [
        {
          "product": "uuid",
          "product_name": "Product Name",
          "product_code": "PROD001",
          "quantity": 2,
          "price": "500000.00",
          "total": "1000000.00"
        }
      ]
    },
    {
      "id": "local-uuid-2",
      "invoice_number": "INV-OFFLINE-002",
      "salesperson": "uuid",
      "salespersonName": "John Doe",
      "createdAt": "2026-01-04T09:00:00Z",
      "subtotal": "500000.00",
      "tax": "90000.00",
      "discount": "0.00",
      "total": "590000.00",
      "items": [
        {
          "product": "uuid",
          "product_name": "Another Product",
          "product_code": "PROD002",
          "quantity": 1,
          "price": "500000.00",
          "total": "500000.00"
        }
      ]
    }
  ]
}
```

**Response (200 OK):**
```json
{
  "synced": 2,
  "failed": 0,
  "failed_invoices": []
}
```

**Response with Errors:**
```json
{
  "synced": 1,
  "failed": 1,
  "failed_invoices": [
    {
      "invoice_number": "INV-OFFLINE-002",
      "errors": {
        "items": "Insufficient stock for PROD002. Available: 0, Requested: 1"
      }
    }
  ]
}
```

---

## 📊 Reports & Analytics

### 7.1 Dashboard Statistics

**Endpoint:** `GET /pos/dashboard/stats/`  
**Authentication:** Required (Owners/Managers only)

**Response (200 OK):**
```json
{
  "today_sales": "5000000.00",
  "invoice_count": 25,
  "top_product": "Dell Laptop XPS 15",
  "active_salespeople": 5,
  "week_sales": "25000000.00",
  "month_sales": "100000000.00",
  "low_stock_products": 8
}
```

---

### 7.2 Sales Report by Salesperson

**Endpoint:** `GET /pos/reports/sales/`  
**Authentication:** Required (Owners/Managers only)

**Query Parameters:**
- `start_date` (optional): Start date (YYYY-MM-DD)
- `end_date` (optional): End date (YYYY-MM-DD)

**Example:** `GET /pos/reports/sales/?start_date=2026-01-01&end_date=2026-01-31`

**Response (200 OK):**
```json
[
  {
    "salesperson_id": "uuid",
    "salesperson_name": "John Doe",
    "total_sales": "50000000.00",
    "invoice_count": 150,
    "average_sale": "333333.33"
  },
  {
    "salesperson_id": "uuid",
    "salesperson_name": "Jane Smith",
    "total_sales": "45000000.00",
    "invoice_count": 120,
    "average_sale": "375000.00"
  }
]
```

---

### 7.3 Product Sales Report

**Endpoint:** `GET /pos/reports/products/`  
**Authentication:** Required (Owners/Managers only)

**Query Parameters:**
- `start_date` (optional): Start date
- `end_date` (optional): End date
- `limit` (optional): Number of products (default: 20)

**Response (200 OK):**
```json
[
  {
    "product_id": "uuid",
    "product_name": "Dell Laptop XPS 15",
    "product_code": "LAPTOP001",
    "quantity_sold": 150,
    "total_revenue": "225000000.00"
  },
  {
    "product_id": "uuid",
    "product_name": "Samsung Phone",
    "product_code": "PHONE001",
    "quantity_sold": 200,
    "total_revenue": "160000000.00"
  }
]
```

---

## 🔄 Sync Management

### 8.1 Get Sync Status

**Endpoint:** `GET /pos/sync/status/`  
**Authentication:** Required

**Response (200 OK):**
```json
{
  "pending_invoices": 0,
  "last_sync_time": "2026-01-04T12:00:00Z",
  "sync_status": "online"
}
```

**Response (Pending):**
```json
{
  "pending_invoices": 5,
  "last_sync_time": "2026-01-04T08:00:00Z",
  "sync_status": "pending"
}
```

---

### 8.2 Get Sync History

**Endpoint:** `GET /pos/sync/history/`  
**Authentication:** Required

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "user_name": "John Doe",
    "sync_type": "invoice",
    "status": "completed",
    "items_synced": 10,
    "items_failed": 0,
    "error_message": "",
    "started_at": "2026-01-04T12:00:00Z",
    "completed_at": "2026-01-04T12:00:15Z"
  },
  {
    "id": "uuid",
    "user_name": "John Doe",
    "sync_type": "invoice",
    "status": "failed",
    "items_synced": 5,
    "items_failed": 2,
    "error_message": "Insufficient stock for some products",
    "started_at": "2026-01-04T11:00:00Z",
    "completed_at": "2026-01-04T11:00:20Z"
  }
]
```

---

## 🔗 Social Authentication

### 9.1 Google Sign In

**Endpoint:** `POST /social_auth/google/`  
**Authentication:** None

**Request Body:**
```json
{
  "auth_token": "google_id_token_here"
}
```

**Response (200 OK):**
```json
{
  "email": "user@gmail.com",
  "name": "User Name",
  "tokens": {
    "refresh": "refresh_token",
    "access": "access_token"
  }
}
```

---

### 9.2 Facebook Sign In

**Endpoint:** `POST /social_auth/facebook/`  
**Authentication:** None

**Request Body:**
```json
{
  "auth_token": "facebook_access_token_here"
}
```

---

### 9.3 Apple Sign In

**Endpoint:** `POST /social_auth/apple/`  
**Authentication:** None

**Request Body:**
```json
{
  "auth_token": "apple_token_here"
}
```

---

## ❌ Error Handling

### Standard Error Response Format

```json
{
  "error": "Error message here",
  "detail": "Detailed error description",
  "field_errors": {
    "email": ["This field is required"],
    "password": ["Password must be at least 6 characters"]
  }
}
```

### Common HTTP Status Codes

| Status Code | Meaning | When It Occurs |
|-------------|---------|----------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 204 | No Content | Delete successful |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | No permission to access resource |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Internal server error |

### Authentication Errors

**401 Unauthorized:**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**403 Forbidden:**
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### Validation Errors

**400 Bad Request:**
```json
{
  "email": ["Enter a valid email address."],
  "password": ["This field may not be blank."],
  "stock": ["Ensure this value is greater than or equal to 0."]
}
```

### Specific Business Logic Errors

**Insufficient Stock:**
```json
{
  "quantity": ["Insufficient stock. Available: 5"]
}
```

**Duplicate Entry:**
```json
{
  "code": ["Product with this code already exists."]
}
```

---

## ✅ Best Practices

### 1. Authentication

```dart
// Store tokens securely
final storage = FlutterSecureStorage();
await storage.write(key: 'access_token', value: token);
await storage.write(key: 'refresh_token', value: refreshToken);

// Add to every authenticated request
final token = await storage.read(key: 'access_token');
headers['Authorization'] = 'Bearer $token';
```

### 2. Token Refresh

```dart
// Check token expiry before requests
if (isTokenExpired()) {
  final newToken = await refreshToken();
  await storage.write(key: 'access_token', value: newToken);
}
```

### 3. Offline Support

```dart
// Store invoices locally when offline
if (!isOnline) {
  await localDB.saveInvoice(invoice);
  invoice.syncStatus = 'PENDING';
}

// Sync when back online
if (isOnline && hasPendingInvoices) {
  final pending = await localDB.getPendingInvoices();
  await api.bulkSyncInvoices(pending);
}
```

### 4. Error Handling

```dart
try {
  final response = await api.createInvoice(invoice);
  // Handle success
} on UnauthorizedException {
  // Token expired, refresh and retry
  await refreshToken();
  return createInvoice(invoice);
} on ValidationException catch (e) {
  // Show validation errors to user
  showErrors(e.errors);
} on NetworkException {
  // No internet, save offline
  await saveOffline(invoice);
}
```

### 5. Pagination

```dart
// Load initial page
List<Product> products = [];
String? nextUrl;

final response = await api.getProducts(page: 1);
products.addAll(response['results']);
nextUrl = response['next'];

// Load more when scrolling
if (nextUrl != null) {
  final response = await api.getProductsFromUrl(nextUrl);
  products.addAll(response['results']);
  nextUrl = response['next'];
}
```

### 6. Search with Debounce

```dart
Timer? _debounce;

void onSearchChanged(String query) {
  if (_debounce?.isActive ?? false) _debounce!.cancel();
  _debounce = Timer(Duration(milliseconds: 500), () {
    searchProducts(query);
  });
}
```

### 7. Caching

```dart
// Cache frequently accessed data
final cache = <String, dynamic>{};

Future<List<Product>> getProducts() async {
  if (cache.containsKey('products')) {
    return cache['products'];
  }
  
  final products = await api.getProducts();
  cache['products'] = products;
  return products;
}

// Invalidate cache when creating/updating
void invalidateProductsCache() {
  cache.remove('products');
}
```

---

## 📞 Support & Questions

For API-related questions or issues:
- **Email:** contact@mwonya.com
- **Base URL:** https://surelaces.mwonya.com
- **API Documentation:** https://surelaces.mwonya.com/swagger/

---

## 🔄 Changelog

**Version 1.0 (January 2026)**
- Initial API release
- Authentication endpoints
- Product management
- Invoice creation and sync
- Reports and analytics
- Offline support via bulk sync

---

**Last Updated:** January 4, 2026  
**API Version:** 1.0
