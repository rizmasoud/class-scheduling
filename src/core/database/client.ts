import Database from '@tauri-apps/plugin-sql';
import { initializeDrizzle } from './drizzle';
import { appConfig } from '@/core/config';
import { logger } from '@/core/logger';
import { DatabaseError } from '@/core/errors';

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

  try {
    // The database name is dynamically loaded from our centralized app config
    _tauriDb = await Database.load(`sqlite:${appConfig.database.name}`);
    
    _db = initializeDrizzle(_tauriDb);

    return _db;
  } catch (error) {
    logger.error('Failed to initialize local database connection', error);
    throw new DatabaseError('Failed to initialize local database connection');
  }
};
