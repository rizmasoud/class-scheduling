import { describe, it, expect, vi } from 'vitest';
import { UpdateStudentUseCase } from '../update-student.use-case';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';

describe('UpdateStudentUseCase', () => {
  it('should update an existing student', async () => {
    const existingStudent = {
      id: 's-1',
      fullName: 'Old Name',
      currentBookId: 'book-1',
      notes: null,
      preference: null,
    };

    const mockRepo: IStudentRepository = {
      save: vi.fn().mockImplementation((student) => Promise.resolve(student)),
      findById: vi.fn().mockResolvedValue(existingStudent),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
            archive: vi.fn(),
    };

    const useCase = new UpdateStudentUseCase(mockRepo);
    
    const result = await useCase.execute({
      id: 's-1',
      fullName: 'New Name',
      currentBookId: 'book-2',
      preference: {
        availableDayPattern: 'Odd'
      }
    });

    expect(result.id).toBe('s-1');
    expect(result.fullName).toBe('New Name');
    expect(result.currentBookId).toBe('book-2');
    expect(result.preference).toBeDefined();
    expect(result.preference?.availableDayPattern).toBe('Odd');

    expect(mockRepo.findById).toHaveBeenCalledWith('s-1');
    expect(mockRepo.save).toHaveBeenCalledWith(result);
  });

  it('should throw error if student not found', async () => {
    const mockRepo: IStudentRepository = {
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
            archive: vi.fn(),
    };

    const useCase = new UpdateStudentUseCase(mockRepo);
    
    await expect(useCase.execute({ id: 's-non-existent' })).rejects.toThrow('Student with id s-non-existent not found');
  });

  it('should clear preference when passing null', async () => {
    const existingStudent = {
      id: 's-1',
      fullName: 'Old Name',
      currentBookId: 'book-1',
      notes: null,
      preference: {
        id: 'pref-1',
        studentId: 's-1',
        availableDayPattern: 'Odd',
        unavailableTimeRanges: null,
        notes: null
      },
    };

    const mockRepo: IStudentRepository = {
      save: vi.fn().mockImplementation((student) => Promise.resolve(student)),
      findById: vi.fn().mockResolvedValue(existingStudent),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
            archive: vi.fn(),
    };

    const useCase = new UpdateStudentUseCase(mockRepo);
    
    const result = await useCase.execute({
      id: 's-1',
      preference: null
    });

    expect(result.preference).toBeNull();
  });
});
