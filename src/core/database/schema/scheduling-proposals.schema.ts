import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { timestamps } from '@/core/database/schema/base.schema';
import { SchedulingProposalStatus } from '@/core/database/schema/enums';

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

export type SchedulingProposal = typeof schedulingProposals.$inferSelect;
export type InsertSchedulingProposal = typeof schedulingProposals.$inferInsert;
