import { describe, it, expect, vi } from 'vitest';
import { ArchiveBookUseCase } from '../archive-book.use-case';
import { IBookRepository } from '@/domain/repositories/i-book.repository';

describe('ArchiveBookUseCase', () => {
  it('should archive a book', async () => {
    const mockRepo: IBookRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn().mockResolvedValue(undefined),
    };

    const useCase = new ArchiveBookUseCase(mockRepo);
    
    await useCase.execute('b-1');

    expect(mockRepo.archive).toHaveBeenCalledTimes(1);
    expect(mockRepo.archive).toHaveBeenCalledWith('b-1');
  });
});
