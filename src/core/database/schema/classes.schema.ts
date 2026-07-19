import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { timestamps } from '@/core/database/schema/base.schema';
import { ClassStatus } from '@/core/database/schema/enums';

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

export type Class = typeof classes.$inferSelect;
export type InsertClass = typeof classes.$inferInsert;
