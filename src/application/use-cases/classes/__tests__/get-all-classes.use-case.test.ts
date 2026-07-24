import { describe, it, expect, vi } from 'vitest';
import { GetAllClassesUseCase } from '../get-all-classes.use-case';
import { IClassRepository } from '@/domain/repositories/i-class.repository';

describe('GetAllClassesUseCase', () => {
  it('should return all classes', async () => {
    const classes = [
      { id: 'c-1', name: 'Class A', bookId: 'book-1', teacherId: null, status: 'Draft' as const, minCapacity: 5, targetCapacity: 10, maxCapacity: 15, notes: null, schedules: [], enrollments: [] },
      { id: 'c-2', name: 'Class B', bookId: 'book-2', teacherId: null, status: 'Active' as const, minCapacity: 5, targetCapacity: 10, maxCapacity: 15, notes: null, schedules: [], enrollments: [] }
    ];
    const mockRepo: IClassRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn().mockResolvedValue(classes),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new GetAllClassesUseCase(mockRepo);
    
    const result = await useCase.execute();

    expect(result).toEqual(classes);
    expect(mockRepo.findAll).toHaveBeenCalledTimes(1);
  });
});
