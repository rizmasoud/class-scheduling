import { sqliteTable, text, real } from 'drizzle-orm/sqlite-core';
import { timestamps } from '@/core/database/schema/base.schema';

export const teachers = sqliteTable(
  'teachers',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    fullName: text('full_name').notNull(),
    maxTeachingLevel: real('max_teaching_level').notNull(),
    notes: text('notes'),
    ...timestamps,
  }
);

export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = typeof teachers.$inferInsert;
