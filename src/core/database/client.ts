import Database from '@tauri-apps/plugin-sql';
import { initializeDrizzle } from './drizzle';
import { appConfig } from '@/core/config';
import { logger } from '@/core/logger';
import { isTauri } from '@tauri-apps/api/core';

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
    // Check if we are running in Tauri using official API
    const inTauri = isTauri();
    
    if (inTauri) {
      console.log("Using REAL SQLite");
      // The database name is dynamically loaded from our centralized app config
      _tauriDb = await Database.load(`sqlite:${appConfig.database.name}`);
      
      // Enable WAL mode to prevent readers from blocking writers (avoids SQLITE_BUSY)
      // and enable foreign keys just in case.
      await _tauriDb.execute("PRAGMA journal_mode = WAL;");
      await _tauriDb.execute("PRAGMA foreign_keys = ON;");
    } else {
      throw new Error("Tauri environment not detected. The real database is required.");
    }
    
    _db = initializeDrizzle(_tauriDb);
    return _db;
  } catch (error) {
    logger.warn('Failed to initialize local database connection:', error);
    throw error;
  }
};
