import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { timestamps } from '@/core/database/schema/base.schema';
import { AvailableDayPattern } from '@/core/database/schema/enums';

export const studentPreferences = sqliteTable('student_preferences', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  studentId: text('student_id').notNull(),
  availableDayPattern: text('available_day_pattern')
    .$type<AvailableDayPattern>()
    .notNull(),
  unavailableTimeRanges: text('unavailable_time_ranges', { mode: 'json' }),
  notes: text('notes'),
  ...timestamps,
});

export type StudentPreference = typeof studentPreferences.$inferSelect;
export type InsertStudentPreference = typeof studentPreferences.$inferInsert;
