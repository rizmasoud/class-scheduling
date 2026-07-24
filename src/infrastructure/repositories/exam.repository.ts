import { eq } from 'drizzle-orm';
import { DbExecutor } from '@/core/database/types';
import { examResults, ExamResult as PersistenceExamResult, InsertExamResult } from '@/core/database/schema/exam-results.schema';
import { ExamResult, ExamId } from '@/domain/models';
import { IExamRepository } from '@/domain/repositories/i-exam.repository';
import { ExamMapper } from '@/infrastructure/mappers/exam.mapper';
import { BaseRepository } from './base.repository';

export class ExamRepository 
  extends BaseRepository<typeof examResults, PersistenceExamResult, InsertExamResult> 
  implements IExamRepository
{
  constructor(db: DbExecutor) {
    super(db, examResults);
  }

  async findById(id: ExamId): Promise<ExamResult | null> {
    const raw = await super.executeFindById(id as string);
    if (!raw) return null;
    return ExamMapper.toDomain(raw);
  }

  async findMany(ids: readonly ExamId[]): Promise<readonly ExamResult[]> {
    if (ids.length === 0) return [];
    const raw = await super.executeFindMany(ids as readonly string[]);
    return raw.map(ExamMapper.toDomain);
  }

  async findAll(): Promise<readonly ExamResult[]> {
    const raw = await super.executeFindAll();
    return raw.map(ExamMapper.toDomain);
  }

  async save(examResult: ExamResult): Promise<ExamResult> {
    const persistenceModel = ExamMapper.toPersistence(examResult);

    const existing = await super.executeFindById(examResult.id as string);

    let result: PersistenceExamResult;
    if (existing) {
      result = await super.executeUpdate(examResult.id as string, persistenceModel);
    } else {
      result = await super.executeInsert(persistenceModel);
    }

    return ExamMapper.toDomain(result);
  }
}
