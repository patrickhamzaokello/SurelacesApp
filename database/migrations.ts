/**
 * Database Migrations
 *
 * Manages database schema versioning and migrations.
 * Each migration has a version number and an up() function that applies schema changes.
 */

import * as SQLite from 'expo-sqlite';
import { SCHEMA_SQL_STATEMENTS } from './schema';

export const DATABASE_VERSION = 1;

export interface Migration {
  version: number;
  up: (db: SQLite.SQLiteDatabase) => Promise<void>;
}

/**
 * Migration Version 1: Initial schema
 * Creates all tables, indexes, and FTS tables for offline-first functionality
 */
const migration_v1: Migration = {
  version: 1,
  up: async (db: SQLite.SQLiteDatabase) => {
    console.log('Running migration v1: Initial schema');

    // Execute all schema statements
    for (const sql of SCHEMA_SQL_STATEMENTS) {
      try {
        await db.execAsync(sql);
      } catch (error) {
        console.error('Migration v1 failed on SQL:', sql.substring(0, 100));
        throw error;
      }
    }

    console.log('Migration v1 completed successfully');
  },
};

/**
 * All migrations in order
 * Future migrations should be added here
 */
export const migrations: Migration[] = [
  migration_v1,
  // Future migrations:
  // migration_v2,
  // migration_v3,
];

/**
 * Apply pending migrations to the database
 */
export async function applyMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  // Get current database version
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version || 0;

  console.log(`Current database version: ${currentVersion}`);

  // Apply pending migrations
  for (const migration of migrations) {
    if (migration.version > currentVersion) {
      console.log(`Applying migration v${migration.version}`);
      await migration.up(db);
      await db.execAsync(`PRAGMA user_version = ${migration.version}`);
      console.log(`Migration v${migration.version} applied successfully`);
    }
  }

  const newVersion = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  console.log(`Database version after migrations: ${newVersion?.user_version}`);
}
