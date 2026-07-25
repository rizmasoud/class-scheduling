import { describe, it, expect, vi } from 'vitest';
import { GetStudentByIdUseCase } from '../get-student-by-id.use-case';
import { IStudentRepository } from '@/domain/repositories/i-student.repository';

describe('GetStudentByIdUseCase', () => {
  it('should return a student by id', async () => {
    const student = { id: 's-1', fullName: 'John Doe', currentBookId: 'book-1', notes: null, preference: null };
    const mockRepo: IStudentRepository = {
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(student),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
            archive: vi.fn(),
    };

    const useCase = new GetStudentByIdUseCase(mockRepo);
    
    const result = await useCase.execute('s-1');

    expect(result).toEqual(student);
    expect(mockRepo.findById).toHaveBeenCalledWith('s-1');
  });
});
