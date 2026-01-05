/**
 * Database Schema Definitions
 *
 * This file contains all SQL CREATE TABLE statements, indexes, and FTS (Full-Text Search) tables
 * for the Surelaces offline-first database.
 */

// Products table with full inventory data
export const CREATE_PRODUCTS_TABLE = `
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    category_id TEXT,
    category_name TEXT,
    price TEXT NOT NULL,
    cost TEXT,
    stock INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER,
    is_low_stock INTEGER DEFAULT 0,
    barcode TEXT,
    image_url TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT,
    updated_at TEXT,
    last_synced_at TEXT NOT NULL
  );
`;

// Indexes for fast product queries
export const CREATE_PRODUCTS_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_products_name ON products(name COLLATE NOCASE);
  CREATE INDEX IF NOT EXISTS idx_products_code ON products(code COLLATE NOCASE);
  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
  CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
  CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
`;

// Full-Text Search virtual table for lightning-fast product search
export const CREATE_PRODUCTS_FTS = `
  CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
    id UNINDEXED,
    name,
    code,
    category_name,
    content='products',
    content_rowid='rowid'
  );
`;

// Triggers to keep FTS table in sync with products table
export const CREATE_PRODUCTS_FTS_TRIGGERS = `
  CREATE TRIGGER IF NOT EXISTS products_fts_insert AFTER INSERT ON products BEGIN
    INSERT INTO products_fts(rowid, id, name, code, category_name)
    VALUES (new.rowid, new.id, new.name, new.code, new.category_name);
  END;

  CREATE TRIGGER IF NOT EXISTS products_fts_update AFTER UPDATE ON products BEGIN
    UPDATE products_fts
    SET name = new.name, code = new.code, category_name = new.category_name
    WHERE rowid = new.rowid;
  END;

  CREATE TRIGGER IF NOT EXISTS products_fts_delete AFTER DELETE ON products BEGIN
    DELETE FROM products_fts WHERE rowid = old.rowid;
  END;
`;

// Cart items table - persists shopping cart across app restarts
export const CREATE_CART_ITEMS_TABLE = `
  CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    added_at TEXT NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );
`;

export const CREATE_CART_ITEMS_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_cart_product ON cart_items(product_id);
`;

// Invoices table - offline-first with sync status tracking
export const CREATE_INVOICES_TABLE = `
  CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY NOT NULL,
    invoice_number TEXT UNIQUE NOT NULL,
    salesperson TEXT NOT NULL,
    salesperson_name TEXT NOT NULL,
    store_name TEXT,
    subtotal TEXT NOT NULL,
    tax TEXT NOT NULL,
    discount TEXT,
    total TEXT NOT NULL,
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    notes TEXT,
    sync_status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TEXT NOT NULL,
    synced_at TEXT,
    updated_at TEXT
  );
`;

export const CREATE_INVOICES_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_invoices_salesperson ON invoices(salesperson);
  CREATE INDEX IF NOT EXISTS idx_invoices_sync_status ON invoices(sync_status);
  CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
`;

// Invoice items table - line items for each invoice
export const CREATE_INVOICE_ITEMS_TABLE = `
  CREATE TABLE IF NOT EXISTS invoice_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_code TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price TEXT NOT NULL,
    subtotal TEXT,
    created_at TEXT,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
  );
`;

export const CREATE_INVOICE_ITEMS_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
  CREATE INDEX IF NOT EXISTS idx_invoice_items_product ON invoice_items(product_id);
`;

// Sync metadata table - tracks sync operations for monitoring
export const CREATE_SYNC_METADATA_TABLE = `
  CREATE TABLE IF NOT EXISTS sync_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    last_sync_time TEXT NOT NULL,
    sync_status TEXT NOT NULL,
    records_synced INTEGER DEFAULT 0,
    error_message TEXT
  );
`;

export const CREATE_SYNC_METADATA_INDEXES = `
  CREATE INDEX IF NOT EXISTS idx_sync_entity ON sync_metadata(entity_type, last_sync_time DESC);
`;

/**
 * All schema SQL statements in execution order
 */
export const SCHEMA_SQL_STATEMENTS = [
  // Products
  CREATE_PRODUCTS_TABLE,
  CREATE_PRODUCTS_INDEXES,
  CREATE_PRODUCTS_FTS,
  CREATE_PRODUCTS_FTS_TRIGGERS,

  // Cart
  CREATE_CART_ITEMS_TABLE,
  CREATE_CART_ITEMS_INDEXES,

  // Invoices
  CREATE_INVOICES_TABLE,
  CREATE_INVOICES_INDEXES,

  // Invoice Items
  CREATE_INVOICE_ITEMS_TABLE,
  CREATE_INVOICE_ITEMS_INDEXES,

  // Sync Metadata
  CREATE_SYNC_METADATA_TABLE,
  CREATE_SYNC_METADATA_INDEXES,
];
