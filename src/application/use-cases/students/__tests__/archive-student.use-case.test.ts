import { describe, it, expect, vi } from 'vitest';
import { ArchiveStudentUseCase } from '../archive-student.use-case';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';

describe('ArchiveStudentUseCase', () => {
  it('should archive a student', async () => {
    const mockRepo: IStudentRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn().mockResolvedValue(undefined),
    };

    const useCase = new ArchiveStudentUseCase(mockRepo);
    
    await useCase.execute('s-1');

    expect(mockRepo.archive).toHaveBeenCalledTimes(1);
    expect(mockRepo.archive).toHaveBeenCalledWith('s-1');
  });
});
