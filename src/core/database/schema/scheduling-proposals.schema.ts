import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { timestamps } from '@/core/database/schema/base.schema';
import { SchedulingProposalStatus } from '@/core/database/schema/enums';
import { proposalClasses } from '@/core/database/schema/proposal-classes.schema';

export const schedulingProposals = sqliteTable('scheduling_proposals', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  generatedAt: text('generated_at').notNull(),
  status: text('status')
    .$type<SchedulingProposalStatus>()
    .notNull()
    .default(SchedulingProposalStatus.Draft),
  notes: text('notes'),
  ...timestamps,
});

export const schedulingProposalsRelations = relations(schedulingProposals, ({ many }) => ({
  proposalClasses: many(proposalClasses),
}));

export type SchedulingProposal = typeof schedulingProposals.$inferSelect;
export type InsertSchedulingProposal = typeof schedulingProposals.$inferInsert;
