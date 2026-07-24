import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { timestamps, softDeletes } from '@/core/database/schema/base.schema';
import { teacherSkills } from '@/core/database/schema/teacher-skills.schema';
import { classes } from '@/core/database/schema/classes.schema';
import { teacherPreferences } from '@/core/database/schema/teacher-preferences.schema';
import { proposalClasses } from '@/core/database/schema/proposal-classes.schema';

export const teachers = sqliteTable(
  'teachers',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    fullName: text('full_name').notNull(),
    notes: text('notes'),
    ...timestamps,
    ...softDeletes,
  }
);

export const teachersRelations = relations(teachers, ({ one, many }) => ({
  teacherSkills: many(teacherSkills),
  classes: many(classes),
  teacherPreference: one(teacherPreferences),
  proposalClasses: many(proposalClasses),
}));

export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = typeof teachers.$inferInsert;
