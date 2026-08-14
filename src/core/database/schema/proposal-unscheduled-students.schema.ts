import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { timestamps } from '@/core/database/schema/base.schema';
import { schedulingProposals } from '@/core/database/schema/scheduling-proposals.schema';
import { students } from '@/core/database/schema/students.schema';

export const proposalUnscheduledStudents = sqliteTable('proposal_unscheduled_students', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  proposalId: text('proposal_id').notNull(),
  studentId: text('student_id').notNull(),
  reasons: text('reasons', { mode: 'json' })
    .$type<string[]>()
    .notNull(),
  ...timestamps,
});

export const proposalUnscheduledStudentsRelations = relations(proposalUnscheduledStudents, ({ one }) => ({
  proposal: one(schedulingProposals, {
    fields: [proposalUnscheduledStudents.proposalId],
    references: [schedulingProposals.id],
  }),
  student: one(students, {
    fields: [proposalUnscheduledStudents.studentId],
    references: [students.id],
  }),
}));

export type ProposalUnscheduledStudent = typeof proposalUnscheduledStudents.$inferSelect;
export type InsertProposalUnscheduledStudent = typeof proposalUnscheduledStudents.$inferInsert;
