import { describe, it, expect, vi } from 'vitest';
import { ArchiveClassUseCase } from '../archive-class.use-case';
import { IClassRepository } from '@/domain/repositories/i-class.repository';

describe('ArchiveClassUseCase', () => {
  it('should archive a class', async () => {
    const mockRepo: IClassRepository = {
      save: vi.fn(),
      saveMany: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn().mockResolvedValue(undefined),
    };

    const useCase = new ArchiveClassUseCase(mockRepo);
    
    await useCase.execute('c-1');

    expect(mockRepo.archive).toHaveBeenCalledTimes(1);
    expect(mockRepo.archive).toHaveBeenCalledWith('c-1');
  });
});
