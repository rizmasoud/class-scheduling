import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { timestamps } from '@/core/database/schema/base.schema';
import { ProposalClassStatus } from '@/core/database/schema/enums';

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

export type ProposalClass = typeof proposalClasses.$inferSelect;
export type InsertProposalClass = typeof proposalClasses.$inferInsert;
