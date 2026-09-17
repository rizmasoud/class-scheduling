import {
  pgTable,
  uniqueIndex,
  uuid,
  varchar,
  timestamp,
  boolean,
  date,
  jsonb,
  text,
  integer,
} from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';

export const academicTerms = pgTable('academic_terms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  status: varchar('status', { length: 50 }).notNull(), // 'Draft' | 'Active' | 'Completed' | 'Archived'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const systemSettings = pgTable('system_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: varchar('key', { length: 255 }).unique().notNull(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 255 }).unique().notNull(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(), // 'Supervisor' | 'Teacher'
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const supervisors = pgTable('supervisors', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .unique()
    .notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
});

export const teachers = pgTable('teachers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .unique()
    .notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  baseRatePerSession: integer('base_rate_per_session'), // Cents
  notes: text('notes'),
});

export const userSessions = pgTable('user_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  refreshToken: varchar('refresh_token', { length: 512 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  revoked: boolean('revoked').default(false).notNull(),
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  tableName: varchar('table_name', { length: 255 }).notNull(),
  recordId: uuid('record_id').notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  changedBy: uuid('changed_by').references(() => users.id, { onDelete: 'set null' }),
  oldData: jsonb('old_data'),
  newData: jsonb('new_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const books = pgTable('books', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  level: varchar('level', { length: 255 }),
  sequenceOrder: integer('sequence_order').notNull(),
  sessionCount: integer('session_count').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const bookSyllabusItems = pgTable('book_syllabus_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookId: uuid('book_id')
    .references(() => books.id, { onDelete: 'cascade' })
    .notNull(),
  sessionNumber: integer('session_number').notNull(),
  topic: varchar('topic', { length: 255 }).notNull(),
  description: text('description'),
});

export const teacherSkills = pgTable('teacher_skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  teacherId: uuid('teacher_id')
    .references(() => teachers.id, { onDelete: 'cascade' })
    .notNull(),
  bookId: uuid('book_id')
    .references(() => books.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const students = pgTable('students', {
  id: uuid('id').primaryKey().defaultRandom(),
  fullName: varchar('full_name', { length: 255 }).notNull(), // Intentionally NOT unique
  externalStudentId: varchar('external_student_id', { length: 255 }).unique(), // E.g., Shahvar ID
  currentBookId: uuid('current_book_id')
    .references(() => books.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const studentPreferences = pgTable('student_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id')
    .references(() => students.id, { onDelete: 'cascade' })
    .unique()
    .notNull(),
  availableDayPattern: varchar('available_day_pattern', { length: 50 }).notNull(), // 'Odd' | 'Even' | 'Both'
  unavailableTimeRanges: jsonb('unavailable_time_ranges').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});


export const schedulingProposals = pgTable('scheduling_proposals', {
  id: uuid('id').primaryKey().defaultRandom(),
  termId: uuid('term_id')
    .references(() => academicTerms.id, { onDelete: 'cascade' })
    .notNull(),
  status: varchar('status', { length: 50 }).notNull(), // 'Draft' | 'Committed' | 'Archived'
  configurationSnapshot: jsonb('configuration_snapshot').notNull(),
  isMaterialized: boolean('is_materialized').notNull().default(false),
  notes: text('notes'),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  draftUniqueIdx: uniqueIndex('draft_proposal_term_idx').on(t.termId).where(sql`status = 'Draft'`),
}));

export const proposalClasses = pgTable('proposal_classes', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id')
    .references(() => schedulingProposals.id, { onDelete: 'cascade' })
    .notNull(),
  bookId: uuid('book_id')
    .references(() => books.id, { onDelete: 'cascade' })
    .notNull(),
  teacherId: uuid('teacher_id')
    .references(() => teachers.id, { onDelete: 'set null' }),
  generatedName: varchar('generated_name', { length: 255 }).notNull(),
  customName: varchar('custom_name', { length: 255 }),
  score: integer('score').notNull(),
  reasons: jsonb('reasons').notNull(),
  editedBySupervisor: boolean('edited_by_supervisor').notNull().default(false),
  status: varchar('status', { length: 50 }).notNull(), // 'Pending' | 'Approved' | 'Rejected'
  notes: text('notes'),
});

export const proposalClassStudents = pgTable('proposal_class_students', {
  proposalClassId: uuid('proposal_class_id')
    .references(() => proposalClasses.id, { onDelete: 'cascade' })
    .notNull(),
  studentId: uuid('student_id')
    .references(() => students.id, { onDelete: 'cascade' })
    .notNull(),
});

export const proposalClassSchedules = pgTable('proposal_class_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalClassId: uuid('proposal_class_id')
    .references(() => proposalClasses.id, { onDelete: 'cascade' })
    .notNull(),
  weekDay: varchar('week_day', { length: 50 }).notNull(),
  startTime: varchar('start_time', { length: 50 }).notNull(),
  endTime: varchar('end_time', { length: 50 }).notNull(),
});

export const classes = pgTable('classes', {
  id: uuid('id').primaryKey().defaultRandom(),
  proposalId: uuid('proposal_id').references(() => schedulingProposals.id, { onDelete: 'set null' }),
  termId: uuid('term_id').references(() => academicTerms.id, { onDelete: 'cascade' }).notNull(),
  bookId: uuid('book_id').references(() => books.id, { onDelete: 'cascade' }).notNull(),
  teacherId: uuid('teacher_id').references(() => teachers.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  classType: varchar('class_type', { length: 50 }).notNull().default('Regular'), // 'Regular' | 'Private'
  status: varchar('status', { length: 50 }).notNull().default('Active'), // 'Active' | 'Archived'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const classStudents = pgTable('class_students', {
  classId: uuid('class_id').references(() => classes.id, { onDelete: 'cascade' }).notNull(),
  studentId: uuid('student_id').references(() => students.id, { onDelete: 'cascade' }).notNull(),
});

export const classSchedules = pgTable('class_schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  classId: uuid('class_id').references(() => classes.id, { onDelete: 'cascade' }).notNull(),
  weekDay: varchar('week_day', { length: 50 }).notNull(),
  startTime: varchar('start_time', { length: 50 }).notNull(),
  endTime: varchar('end_time', { length: 50 }).notNull(),
});

export const classSessions = pgTable('class_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  classId: uuid('class_id').references(() => classes.id, { onDelete: 'cascade' }).notNull(),
  date: varchar('date', { length: 50 }).notNull(), // ISO date YYYY-MM-DD
  startTime: varchar('start_time', { length: 50 }).notNull(),
  endTime: varchar('end_time', { length: 50 }).notNull(),
  scheduledTeacherId: uuid('scheduled_teacher_id').references(() => teachers.id, { onDelete: 'set null' }),
  actualTeacherId: uuid('actual_teacher_id').references(() => teachers.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 50 }).notNull().default('Scheduled'), // 'Scheduled' | 'Completed' | 'Cancelled'
});

