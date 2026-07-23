import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';
import { timestamps } from '@/core/database/schema/base.schema';
import { ClassStatus } from '@/core/database/schema/enums';
import { books } from '@/core/database/schema/books.schema';
import { teachers } from '@/core/database/schema/teachers.schema';
import { classSchedules } from '@/core/database/schema/class-schedules.schema';

export const classes = sqliteTable('classes', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  bookId: text('book_id').notNull(),
  teacherId: text('teacher_id'),
  status: text('status')
    .$type<ClassStatus>()
    .notNull()
    .default(ClassStatus.Draft),
  minCapacity: integer('min_capacity').notNull().default(8),
  targetCapacity: integer('target_capacity').notNull().default(12),
  maxCapacity: integer('max_capacity').notNull().default(15),
  notes: text('notes'),
  ...timestamps,
});

export const classesRelations = relations(classes, ({ one, many }) => ({
  book: one(books, {
    fields: [classes.bookId],
    references: [books.id],
  }),
  teacher: one(teachers, {
    fields: [classes.teacherId],
    references: [teachers.id],
  }),
  classSchedules: many(classSchedules),
}));

export type Class = typeof classes.$inferSelect;
export type InsertClass = typeof classes.$inferInsert;
