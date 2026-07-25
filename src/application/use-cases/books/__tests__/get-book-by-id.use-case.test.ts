import { describe, it, expect, vi } from 'vitest';
import { GetBookByIdUseCase } from '../get-book-by-id.use-case';
import { IBookRepository } from '@/domain/repositories/i-book.repository';

describe('GetBookByIdUseCase', () => {
  it('should return a book by id', async () => {
    const book = { id: 'b-1', name: 'Book', level: 1, sequenceOrder: 1, sessionCount: 10 };
    const mockRepo: IBookRepository = {
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(book),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
            archive: vi.fn(),
    };

    const useCase = new GetBookByIdUseCase(mockRepo);
    
    const result = await useCase.execute('b-1');

    expect(result).toEqual(book);
    expect(mockRepo.findById).toHaveBeenCalledWith('b-1');
  });
});
