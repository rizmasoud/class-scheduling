import Database from '@tauri-apps/plugin-sql';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { logger } from '@/core/logger';
import { DatabaseError } from '@/core/errors';

/**
 * Bridges Drizzle queries with the Tauri SQL plugin.
 */
function parseSqlColumns(sql: string): string[] {
  const selectMatch = sql.match(/select\s+(.+?)\s+from/i);
  if (!selectMatch) return [];
  const colsStr = selectMatch[1];
  
  const columns: string[] = [];
  let currentCol = '';
  let parenDepth = 0;
  
  for (let i = 0; i < colsStr.length; i++) {
    const char = colsStr[i];
    if (char === '(') parenDepth++;
    else if (char === ')') parenDepth--;
    else if (char === ',' && parenDepth === 0) {
      columns.push(currentCol);
      currentCol = '';
      continue;
    }
    currentCol += char;
  }
  if (currentCol) columns.push(currentCol);
  
  return columns.map(s => {
    let col = s.trim();
    const asMatch = col.match(/\s+as\s+["']?([^"']+)["']?$/i);
    if (asMatch) return asMatch[1];
    
    const parts = col.split('.');
    return parts[parts.length - 1].replace(/["']/g, '');
  });
}

export const initializeDrizzle = (tauriDb: Database) => {
  const db = drizzle(async (sql, params, method) => {
    try {
      if (method === 'run') {
        // Intercept transaction commands since tauri-plugin-sql connection pool 
        // will deadlock if BEGIN and DELETE use different connections.
        const lowerSql = sql.trim().toLowerCase();
        if (lowerSql === 'begin' || 
            lowerSql === 'commit' || 
            lowerSql === 'rollback' ||
            lowerSql.startsWith('savepoint') ||
            lowerSql.startsWith('release savepoint') ||
            lowerSql.startsWith('rollback to savepoint')) {
          return { rows: [] };
        }
        await tauriDb.execute(sql, params);
        return { rows: [] };
      }

      // Tauri's SQL plugin returns an array of objects for SELECT queries
      const result = await tauriDb.select<any[]>(sql, params);

      if (method === 'get') {
        const row = result[0];
        if (!row) return { rows: [] };
        const keys = parseSqlColumns(sql);
        if (keys.length > 0) {
            return { rows: keys.map(k => row[k] ?? null) };
        }
        return { rows: Object.values(row) };
      }
      
      const keys = parseSqlColumns(sql);
      if (result.length > 0 && keys.length > 0) {
          return { rows: result.map(row => keys.map(k => row[k] ?? null)) };
      }
      
      // Map objects back to arrays of values as expected by Drizzle
      return { rows: result.map(Object.values) };
    } catch (error) {
      logger.error('Database query failed:', error);
      throw new DatabaseError('A database operation failed.');
    }
  });

  return db;
};
