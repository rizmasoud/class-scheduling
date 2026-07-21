import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { timestamps } from '@/core/database/schema/base.schema';

export const teacherSkills = sqliteTable('teacher_skills', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  teacherId: text('teacher_id').notNull(),
  bookId: text('book_id').notNull(),
  ...timestamps,
});

export type TeacherSkill = typeof teacherSkills.$inferSelect;
export type InsertTeacherSkill = typeof teacherSkills.$inferInsert;
