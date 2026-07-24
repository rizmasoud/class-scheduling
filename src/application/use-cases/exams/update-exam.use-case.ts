import { ExamResult, ExamId, EnrollmentId, StudentResultStatus, SupervisorDecision } from '@/domain/models';
import { IExamRepository } from '@/domain/repositories/i-exam.repository';

export interface UpdateExamDTO {
  id: ExamId;
  classStudentId?: EnrollmentId;
  score?: number;
  resultStatus?: StudentResultStatus;
  supervisorDecision?: SupervisorDecision | null;
  examDate?: string;
  notes?: string | null;
}

export class UpdateExamUseCase {
  constructor(private readonly examRepository: IExamRepository) {}

  async execute(dto: UpdateExamDTO): Promise<ExamResult> {
    const existingExam = await this.examRepository.findById(dto.id);
    if (!existingExam) {
      throw new Error(`Exam with id ${dto.id} not found`);
    }

    const updatedExam: ExamResult = {
      ...existingExam,
      classStudentId: dto.classStudentId ?? existingExam.classStudentId,
      score: dto.score !== undefined ? dto.score : existingExam.score,
      resultStatus: dto.resultStatus ?? existingExam.resultStatus,
      supervisorDecision: dto.supervisorDecision !== undefined ? dto.supervisorDecision : existingExam.supervisorDecision,
      examDate: dto.examDate ?? existingExam.examDate,
      notes: dto.notes !== undefined ? dto.notes : existingExam.notes,
    };

    return this.examRepository.save(updatedExam);
  }
}
