import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { timestamps } from '@/core/database/schema/base.schema';

export const teacherAttendance = sqliteTable('teacher_attendance', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  scheduleId: text('schedule_id').notNull(),
  attendanceDate: text('attendance_date').notNull(),
  isPresent: integer('is_present', { mode: 'boolean' }).notNull().default(true),
  notes: text('notes'),
  ...timestamps,
});

export type TeacherAttendance = typeof teacherAttendance.$inferSelect;
export type InsertTeacherAttendance = typeof teacherAttendance.$inferInsert;
