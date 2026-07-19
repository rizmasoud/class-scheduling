import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { timestamps } from '@/core/database/schema/base.schema';

export const students = sqliteTable('students', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  fullName: text('full_name').notNull(),
  currentBookId: text('current_book_id').notNull(),
  notes: text('notes'),
  ...timestamps,
});

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;
