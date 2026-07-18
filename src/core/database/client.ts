import Database from '@tauri-apps/plugin-sql';
import { initializeDrizzle } from './drizzle';

let _db: ReturnType<typeof initializeDrizzle> | null = null;
let _tauriDb: Database | null = null;

/**
 * Initializes and returns the Drizzle database client.
 * It uses `@tauri-apps/plugin-sql` as the underlying driver, which is the most appropriate
 * solution for Tauri applications because it allows native filesystem access to SQLite
 * bypassing browser sandbox limits (e.g., IndexedDB quotas, clearing mechanisms).
 */
export const getDatabase = async () => {
  if (_db) return _db;

  // The database name usually defaults to being stored in the app data directory
  _tauriDb = await Database.load('sqlite:edutech.db');
  
  _db = initializeDrizzle(_tauriDb);

  return _db;
};
