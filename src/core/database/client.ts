import { invoke, isTauri } from '@tauri-apps/api/core';
import { appConfigDir, join } from '@tauri-apps/api/path';
import { initializeDrizzle } from './drizzle';
import { appConfig } from '@/core/config';
import { logger } from '@/core/logger';

let _db: ReturnType<typeof initializeDrizzle> | null = null;

/**
 * Initializes and returns the Drizzle database client.
 * It uses a custom rust plugin backend that maintains a single rusqlite connection
 * to guarantee connection affinity for SQLite transactions across IPC boundaries.
 */
export const getDatabase = async () => {
  if (_db) return _db;

  try {
    const inTauri = isTauri();
    
    if (inTauri) {
      console.log("Using REAL SQLite via custom rusqlite connection");
      // Resolves to standard config dir where tauri-plugin-sql initially creates the db
      const configDir = await appConfigDir();
      const dbPath = await join(configDir, appConfig.database.name);
      
      // Pass absolute path to Rust backend which opens it with WAL and Foreign Keys enabled
      await invoke('init_drizzle_db', { dbPath });
    } else {
      throw new Error("Tauri environment not detected. The real database is required.");
    }
    
    _db = initializeDrizzle();
    return _db;
  } catch (error) {
    logger.warn('Failed to initialize local database connection:', error);
    throw error;
  }
};
