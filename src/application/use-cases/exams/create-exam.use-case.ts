import { ExamResult, ExamId, EnrollmentId, StudentResultStatus, SupervisorDecision } from '@/domain/models';
import { IExamRepository } from '@/domain/repositories/i-exam.repository';

export interface CreateExamDTO {
  classStudentId: EnrollmentId;
  score: number;
  resultStatus: StudentResultStatus;
  supervisorDecision?: SupervisorDecision | null;
  examDate: string;
  notes?: string | null;
}

export class CreateExamUseCase {
  constructor(private readonly examRepository: IExamRepository) {}

  async execute(dto: CreateExamDTO): Promise<ExamResult> {
    const examResult: ExamResult = {
      id: crypto.randomUUID() as ExamId,
      classStudentId: dto.classStudentId,
      score: dto.score,
      resultStatus: dto.resultStatus,
      supervisorDecision: dto.supervisorDecision ?? null,
      examDate: dto.examDate,
      notes: dto.notes ?? null,
    };
    return this.examRepository.save(examResult);
  }
}
