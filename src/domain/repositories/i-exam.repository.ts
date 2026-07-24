import { ExamResult, ExamId } from '@/domain/models';

export interface IExamRepository {
  findById(id: ExamId): Promise<ExamResult | null>;
  findAll(): Promise<readonly ExamResult[]>;
  findMany(ids: readonly ExamId[]): Promise<readonly ExamResult[]>;
  save(examResult: ExamResult): Promise<ExamResult>;
}
