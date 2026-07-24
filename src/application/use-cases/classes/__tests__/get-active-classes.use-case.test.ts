import { describe, it, expect, vi } from 'vitest';
import { GetActiveClassesUseCase } from '../get-active-classes.use-case';
import { IClassRepository } from '@/domain/repositories/i-class.repository';

describe('GetActiveClassesUseCase', () => {
  it('should return all active classes', async () => {
    const classes = [
      { id: 'c-2', name: 'Class B', bookId: 'book-2', teacherId: null, status: 'Active' as const, minCapacity: 5, targetCapacity: 10, maxCapacity: 15, notes: null, schedules: [], enrollments: [] }
    ];
    const mockRepo: IClassRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn().mockResolvedValue(classes),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new GetActiveClassesUseCase(mockRepo);
    
    const result = await useCase.execute();

    expect(result).toEqual(classes);
    expect(mockRepo.findAllActive).toHaveBeenCalledTimes(1);
  });
});
