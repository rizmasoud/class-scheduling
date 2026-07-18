import Database from '@tauri-apps/plugin-sql';
import { drizzle } from 'drizzle-orm/sqlite-proxy';

/**
 * Bridges Drizzle queries with the Tauri SQL plugin.
 */
export const initializeDrizzle = (tauriDb: Database) => {
  return drizzle(async (sql, params, method) => {
    try {
      if (method === 'run') {
        await tauriDb.execute(sql, params);
        return { rows: [] };
      }

      // Tauri's SQL plugin returns an array of objects for SELECT queries
      const result = await tauriDb.select<any[]>(sql, params);

      if (method === 'get') {
        return { rows: result[0] };
      }

      if (method === 'values') {
        // Map objects back to arrays of values as expected by Drizzle in some contexts
        return { rows: result.map(Object.values) as any[] };
      }

      return { rows: result };
    } catch (error) {
      console.error('Database query failed:', error);
      throw error;
    }
  });
};
