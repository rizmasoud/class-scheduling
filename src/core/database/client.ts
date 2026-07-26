import Database from '@tauri-apps/plugin-sql';
import { initializeDrizzle } from './drizzle';
import { appConfig } from '@/core/config';
import { logger } from '@/core/logger';
import { DatabaseError } from '@/core/errors';
import { MockDatabase } from './mock-db';

let _db: ReturnType<typeof initializeDrizzle> | null = null;
let _tauriDb: Database | any | null = null;

/**
 * Initializes and returns the Drizzle database client.
 * It uses `@tauri-apps/plugin-sql` as the underlying driver, which is the most appropriate
 * solution for Tauri applications because it allows native filesystem access to SQLite
 * bypassing browser sandbox limits (e.g., IndexedDB quotas, clearing mechanisms).
 */
export const getDatabase = async () => {
  if (_db) return _db;

  try {
    // Check if we are running in Tauri
    const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
    
    if (isTauri) {
      // The database name is dynamically loaded from our centralized app config
      _tauriDb = await Database.load(`sqlite:${appConfig.database.name}`);
    } else {
      logger.warn('Tauri environment not detected, falling back to mock database');
      _tauriDb = new MockDatabase();
    }
    
    _db = initializeDrizzle(_tauriDb);
    return _db;
  } catch (error) {
    logger.error('Failed to initialize local database connection', error);
    // Fallback if load fails (e.g. in web preview)
    logger.warn('Falling back to mock database due to error');
    _tauriDb = new MockDatabase();
    _db = initializeDrizzle(_tauriDb);
    return _db;
  }
};
