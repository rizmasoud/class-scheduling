import { describe, it, expect, vi } from 'vitest';
import { GetAllBooksUseCase } from '../get-all-books.use-case';
import { IBookRepository } from '@/domain/repositories/i-book.repository';

describe('GetAllBooksUseCase', () => {
  it('should return all books', async () => {
    const books = [
      { id: 'b-1', name: 'Book 1', level: 1, sequenceOrder: 1, sessionCount: 10 },
      { id: 'b-2', name: 'Book 2', level: 2, sequenceOrder: 2, sessionCount: 20 }
    ];
    const mockRepo: IBookRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn().mockResolvedValue(books),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new GetAllBooksUseCase(mockRepo);
    
    const result = await useCase.execute();

    expect(result).toEqual(books);
    expect(mockRepo.findAll).toHaveBeenCalledTimes(1);
  });
});
