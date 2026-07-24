import { describe, it, expect, vi } from 'vitest';
import { GetAllStudentsUseCase } from '../get-all-students.use-case';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';

describe('GetAllStudentsUseCase', () => {
  it('should return all students', async () => {
    const students = [
      { id: 's-1', fullName: 'Student 1', currentBookId: 'b-1', notes: null, preference: null },
      { id: 's-2', fullName: 'Student 2', currentBookId: 'b-2', notes: null, preference: null }
    ];
    const mockRepo: IStudentRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn().mockResolvedValue(students),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new GetAllStudentsUseCase(mockRepo);
    
    const result = await useCase.execute();

    expect(result).toEqual(students);
    expect(mockRepo.findAll).toHaveBeenCalledTimes(1);
  });
});
