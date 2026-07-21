import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { timestamps } from '@/core/database/schema/base.schema';
import { EnrollmentStatus } from '@/core/database/schema/enums';

export const classStudents = sqliteTable('class_students', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  classId: text('class_id').notNull(),
  studentId: text('student_id').notNull(),
  enrollmentStatus: text('enrollment_status')
    .$type<EnrollmentStatus>()
    .notNull()
    .default(EnrollmentStatus.Active),
  joinedAt: text('joined_at').notNull(),
  leftAt: text('left_at'),
  ...timestamps,
});

export type ClassStudent = typeof classStudents.$inferSelect;
export type InsertClassStudent = typeof classStudents.$inferInsert;
