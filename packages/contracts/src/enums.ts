export type UserRole = 'Supervisor' | 'Teacher';

export type AcademicTermStatus = 'Draft' | 'Active' | 'Completed' | 'Archived';

export type ClassStatus = 'Draft' | 'Scheduled' | 'Active' | 'Completed' | 'Archived';

export type ClassType = 'Regular' | 'Private';

export type ClassSessionStatus = 'Scheduled' | 'Completed' | 'Cancelled';

export type CompensationScheme = 'StandardBaseRate' | 'PrivateBaseRate' | 'PrivatePercentageShare';

export type TeacherAttendanceStatus = 'Unreported' | 'Present' | 'Absent';

export type SubstitutionStatus =
  | 'Pending'
  | 'Broadcast'
  | 'Accepted'
  | 'Approved'
  | 'Rejected'
  | 'Cancelled'
  | 'Disputed';

export type LessonPlanStatus = 'Draft' | 'Submitted' | 'ChangesRequested' | 'Approved';

export type StudentResultStatus = 'Passed' | 'Conditional' | 'Failed';

export type SupervisorDecision = 'RepeatBook' | 'FreeClass' | 'MoveToLowerLevel' | 'Promote';

export type SchedulingProposalStatus = 'Draft' | 'Committed' | 'Archived';

export type ProposalClassStatus = 'Pending' | 'Approved' | 'Rejected';

export type AvailableDayPattern = 'Odd' | 'Even' | 'Both';

export type WeekDay =
  | 'Saturday'
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday';

export type EnrollmentStatus = 'Active' | 'Completed' | 'Dropped';

export type PayrollPeriodStatus = 'Open' | 'Calculating' | 'Finalized';

export type PayrollEntryType =
  | 'RegularSession'
  | 'SubstitutionSession'
  | 'PrivateClassShare'
  | 'AdjustmentCredit'
  | 'AdjustmentDebit';

export type TicketStatus = 'Open' | 'InProgress' | 'Resolved' | 'Closed';
