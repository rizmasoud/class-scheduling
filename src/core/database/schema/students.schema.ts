import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { timestamps, softDeletes } from '@/core/database/schema/base.schema';
import { studentPreferences } from '@/core/database/schema/student-preferences.schema';
import { classStudents } from '@/core/database/schema/class-students.schema';

export const students = sqliteTable('students', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  fullName: text('full_name').notNull(),
  currentBookId: text('current_book_id').notNull(),
  notes: text('notes'),
  ...timestamps,
  ...softDeletes,
});

export const studentsRelations = relations(students, ({ one, many }) => ({
  studentPreference: one(studentPreferences),
  classStudents: many(classStudents),
}));

export type Student = typeof students.$inferSelect;
export type InsertStudent = typeof students.$inferInsert;
