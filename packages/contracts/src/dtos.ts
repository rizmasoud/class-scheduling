import {
  UserRole,
  AcademicTermStatus,
  ClassStatus,
  ClassType,
  ClassSessionStatus,
  CompensationScheme,
  TeacherAttendanceStatus,
  SubstitutionStatus,
  LessonPlanStatus,
  StudentResultStatus,
  SupervisorDecision,
  SchedulingProposalStatus,
  ProposalClassStatus,
  AvailableDayPattern,
  WeekDay,
  EnrollmentStatus,
  PayrollPeriodStatus,
  PayrollEntryType,
  TicketStatus
} from './enums';

export interface UserSummaryDTO {
  id: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface AcademicTermDTO {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: AcademicTermStatus;
}

export interface BookSyllabusItemDTO {
  id: string;
  bookId: string;
  sessionNumber: number;
  topic: string;
  description: string | null;
}

export interface BookDTO {
  id: string;
  name: string;
  level: number;
  sequenceOrder: number;
  sessionCount: number;
  syllabusItems?: BookSyllabusItemDTO[];
}

export interface TeacherSkillDTO {
  id: string;
  teacherId: string;
  bookId: string;
}

export interface TeacherDTO {
  id: string;
  fullName: string;
  notes: string | null;
  baseRatePerSession?: number;
  skills?: TeacherSkillDTO[];
}

export interface StudentPreferenceDTO {
  id: string;
  studentId: string;
  availableDayPattern: AvailableDayPattern;
  unavailableTimeRanges: string[] | null;
  notes: string | null;
}

export interface StudentDTO {
  id: string;
  fullName: string;
  externalStudentId?: string | null;
  currentBookId: string | null;
  isGraduated?: boolean;
  notes: string | null;
  preference?: StudentPreferenceDTO | null;
}

export interface TimeSlotDTO {
  id: string;
  weekDay: WeekDay;
  startTime: string;
  endTime: string;
}

export interface ProposalSummaryDTO {
  id: string;
  termId: string;
  generatedAt: string;
  status: SchedulingProposalStatus;
  notes: string | null;
}

export interface GenerateSchedulingProposalRequestDTO {
  termId: string;
  config?: Record<string, any>;
}

export interface SchedulingProposalDetailDTO extends ProposalSummaryDTO {
  configurationSnapshot: Record<string, any>;
  classes: ProposalClassDTO[];
  unscheduledStudents: ProposalUnscheduledStudentDTO[];
}

export interface ProposalClassDTO {
  id: string;
  proposalId: string;
  bookId: string;
  teacherId: string | null;
  generatedName: string;
  customName: string | null;
  score: number;
  reasons: string[];
  editedBySupervisor: boolean;
  status: ProposalClassStatus;
  notes: string | null;
  schedules: ProposalClassScheduleDTO[];
  studentIds: string[];
}

export interface ProposalClassScheduleDTO {
  id: string;
  proposalClassId: string;
  weekDay: WeekDay;
  startTime: string;
  endTime: string;
}

export interface ProposalUnscheduledStudentDTO {
  studentId: string;
  reasons: string[];
}

export interface ClassScheduleDTO {
  id: string;
  classId: string;
  weekDay: WeekDay;
  startTime: string;
  endTime: string;
}

export interface ClassSessionDTO {
  id: string;
  classId: string;
  date: string;
  startTime: string;
  endTime: string;
  scheduledTeacherId: string | null;
  actualTeacherId: string | null;
  status: ClassSessionStatus;
}

export interface ClassDTO {
  id: string;
  proposalId: string | null;
  termId: string;
  bookId: string;
  teacherId: string | null;
  name: string;
  classType: ClassType;
  status: ClassStatus;
  createdAt: string;
  updatedAt: string;
  schedules?: ClassScheduleDTO[];
  studentIds?: string[];
}


export interface SessionLessonPlanEntryDTO {
  id: string;
  lessonPlanId: string;
  sessionId: string;
  syllabusItemId: string | null;
  plannedTopics: string | null;
  homeworkAssigned: string | null;
  actualTaughtNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LessonPlanDetailDTO {
  id: string;
  classId: string;
  teacherId: string;
  title: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  entries: (SessionLessonPlanEntryDTO & {
    sessionDate?: string;
    sessionStartTime?: string;
    sessionEndTime?: string;
    sessionStatus?: string;
    syllabusTopic?: string;
  })[];
}

export interface UpsertLessonPlanEntryDTO {
  sessionId: string;
  syllabusItemId?: string | null;
  plannedTopics?: string | null;
  homeworkAssigned?: string | null;
  actualTaughtNotes?: string | null;
}

export interface SaveLessonPlanDTO {
  title?: string;
  notes?: string;
  entries: UpsertLessonPlanEntryDTO[];
}

export interface SyllabusProgressItemDTO {
  syllabusItemId: string;
  topic: string;
  coveredCount: number;
  isCovered: boolean;
}

export interface ClassSyllabusProgressDTO {
  classId: string;
  bookId: string;
  bookTitle: string;
  totalSyllabusItems: number;
  coveredItemsCount: number;
  coveragePercentage: number;
  items: SyllabusProgressItemDTO[];
}
