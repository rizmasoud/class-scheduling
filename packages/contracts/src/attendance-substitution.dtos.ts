import { TeacherAttendanceStatus, SubstitutionStatus } from './enums';

export interface TeacherAttendanceDTO {
  id: string;
  sessionId: string;
  teacherId: string;
  status: TeacherAttendanceStatus;
  submittedAt: string;
}

export interface SubmitAttendanceDTO {
  status: TeacherAttendanceStatus;
}

export interface SubstitutionRequestDTO {
  id: string;
  sessionId: string;
  requestedBy: string;
  requestedSubstituteId?: string | null;
  status: SubstitutionStatus;
  acceptedById?: string | null;
  reason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubstitutionRequestDTO {
  requestedSubstituteId?: string | null;
  isBroadcast: boolean;
  reason?: string;
}
