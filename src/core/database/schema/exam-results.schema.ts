import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { timestamps } from '@/core/database/schema/base.schema';
import { StudentResultStatus, SupervisorDecision } from '@/core/database/schema/enums';
import { classStudents } from '@/core/database/schema/class-students.schema';

export const examResults = sqliteTable('exam_results', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  classStudentId: text('class_student_id').notNull(),
  score: integer('score').notNull(),
  resultStatus: text('result_status')
    .$type<StudentResultStatus>()
    .notNull(),
  supervisorDecision: text('supervisor_decision').$type<SupervisorDecision>(),
  examDate: text('exam_date').notNull(),
  notes: text('notes'),
  ...timestamps,
});

export const examResultsRelations = relations(examResults, ({ one }) => ({
  classStudent: one(classStudents, {
    fields: [examResults.classStudentId],
    references: [classStudents.id],
  }),
}));

export type ExamResult = typeof examResults.$inferSelect;
export type InsertExamResult = typeof examResults.$inferInsert;
