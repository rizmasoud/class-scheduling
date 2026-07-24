import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { timestamps } from '@/core/database/schema/base.schema';
import { WeekDay } from '@/core/database/schema/enums';
import { proposalClasses } from '@/core/database/schema/proposal-classes.schema';

export const proposalClassSchedules = sqliteTable('proposal_class_schedules', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  proposalClassId: text('proposal_class_id').notNull(),
  weekDay: text('week_day')
    .$type<WeekDay>()
    .notNull(),
  startTime: text('start_time').notNull(), // Stored as HH:mm
  endTime: text('end_time').notNull(), // Stored as HH:mm
  ...timestamps,
});

export const proposalClassSchedulesRelations = relations(proposalClassSchedules, ({ one }) => ({
  proposalClass: one(proposalClasses, {
    fields: [proposalClassSchedules.proposalClassId],
    references: [proposalClasses.id],
  }),
}));

export type ProposalClassSchedule = typeof proposalClassSchedules.$inferSelect;
export type InsertProposalClassSchedule = typeof proposalClassSchedules.$inferInsert;
