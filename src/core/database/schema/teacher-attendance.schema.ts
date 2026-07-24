import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { timestamps } from '@/core/database/schema/base.schema';
import { classSchedules } from '@/core/database/schema/class-schedules.schema';

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

export const teacherAttendanceRelations = relations(teacherAttendance, ({ one }) => ({
  classSchedule: one(classSchedules, {
    fields: [teacherAttendance.scheduleId],
    references: [classSchedules.id],
  }),
}));

export type TeacherAttendance = typeof teacherAttendance.$inferSelect;
export type InsertTeacherAttendance = typeof teacherAttendance.$inferInsert;
