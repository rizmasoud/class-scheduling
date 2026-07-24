import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { timestamps } from '@/core/database/schema/base.schema';
import { AvailableDayPattern } from '@/core/database/schema/enums';
import { teachers } from '@/core/database/schema/teachers.schema';

export const teacherPreferences = sqliteTable('teacher_preferences', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  teacherId: text('teacher_id').notNull().unique(),
  unavailableDayPattern: text('unavailable_day_pattern')
    .$type<AvailableDayPattern>(),
  unavailableTimeRanges: text('unavailable_time_ranges', { mode: 'json' }),
  maxWeeklySessions: integer('max_weekly_sessions'),
  notes: text('notes'),
  ...timestamps,
});

export const teacherPreferencesRelations = relations(teacherPreferences, ({ one }) => ({
  teacher: one(teachers, {
    fields: [teacherPreferences.teacherId],
    references: [teachers.id],
  }),
}));

export type TeacherPreference = typeof teacherPreferences.$inferSelect;
export type InsertTeacherPreference = typeof teacherPreferences.$inferInsert;
