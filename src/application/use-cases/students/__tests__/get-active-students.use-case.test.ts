import { describe, it, expect, vi } from 'vitest';
import { GetActiveStudentsUseCase } from '../get-active-students.use-case';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';

describe('GetActiveStudentsUseCase', () => {
  it('should return all active students', async () => {
    const students = [
      { id: 's-1', fullName: 'Student 1', currentBookId: 'b-1', notes: null, preference: null }
    ];
    const mockRepo: IStudentRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn().mockResolvedValue(students),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new GetActiveStudentsUseCase(mockRepo);
    
    const result = await useCase.execute();

    expect(result).toEqual(students);
    expect(mockRepo.findAllActive).toHaveBeenCalledTimes(1);
  });
});
