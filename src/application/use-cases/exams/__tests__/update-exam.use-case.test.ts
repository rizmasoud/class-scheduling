import { describe, it, expect, vi } from 'vitest';
import { UpdateExamUseCase } from '../update-exam.use-case';
import { IExamRepository } from '@/domain/repositories/i-exam.repository';

describe('UpdateExamUseCase', () => {
  it('should update an existing exam', async () => {
    const existingExam = {
      id: 'e-1',
      classStudentId: 'enroll-1',
      score: 95,
      resultStatus: 'Passed' as const,
      supervisorDecision: null,
      examDate: '2023-10-27',
      notes: null,
    };

    const mockRepo: IExamRepository = {
      save: vi.fn().mockImplementation((exam) => Promise.resolve(exam)),
      findById: vi.fn().mockResolvedValue(existingExam),
      findAll: vi.fn(),
      findMany: vi.fn(),
    };

    const useCase = new UpdateExamUseCase(mockRepo);
    
    const result = await useCase.execute({
      id: 'e-1',
      score: 98,
      notes: 'Great job'
    });

    expect(result.id).toBe('e-1');
    expect(result.classStudentId).toBe('enroll-1');
    expect(result.score).toBe(98);
    expect(result.resultStatus).toBe('Passed');
    expect(result.supervisorDecision).toBeNull();
    expect(result.examDate).toBe('2023-10-27');
    expect(result.notes).toBe('Great job');

    expect(mockRepo.findById).toHaveBeenCalledWith('e-1');
    expect(mockRepo.save).toHaveBeenCalledWith(result);
  });

  it('should throw error if exam not found', async () => {
    const mockRepo: IExamRepository = {
      save: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
      findMany: vi.fn(),
    };

    const useCase = new UpdateExamUseCase(mockRepo);
    
    await expect(useCase.execute({ id: 'e-non-existent' })).rejects.toThrow('Exam with id e-non-existent not found');
  });

  it('should clear supervisorDecision and notes when passing null', async () => {
    const existingExam = {
      id: 'e-1',
      classStudentId: 'enroll-1',
      score: 40,
      resultStatus: 'Failed' as const,
      supervisorDecision: 'RepeatBook' as const,
      examDate: '2023-10-27',
      notes: 'Needs to study more',
    };

    const mockRepo: IExamRepository = {
      save: vi.fn().mockImplementation((exam) => Promise.resolve(exam)),
      findById: vi.fn().mockResolvedValue(existingExam),
      findAll: vi.fn(),
      findMany: vi.fn(),
    };

    const useCase = new UpdateExamUseCase(mockRepo);
    
    const result = await useCase.execute({
      id: 'e-1',
      supervisorDecision: null,
      notes: null
    });

    expect(result.supervisorDecision).toBeNull();
    expect(result.notes).toBeNull();
  });
});
