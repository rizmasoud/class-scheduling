import { describe, it, expect, vi } from 'vitest';
import { CreateClassUseCase } from '../create-class.use-case';
import { IClassRepository } from '@/domain/repositories/i-class.repository';

describe('CreateClassUseCase', () => {
  it('should create and save a new class without schedules', async () => {
    const mockRepo: IClassRepository = {
      save: vi.fn().mockImplementation((classData) => Promise.resolve(classData)),
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new CreateClassUseCase(mockRepo);
    
    const result = await useCase.execute({
      name: 'Class A',
      bookId: 'book-1',
      status: 'Draft',
      minCapacity: 5,
      targetCapacity: 10,
      maxCapacity: 15,
    });

    expect(result.id).toBeDefined();
    expect(result.name).toBe('Class A');
    expect(result.bookId).toBe('book-1');
    expect(result.teacherId).toBeNull();
    expect(result.status).toBe('Draft');
    expect(result.minCapacity).toBe(5);
    expect(result.targetCapacity).toBe(10);
    expect(result.maxCapacity).toBe(15);
    expect(result.notes).toBeNull();
    expect(result.schedules).toHaveLength(0);
    expect(result.enrollments).toHaveLength(0);

    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(mockRepo.save).toHaveBeenCalledWith(result);
  });

  it('should create and save a new class with schedules and teacherId', async () => {
    const mockRepo: IClassRepository = {
      save: vi.fn().mockImplementation((classData) => Promise.resolve(classData)),
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new CreateClassUseCase(mockRepo);
    
    const result = await useCase.execute({
      name: 'Class B',
      bookId: 'book-2',
      teacherId: 'teacher-1',
      status: 'Active',
      minCapacity: 3,
      targetCapacity: 8,
      maxCapacity: 12,
      schedules: [
        { weekDay: 'Monday', startTime: '10:00', endTime: '12:00' }
      ]
    });

    expect(result.id).toBeDefined();
    expect(result.name).toBe('Class B');
    expect(result.teacherId).toBe('teacher-1');
    expect(result.schedules).toHaveLength(1);
    expect(result.schedules?.[0].weekDay).toBe('Monday');

    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });
});
