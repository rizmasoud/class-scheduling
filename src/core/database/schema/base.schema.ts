import { text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Reusable timestamp columns for Drizzle ORM SQLite tables.
 * Can be spread into any table definition to ensure consistent
 * audit trails without repeating column definitions.
 */
export const timestamps = {
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
};
