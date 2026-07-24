import { ExamResult } from '@/domain/models';
import { IExamRepository } from '@/domain/repositories/i-exam.repository';

export class GetAllExamsUseCase {
  constructor(private readonly examRepository: IExamRepository) {}

  async execute(): Promise<readonly ExamResult[]> {
    return this.examRepository.findAll();
  }
}
