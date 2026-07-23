import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { timestamps } from '@/core/database/schema/base.schema';
import { teacherSkills } from '@/core/database/schema/teacher-skills.schema';
import { classes } from '@/core/database/schema/classes.schema';

export const teachers = sqliteTable(
  'teachers',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    fullName: text('full_name').notNull(),
    notes: text('notes'),
    ...timestamps,
  }
);

export const teachersRelations = relations(teachers, ({ many }) => ({
  teacherSkills: many(teacherSkills),
  classes: many(classes),
}));

export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = typeof teachers.$inferInsert;
