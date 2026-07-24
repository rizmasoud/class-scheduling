import { describe, it, expect, vi } from 'vitest';
import { GetAllTeachersUseCase } from '../get-all-teachers.use-case';
import { ITeacherRepository } from '@/domain/repositories/i-teacher.repository';

describe('GetAllTeachersUseCase', () => {
  it('should return all teachers', async () => {
    const teachers = [
      { id: 't-1', fullName: 'Teacher 1', notes: null, preference: null, skills: [] },
      { id: 't-2', fullName: 'Teacher 2', notes: null, preference: null, skills: [] }
    ];
    const mockRepo: ITeacherRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn().mockResolvedValue(teachers),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new GetAllTeachersUseCase(mockRepo);
    
    const result = await useCase.execute();

    expect(result).toEqual(teachers);
    expect(mockRepo.findAll).toHaveBeenCalledTimes(1);
  });
});
