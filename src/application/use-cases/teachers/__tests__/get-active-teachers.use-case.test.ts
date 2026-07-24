import { describe, it, expect, vi } from 'vitest';
import { GetActiveTeachersUseCase } from '../get-active-teachers.use-case';
import { ITeacherRepository } from '@/domain/repositories/i-teacher.repository';

describe('GetActiveTeachersUseCase', () => {
  it('should return all active teachers', async () => {
    const teachers = [
      { id: 't-1', fullName: 'Teacher 1', notes: null, preference: null, skills: [] }
    ];
    const mockRepo: ITeacherRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn().mockResolvedValue(teachers),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new GetActiveTeachersUseCase(mockRepo);
    
    const result = await useCase.execute();

    expect(result).toEqual(teachers);
    expect(mockRepo.findAllActive).toHaveBeenCalledTimes(1);
  });
});
