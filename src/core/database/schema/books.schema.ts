import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { timestamps } from '@/core/database/schema/base.schema';

export const books = sqliteTable(
  'books',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    level: real('level').notNull(),
    sessionCount: integer('session_count').notNull(),
    ...timestamps,
  }
);

export type Book = typeof books.$inferSelect;
export type InsertBook = typeof books.$inferInsert;
