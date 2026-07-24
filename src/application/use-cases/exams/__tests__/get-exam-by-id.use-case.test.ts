import { describe, it, expect, vi } from 'vitest';
import { GetExamByIdUseCase } from '../get-exam-by-id.use-case';
import { IExamRepository } from '@/domain/repositories/i-exam.repository';

describe('GetExamByIdUseCase', () => {
  it('should return an exam by id', async () => {
    const exam = { id: 'e-1', classStudentId: 'enroll-1', score: 95, resultStatus: 'Passed' as const, supervisorDecision: null, examDate: '2023-10-27', notes: null };
    const mockRepo: IExamRepository = {
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(exam),
      findAll: vi.fn(),
      findMany: vi.fn(),
    };

    const useCase = new GetExamByIdUseCase(mockRepo);
    
    const result = await useCase.execute('e-1');

    expect(result).toEqual(exam);
    expect(mockRepo.findById).toHaveBeenCalledWith('e-1');
  });
});
