import { describe, it, expect, vi } from 'vitest';
import { CreateStudentUseCase } from '../create-student.use-case';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';

describe('CreateStudentUseCase', () => {
  it('should create and save a new student without preference', async () => {
    const mockRepo: IStudentRepository = {
      save: vi.fn().mockImplementation((student) => Promise.resolve(student)),
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new CreateStudentUseCase(mockRepo);
    
    const result = await useCase.execute({
      fullName: 'John Doe',
      currentBookId: 'book-1',
    });

    expect(result.id).toBeDefined();
    expect(result.fullName).toBe('John Doe');
    expect(result.currentBookId).toBe('book-1');
    expect(result.notes).toBeNull();
    expect(result.preference).toBeNull();

    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(mockRepo.save).toHaveBeenCalledWith(result);
  });

  it('should create and save a new student with preference', async () => {
    const mockRepo: IStudentRepository = {
      save: vi.fn().mockImplementation((student) => Promise.resolve(student)),
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new CreateStudentUseCase(mockRepo);
    
    const result = await useCase.execute({
      fullName: 'Jane Doe',
      currentBookId: 'book-2',
      preference: {
        availableDayPattern: 'Both'
      }
    });

    expect(result.id).toBeDefined();
    expect(result.fullName).toBe('Jane Doe');
    expect(result.preference).toBeDefined();
    expect(result.preference?.availableDayPattern).toBe('Both');

    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });
});
