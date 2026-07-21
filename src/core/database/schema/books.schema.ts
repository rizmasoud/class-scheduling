import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { timestamps } from '@/core/database/schema/base.schema';
import { teacherSkills } from '@/core/database/schema/teacher-skills.schema';

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

export const booksRelations = relations(books, ({ many }) => ({
  teacherSkills: many(teacherSkills),
}));

export type Book = typeof books.$inferSelect;
export type InsertBook = typeof books.$inferInsert;
