import { describe, it, expect, vi } from 'vitest';
import { UpdateClassUseCase } from '../update-class.use-case';
import { IClassRepository } from '@/domain/repositories/i-class.repository';

describe('UpdateClassUseCase', () => {
  it('should update an existing class', async () => {
    const existingClass = {
      id: 'c-1',
      name: 'Old Name',
      bookId: 'book-1',
      teacherId: null,
      status: 'Draft' as const,
      minCapacity: 5,
      targetCapacity: 10,
      maxCapacity: 15,
      notes: null,
      schedules: [],
      enrollments: [],
    };

    const mockRepo: IClassRepository = {
      save: vi.fn().mockImplementation((classData) => Promise.resolve(classData)),
      findById: vi.fn().mockResolvedValue(existingClass),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
            saveMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new UpdateClassUseCase(mockRepo);
    
    const result = await useCase.execute({
      id: 'c-1',
      name: 'New Name',
      teacherId: 'teacher-2',
      status: 'Active',
      schedules: [
        { weekDay: 'Tuesday', startTime: '14:00', endTime: '16:00' }
      ]
    });

    expect(result.id).toBe('c-1');
    expect(result.name).toBe('New Name');
    expect(result.teacherId).toBe('teacher-2');
    expect(result.status).toBe('Active');
    expect(result.schedules).toBeDefined();
    expect(result.schedules).toHaveLength(1);
    expect(result.schedules?.[0].weekDay).toBe('Tuesday');

    expect(mockRepo.findById).toHaveBeenCalledWith('c-1');
    expect(mockRepo.save).toHaveBeenCalledWith(result);
  });

  it('should throw error if class not found', async () => {
    const mockRepo: IClassRepository = {
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
            saveMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new UpdateClassUseCase(mockRepo);
    
    await expect(useCase.execute({ id: 'c-non-existent' })).rejects.toThrow('Class with id c-non-existent not found');
  });

  it('should clear schedules when passing null', async () => {
    const existingClass = {
      id: 'c-1',
      name: 'Old Name',
      bookId: 'book-1',
      teacherId: null,
      status: 'Draft' as const,
      minCapacity: 5,
      targetCapacity: 10,
      maxCapacity: 15,
      notes: null,
      schedules: [
        { id: 'sch-1', classId: 'c-1', weekDay: 'Monday' as const, startTime: '10:00', endTime: '12:00' }
      ],
      enrollments: [],
    };

    const mockRepo: IClassRepository = {
      save: vi.fn().mockImplementation((classData) => Promise.resolve(classData)),
      findById: vi.fn().mockResolvedValue(existingClass),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
            saveMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new UpdateClassUseCase(mockRepo);
    
    const result = await useCase.execute({
      id: 'c-1',
      schedules: null
    });

    expect(result.schedules).toHaveLength(0);
  });
});