export const teacherAttendances = pgTable('teacher_attendances', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => classSessions.id, { onDelete: 'cascade' }).notNull(),
  teacherId: uuid('teacher_id').references(() => teachers.id, { onDelete: 'cascade' }).notNull(),
  status: varchar('status', { length: 50 }).notNull(), // 'Taught' | 'NoShow'
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
}, (t) => ({
  sessionUniqueIdx: uniqueIndex('teacher_attendance_session_idx').on(t.sessionId),
}));

export const substitutionRequests = pgTable('substitution_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').references(() => classSessions.id, { onDelete: 'cascade' }).notNull(),
  requestedBy: uuid('requested_by').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  requestedSubstituteId: uuid('requested_substitute_id').references(() => teachers.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 50 }).notNull(), // 'Pending', 'Broadcast', 'Accepted', 'Approved', 'Rejected', 'Cancelled'
  acceptedById: uuid('accepted_by_id').references(() => teachers.id, { onDelete: 'set null' }),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => ({
  activeSubUniqueIdx: uniqueIndex('active_substitution_idx').on(t.sessionId).where(sql`status IN ('Pending', 'Broadcast', 'Accepted')`),
}));

export const proposalUnscheduledStudents = pgTable('proposal_unscheduled_students', {
  proposalId: uuid('proposal_id')
    .references(() => schedulingProposals.id, { onDelete: 'cascade' })
    .notNull(),
  studentId: uuid('student_id')
    .references(() => students.id, { onDelete: 'cascade' })
    .notNull(),
  reasons: jsonb('reasons').notNull(),
});

export const lessonPlans = pgTable('lesson_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  classId: uuid('class_id')
    .references(() => classes.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  teacherId: uuid('teacher_id')
    .references(() => teachers.id, { onDelete: 'cascade' })
    .notNull(),
  title: varchar('title', { length: 255 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const sessionLessonPlanEntries = pgTable('session_lesson_plan_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  lessonPlanId: uuid('lesson_plan_id')
    .references(() => lessonPlans.id, { onDelete: 'cascade' })
    .notNull(),
  sessionId: uuid('session_id')
    .references(() => classSessions.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  syllabusItemId: uuid('syllabus_item_id')
    .references(() => bookSyllabusItems.id, { onDelete: 'set null' }),
  plannedTopics: text('planned_topics'),
  homeworkAssigned: text('homework_assigned'),
  actualTaughtNotes: text('actual_taught_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
