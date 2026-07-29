export type BookId = string;
export type TeacherId = string;
export type TeacherPreferenceId = string;
export type TeacherSkillId = string;
export type StudentId = string;
export type StudentPreferenceId = string;
export type ClassId = string;
export type ClassScheduleId = string;
export type EnrollmentId = string;
export type ExamId = string;
export type ProposalId = string;
export type ProposalClassId = string;
export type ProposalClassScheduleId = string;

export type ClassStatus = 'Draft' | 'Scheduled' | 'Active' | 'Completed' | 'Archived';
export type StudentResultStatus = 'Passed' | 'Conditional' | 'Failed';
export type AvailableDayPattern = 'Odd' | 'Even' | 'Both';
export type WeekDay = 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday';
export type EnrollmentStatus = 'Active' | 'Completed' | 'Dropped';
export type SupervisorDecision = 'RepeatBook' | 'FreeClass' | 'MoveToLowerLevel';
export type SchedulingProposalStatus = 'Draft' | 'Committed' | 'Archived';
export type ProposalClassStatus = 'Pending' | 'Approved' | 'Rejected';

export interface Book {
  readonly id: BookId;
  readonly name: string;
  readonly level: number;
  readonly sequenceOrder: number;
  readonly sessionCount: number;
}

export interface Teacher {
  readonly id: TeacherId;
  readonly fullName: string;
  readonly notes: string | null;
  readonly preference?: TeacherPreference | null;
  readonly skills?: TeacherSkill[];
}

export interface TeacherPreference {
  readonly id: TeacherPreferenceId;
  readonly teacherId: TeacherId;
  readonly unavailableDayPattern: AvailableDayPattern | null;
  readonly unavailableTimeRanges: string[] | null;
  readonly maxWeeklySessions: number | null;
  readonly notes: string | null;
}

export interface TeacherSkill {
  readonly id: TeacherSkillId;
  readonly teacherId: TeacherId;
  readonly bookId: BookId;
}

export interface Student {
  readonly id: StudentId;
  readonly fullName: string;
  readonly currentBookId: BookId;
  readonly notes: string | null;
  readonly preference?: StudentPreference | null;
}

export interface StudentPreference {
  readonly id: StudentPreferenceId;
  readonly studentId: StudentId;
  readonly availableDayPattern: AvailableDayPattern;
  readonly unavailableTimeRanges: string[] | null;
  readonly notes: string | null;
}

export interface Class {
  readonly id: ClassId;
  readonly name: string;
  readonly bookId: BookId;
  readonly teacherId: TeacherId | null;
  readonly status: ClassStatus;
  readonly minCapacity: number;
  readonly targetCapacity: number;
  readonly maxCapacity: number;
  readonly notes: string | null;
  readonly schedules?: ClassSchedule[];
  readonly enrollments?: Enrollment[];
}

export interface ClassSchedule {
  readonly id: ClassScheduleId;
  readonly classId: ClassId;
  readonly weekDay: WeekDay;
  readonly startTime: string;
  readonly endTime: string;
}

export interface Enrollment {
  readonly id: EnrollmentId;
  readonly classId: ClassId;
  readonly studentId: StudentId;
  readonly enrollmentStatus: EnrollmentStatus;
  readonly joinedAt: string;
  readonly leftAt: string | null;
}

export interface ExamResult {
  readonly id: ExamId;
  readonly classStudentId: EnrollmentId;
  readonly score: number;
  readonly resultStatus: StudentResultStatus;
  readonly supervisorDecision: SupervisorDecision | null;
  readonly examDate: string;
  readonly notes: string | null;
}

export interface SchedulingProposal {
  readonly id: ProposalId;
  readonly generatedAt: string;
  readonly status: SchedulingProposalStatus;
  readonly notes: string | null;
  readonly classes?: ProposalClass[];
}

export interface ProposalClass {
  readonly id: ProposalClassId;
  readonly proposalId: ProposalId;
  readonly bookId: BookId;
  readonly teacherId: TeacherId | null;
  readonly generatedName: string;
  readonly customName: string | null;
  readonly score: number;
  readonly reasons: string[];
  readonly editedBySupervisor: boolean;
  readonly status: ProposalClassStatus;
  readonly notes: string | null;
  readonly schedules?: ProposalClassSchedule[];
  readonly studentIds: readonly StudentId[];
}

export interface ProposalClassSchedule {
  readonly id: ProposalClassScheduleId;
  readonly proposalClassId: ProposalClassId;
  readonly weekDay: WeekDay;
  readonly startTime: string;
  readonly endTime: string;
}
