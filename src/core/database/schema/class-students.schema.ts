import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { timestamps } from '@/core/database/schema/base.schema';
import { EnrollmentStatus } from '@/core/database/schema/enums';
import { classes } from '@/core/database/schema/classes.schema';
import { students } from '@/core/database/schema/students.schema';
import { examResults } from '@/core/database/schema/exam-results.schema';

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

export const classStudentsRelations = relations(classStudents, ({ one, many }) => ({
  class: one(classes, {
    fields: [classStudents.classId],
    references: [classes.id],
  }),
  student: one(students, {
    fields: [classStudents.studentId],
    references: [students.id],
  }),
  examResults: many(examResults),
}));

export type ClassStudent = typeof classStudents.$inferSelect;
export type InsertClassStudent = typeof classStudents.$inferInsert;
