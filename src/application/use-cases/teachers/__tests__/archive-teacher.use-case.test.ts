import { describe, it, expect, vi } from 'vitest';
import { ArchiveTeacherUseCase } from '../archive-teacher.use-case';
import { ITeacherRepository } from '@/domain/repositories/i-teacher.repository';

describe('ArchiveTeacherUseCase', () => {
  it('should archive a teacher', async () => {
    const mockRepo: ITeacherRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn().mockResolvedValue(undefined),
    };

    const useCase = new ArchiveTeacherUseCase(mockRepo);
    
    await useCase.execute('t-1');

    expect(mockRepo.archive).toHaveBeenCalledTimes(1);
    expect(mockRepo.archive).toHaveBeenCalledWith('t-1');
  });
});
