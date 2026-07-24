import { describe, it, expect, vi } from 'vitest';
import { GetClassByIdUseCase } from '../get-class-by-id.use-case';
import { IClassRepository } from '@/domain/repositories/i-class.repository';

describe('GetClassByIdUseCase', () => {
  it('should return a class by id', async () => {
    const classData = { id: 'c-1', name: 'Class A', bookId: 'book-1', teacherId: null, status: 'Draft' as const, minCapacity: 5, targetCapacity: 10, maxCapacity: 15, notes: null, schedules: [], enrollments: [] };
    const mockRepo: IClassRepository = {
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(classData),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new GetClassByIdUseCase(mockRepo);
    
    const result = await useCase.execute('c-1');

    expect(result).toEqual(classData);
    expect(mockRepo.findById).toHaveBeenCalledWith('c-1');
  });
});
