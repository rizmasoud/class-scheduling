import { 
  ExamResult as DomainExamResult,
  ExamId,
  EnrollmentId,
  StudentResultStatus as DomainStudentResultStatus,
  SupervisorDecision as DomainSupervisorDecision
} from '@/domain/models';
import { ExamResult as PersistenceExamResult, InsertExamResult } from '@/core/database/schema/exam-results.schema';
import { 
  StudentResultStatus as PersistenceStudentResultStatus, 
  SupervisorDecision as PersistenceSupervisorDecision 
} from '@/core/database/schema/enums';

export const ExamMapper = {
  toDomain(raw: PersistenceExamResult): DomainExamResult {
    return {
      id: raw.id as ExamId,
      classStudentId: raw.classStudentId as EnrollmentId,
      score: raw.score,
      resultStatus: raw.resultStatus as DomainStudentResultStatus,
      supervisorDecision: raw.supervisorDecision as DomainSupervisorDecision | null,
      examDate: raw.examDate,
      notes: raw.notes,
    };
  },
  
  toPersistence(domain: DomainExamResult): InsertExamResult {
    return {
      id: domain.id as string,
      classStudentId: domain.classStudentId as string,
      score: domain.score,
      resultStatus: domain.resultStatus as PersistenceStudentResultStatus,
      supervisorDecision: domain.supervisorDecision as PersistenceSupervisorDecision | null,
      examDate: domain.examDate,
      notes: domain.notes,
    };
  }
};
