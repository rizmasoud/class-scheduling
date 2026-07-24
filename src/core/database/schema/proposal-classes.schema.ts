import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { timestamps } from '@/core/database/schema/base.schema';
import { ProposalClassStatus } from '@/core/database/schema/enums';
import { schedulingProposals } from '@/core/database/schema/scheduling-proposals.schema';
import { books } from '@/core/database/schema/books.schema';
import { teachers } from '@/core/database/schema/teachers.schema';
import { proposalClassSchedules } from '@/core/database/schema/proposal-class-schedules.schema';

export const proposalClasses = sqliteTable('proposal_classes', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  proposalId: text('proposal_id').notNull(),
  bookId: text('book_id').notNull(),
  teacherId: text('teacher_id'),
  generatedName: text('generated_name').notNull(),
  customName: text('custom_name'),
  score: integer('score').notNull(),
  reasons: text('reasons', { mode: 'json' })
    .$type<string[]>()
    .notNull(),
  editedBySupervisor: integer('edited_by_supervisor', { mode: 'boolean' }).notNull().default(false),
  status: text('status')
    .$type<ProposalClassStatus>()
    .notNull()
    .default(ProposalClassStatus.Pending),
  notes: text('notes'),
  ...timestamps,
});

export const proposalClassesRelations = relations(proposalClasses, ({ one, many }) => ({
  proposal: one(schedulingProposals, {
    fields: [proposalClasses.proposalId],
    references: [schedulingProposals.id],
  }),
  book: one(books, {
    fields: [proposalClasses.bookId],
    references: [books.id],
  }),
  teacher: one(teachers, {
    fields: [proposalClasses.teacherId],
    references: [teachers.id],
  }),
  proposalClassSchedules: many(proposalClassSchedules),
}));

export type ProposalClass = typeof proposalClasses.$inferSelect;
export type InsertProposalClass = typeof proposalClasses.$inferInsert;
