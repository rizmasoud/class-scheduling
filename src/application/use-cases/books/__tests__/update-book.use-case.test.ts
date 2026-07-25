import { describe, it, expect, vi } from 'vitest';
import { UpdateBookUseCase } from '../update-book.use-case';
import { IBookRepository } from '@/domain/repositories/i-book.repository';

describe('UpdateBookUseCase', () => {
  it('should update an existing book', async () => {
    const existingBook = {
      id: 'b-1',
      name: 'Old Name',
      level: 1,
      sequenceOrder: 1,
      sessionCount: 10,
    };

    const mockRepo: IBookRepository = {
      save: vi.fn().mockImplementation((book) => Promise.resolve(book)),
      findById: vi.fn().mockResolvedValue(existingBook),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
            archive: vi.fn(),
    };

    const useCase = new UpdateBookUseCase(mockRepo);
    
    const result = await useCase.execute({
      id: 'b-1',
      name: 'New Name',
      level: 2
    });

    expect(result.id).toBe('b-1');
    expect(result.name).toBe('New Name');
    expect(result.level).toBe(2);
    expect(result.sequenceOrder).toBe(1);
    expect(result.sessionCount).toBe(10);

    expect(mockRepo.findById).toHaveBeenCalledWith('b-1');
    expect(mockRepo.save).toHaveBeenCalledWith(result);
  });

  it('should throw error if book not found', async () => {
    const mockRepo: IBookRepository = {
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
            archive: vi.fn(),
    };

    const useCase = new UpdateBookUseCase(mockRepo);
    
    await expect(useCase.execute({ id: 'b-non-existent' })).rejects.toThrow('Book with id b-non-existent not found');
  });
});
