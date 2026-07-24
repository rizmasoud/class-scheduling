import { describe, it, expect, vi } from 'vitest';
import { GetAllExamsUseCase } from '../get-all-exams.use-case';
import { IExamRepository } from '@/domain/repositories/i-exam.repository';

describe('GetAllExamsUseCase', () => {
  it('should return all exams', async () => {
    const exams = [
      { id: 'e-1', classStudentId: 'enroll-1', score: 95, resultStatus: 'Passed' as const, supervisorDecision: null, examDate: '2023-10-27', notes: null },
      { id: 'e-2', classStudentId: 'enroll-2', score: 85, resultStatus: 'Passed' as const, supervisorDecision: null, examDate: '2023-10-28', notes: null }
    ];
    const mockRepo: IExamRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn().mockResolvedValue(exams),
      findMany: vi.fn(),
    };

    const useCase = new GetAllExamsUseCase(mockRepo);
    
    const result = await useCase.execute();

    expect(result).toEqual(exams);
    expect(mockRepo.findAll).toHaveBeenCalledTimes(1);
  });
});
