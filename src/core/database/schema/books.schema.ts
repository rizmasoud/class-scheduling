import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { timestamps, softDeletes } from '@/core/database/schema/base.schema';
import { teacherSkills } from '@/core/database/schema/teacher-skills.schema';
import { classes } from '@/core/database/schema/classes.schema';
import { proposalClasses } from '@/core/database/schema/proposal-classes.schema';

export const books = sqliteTable(
  'books',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    level: real('level').notNull(),
    sequenceOrder: integer('sequence_order').notNull().default(0),
    sessionCount: integer('session_count').notNull(),
    ...timestamps,
    ...softDeletes,
  }
);

export const booksRelations = relations(books, ({ many }) => ({
  teacherSkills: many(teacherSkills),
  classes: many(classes),
  proposalClasses: many(proposalClasses),
}));

export type Book = typeof books.$inferSelect;
export type InsertBook = typeof books.$inferInsert;
