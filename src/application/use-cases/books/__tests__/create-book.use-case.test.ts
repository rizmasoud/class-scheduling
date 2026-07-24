import { describe, it, expect, vi } from 'vitest';
import { CreateBookUseCase } from '../create-book.use-case';
import { IBookRepository } from '@/domain/repositories/i-book.repository';

describe('CreateBookUseCase', () => {
  it('should create and save a new book', async () => {
    const mockRepo: IBookRepository = {
      save: vi.fn().mockImplementation((book) => Promise.resolve(book)),
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new CreateBookUseCase(mockRepo);
    
    const result = await useCase.execute({
      name: 'New Book',
      level: 1,
      sequenceOrder: 10,
      sessionCount: 20
    });

    expect(result.id).toBeDefined();
    expect(result.name).toBe('New Book');
    expect(result.level).toBe(1);
    expect(result.sequenceOrder).toBe(10);
    expect(result.sessionCount).toBe(20);

    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(mockRepo.save).toHaveBeenCalledWith(result);
  });
});
