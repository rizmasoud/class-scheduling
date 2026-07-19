import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { timestamps } from '@/core/database/schema/base.schema';
import { WeekDay } from '@/core/database/schema/enums';

export const classSchedules = sqliteTable('class_schedules', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  classId: text('class_id').notNull(),
  weekDay: text('week_day')
    .$type<WeekDay>()
    .notNull(),
  startTime: text('start_time').notNull(), // Stored as HH:mm
  endTime: text('end_time').notNull(), // Stored as HH:mm
  ...timestamps,
});

export type ClassSchedule = typeof classSchedules.$inferSelect;
export type InsertClassSchedule = typeof classSchedules.$inferInsert;
