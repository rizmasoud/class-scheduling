import { text, integer } from 'drizzle-orm/sqlite-core';
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

/**
 * Reusable soft delete columns.
 * Can be spread into core business entities.
 */
export const softDeletes = {
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  archivedAt: text('archived_at'),
};
