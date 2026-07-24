import { describe, it, expect, vi } from 'vitest';
import { GetActiveBooksUseCase } from '../get-active-books.use-case';
import { IBookRepository } from '@/domain/repositories/i-book.repository';

describe('GetActiveBooksUseCase', () => {
  it('should return all active books', async () => {
    const books = [
      { id: 'b-1', name: 'Book 1', level: 1, sequenceOrder: 1, sessionCount: 10 }
    ];
    const mockRepo: IBookRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn().mockResolvedValue(books),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new GetActiveBooksUseCase(mockRepo);
    
    const result = await useCase.execute();

    expect(result).toEqual(books);
    expect(mockRepo.findAllActive).toHaveBeenCalledTimes(1);
  });
});
