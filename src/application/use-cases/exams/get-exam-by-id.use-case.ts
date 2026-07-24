import { ExamResult, ExamId } from '@/domain/models';
import { IExamRepository } from '@/domain/repositories/i-exam.repository';

export class GetExamByIdUseCase {
  constructor(private readonly examRepository: IExamRepository) {}

  async execute(id: ExamId): Promise<ExamResult | null> {
    return this.examRepository.findById(id);
  }
}
