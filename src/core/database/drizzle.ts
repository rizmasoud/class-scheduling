import { invoke } from '@tauri-apps/api/core';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { logger } from '@/core/logger';
import { DatabaseError } from '@/core/errors';

export const initializeDrizzle = () => {
  const db = drizzle(async (sql, params, method) => {
    try {
      // The Rust command execute_drizzle_sql is designed to return an array of arrays
      // which exactly matches what drizzle-orm/sqlite-proxy expects.
      const rows = await invoke<any[][]>('execute_drizzle_sql', { sql, params });
      return { rows };
    } catch (error: any) {
      logger.error(`Database query failed: ${sql}`, error);
      throw new DatabaseError(`A database operation failed: ${error?.message || error}`);
    }
  });

  return db;
};
