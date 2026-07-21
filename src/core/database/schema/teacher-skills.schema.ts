import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { timestamps } from '@/core/database/schema/base.schema';
import { teachers } from '@/core/database/schema/teachers.schema';
import { books } from '@/core/database/schema/books.schema';

export const teacherSkills = sqliteTable('teacher_skills', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  teacherId: text('teacher_id').notNull(),
  bookId: text('book_id').notNull(),
  ...timestamps,
});

export const teacherSkillsRelations = relations(teacherSkills, ({ one }) => ({
  teacher: one(teachers, {
    fields: [teacherSkills.teacherId],
    references: [teachers.id],
  }),
  book: one(books, {
    fields: [teacherSkills.bookId],
    references: [books.id],
  }),
}));

export type TeacherSkill = typeof teacherSkills.$inferSelect;
export type InsertTeacherSkill = typeof teacherSkills.$inferInsert;
