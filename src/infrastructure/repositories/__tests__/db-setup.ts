import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { resolve } from 'path';

export const createTestDb = () => {
  const sqlite = new Database(':memory:');
  const db = drizzle(sqlite);
  
  migrate(db, { migrationsFolder: resolve(process.cwd(), 'src/core/database/migrations') });
  
  // Override transaction to support async callback which is required by sqlite-proxy but not better-sqlite3
  const dbAny = db as any;
  dbAny.transaction = async (cb: any) => {
    if (sqlite.inTransaction) {
      return await cb(dbAny);
    }
    try {
      sqlite.exec('BEGIN');
      const res = await cb(dbAny);
      sqlite.exec('COMMIT');
      return res;
    } catch (e) {
      if (sqlite.inTransaction) {
        sqlite.exec('ROLLBACK');
      }
      throw e;
    }
  };
  
  return dbAny;
};
