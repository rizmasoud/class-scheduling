import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { timestamps } from '@/core/database/schema/base.schema';
import { studentPreferences } from '@/core/database/schema/student-preferences.schema';

export const students = sqliteTable('students', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  fullName: text('full_name').notNull(),
  currentBookId: text('current_book_id').notNull(),
  notes: text('notes'),
  ...timestamps,
});

export const studentsRelations = relations(students, ({ many }) => ({
  studentPreferences: many(studentPreferences),
}));

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;
