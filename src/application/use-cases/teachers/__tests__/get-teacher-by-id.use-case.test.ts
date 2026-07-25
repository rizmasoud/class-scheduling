import { describe, it, expect, vi } from 'vitest';
import { GetTeacherByIdUseCase } from '../get-teacher-by-id.use-case';
import { ITeacherRepository } from '@/domain/repositories/i-teacher.repository';

describe('GetTeacherByIdUseCase', () => {
  it('should return a teacher by id', async () => {
    const teacher = { id: 't-1', fullName: 'John Teacher', notes: null, preference: null, skills: [] };
    const mockRepo: ITeacherRepository = {
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(teacher),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
            archive: vi.fn(),
    };

    const useCase = new GetTeacherByIdUseCase(mockRepo);
    
    const result = await useCase.execute('t-1');

    expect(result).toEqual(teacher);
    expect(mockRepo.findById).toHaveBeenCalledWith('t-1');
  });
});
