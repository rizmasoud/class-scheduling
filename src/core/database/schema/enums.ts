/**
 * Shared enumerations for the application.
 * Drizzle SQLite does not natively support enum columns in the same way PostgreSQL does,
 * so we use TypeScript enums mapped to string values.
 */

export enum ClassStatus {
  Draft = 'Draft',
  Scheduled = 'Scheduled',
  Active = 'Active',
  Completed = 'Completed',
  Archived = 'Archived',
}

export enum ProposalStatus {
  Draft = 'Draft',
  Approved = 'Approved',
  Rejected = 'Rejected',
}

export enum StudentResultStatus {
  Passed = 'Passed',
  Conditional = 'Conditional',
  Failed = 'Failed',
}

export enum AvailableDayPattern {
  Odd = 'Odd',
  Even = 'Even',
  Both = 'Both',
}

export enum WeekDay {
  Saturday = 'Saturday',
  Sunday = 'Sunday',
  Monday = 'Monday',
  Tuesday = 'Tuesday',
  Wednesday = 'Wednesday',
  Thursday = 'Thursday',
}

export enum EnrollmentStatus {
  Active = 'Active',
  Completed = 'Completed',
  Dropped = 'Dropped',
}

export enum SupervisorDecision {
  RepeatBook = 'RepeatBook',
  FreeClass = 'FreeClass',
  MoveToLowerLevel = 'MoveToLowerLevel',
  Promote = 'Promote',
}

export enum SchedulingProposalStatus {
  Draft = 'Draft',
  Committed = 'Committed',
  Archived = 'Archived',
}

export enum ProposalClassStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
}
