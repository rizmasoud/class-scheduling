import { describe, it, expect, vi } from 'vitest';
import { CreateTeacherUseCase } from '../create-teacher.use-case';
import { ITeacherRepository } from '@/domain/repositories/i-teacher.repository';

describe('CreateTeacherUseCase', () => {
  it('should create and save a new teacher without preference and skills', async () => {
    const mockRepo: ITeacherRepository = {
      save: vi.fn().mockImplementation((teacher) => Promise.resolve(teacher)),
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
            archive: vi.fn(),
    };

    const useCase = new CreateTeacherUseCase(mockRepo);
    
    const result = await useCase.execute({
      fullName: 'John Teacher',
    });

    expect(result.id).toBeDefined();
    expect(result.fullName).toBe('John Teacher');
    expect(result.notes).toBeNull();
    expect(result.preference).toBeNull();
    expect(result.skills).toHaveLength(0);

    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(mockRepo.save).toHaveBeenCalledWith(result);
  });

  it('should create and save a new teacher with preference and skills', async () => {
    const mockRepo: ITeacherRepository = {
      save: vi.fn().mockImplementation((teacher) => Promise.resolve(teacher)),
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
            archive: vi.fn(),
    };

    const useCase = new CreateTeacherUseCase(mockRepo);
    
    const result = await useCase.execute({
      fullName: 'Jane Teacher',
      preference: {
        maxWeeklySessions: 10
      },
      skills: [
        { bookId: 'book-1' }
      ]
    });

    expect(result.id).toBeDefined();
    expect(result.fullName).toBe('Jane Teacher');
    expect(result.preference).toBeDefined();
    expect(result.preference?.maxWeeklySessions).toBe(10);
    expect(result.skills).toHaveLength(1);
    expect(result.skills?.[0].bookId).toBe('book-1');

    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });
});
