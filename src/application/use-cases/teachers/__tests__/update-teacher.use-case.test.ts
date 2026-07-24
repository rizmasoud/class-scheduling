import { describe, it, expect, vi } from 'vitest';
import { UpdateTeacherUseCase } from '../update-teacher.use-case';
import { ITeacherRepository } from '@/domain/repositories/i-teacher.repository';

describe('UpdateTeacherUseCase', () => {
  it('should update an existing teacher', async () => {
    const existingTeacher = {
      id: 't-1',
      fullName: 'Old Name',
      notes: null,
      preference: null,
      skills: [],
    };

    const mockRepo: ITeacherRepository = {
      save: vi.fn().mockImplementation((teacher) => Promise.resolve(teacher)),
      findById: vi.fn().mockResolvedValue(existingTeacher),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new UpdateTeacherUseCase(mockRepo);
    
    const result = await useCase.execute({
      id: 't-1',
      fullName: 'New Name',
      preference: {
        maxWeeklySessions: 15
      },
      skills: [
        { bookId: 'book-2' }
      ]
    });

    expect(result.id).toBe('t-1');
    expect(result.fullName).toBe('New Name');
    expect(result.preference).toBeDefined();
    expect(result.preference?.maxWeeklySessions).toBe(15);
    expect(result.skills).toBeDefined();
    expect(result.skills).toHaveLength(1);
    expect(result.skills?.[0].bookId).toBe('book-2');

    expect(mockRepo.findById).toHaveBeenCalledWith('t-1');
    expect(mockRepo.save).toHaveBeenCalledWith(result);
  });

  it('should throw error if teacher not found', async () => {
    const mockRepo: ITeacherRepository = {
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new UpdateTeacherUseCase(mockRepo);
    
    await expect(useCase.execute({ id: 't-non-existent' })).rejects.toThrow('Teacher with id t-non-existent not found');
  });

  it('should clear preference and skills when passing null', async () => {
    const existingTeacher = {
      id: 't-1',
      fullName: 'Old Name',
      notes: null,
      preference: {
        id: 'pref-1',
        teacherId: 't-1',
        unavailableDayPattern: null,
        unavailableTimeRanges: null,
        maxWeeklySessions: 5,
        notes: null
      },
      skills: [
        { id: 'skill-1', teacherId: 't-1', bookId: 'book-1' }
      ],
    };

    const mockRepo: ITeacherRepository = {
      save: vi.fn().mockImplementation((teacher) => Promise.resolve(teacher)),
      findById: vi.fn().mockResolvedValue(existingTeacher),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new UpdateTeacherUseCase(mockRepo);
    
    const result = await useCase.execute({
      id: 't-1',
      preference: null,
      skills: null
    });

    expect(result.preference).toBeNull();
    expect(result.skills).toHaveLength(0);
  });
});
