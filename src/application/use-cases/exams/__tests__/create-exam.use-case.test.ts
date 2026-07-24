import { describe, it, expect, vi } from 'vitest';
import { CreateExamUseCase } from '../create-exam.use-case';
import { IExamRepository } from '@/domain/repositories/i-exam.repository';

describe('CreateExamUseCase', () => {
  it('should create and save a new exam', async () => {
    const mockRepo: IExamRepository = {
      save: vi.fn().mockImplementation((exam) => Promise.resolve(exam)),
      findById: vi.fn(),
      findAll: vi.fn(),
      findMany: vi.fn(),
    };

    const useCase = new CreateExamUseCase(mockRepo);
    
    const result = await useCase.execute({
      classStudentId: 'enroll-1',
      score: 95,
      resultStatus: 'Passed',
      examDate: '2023-10-27'
    });

    expect(result.id).toBeDefined();
    expect(result.classStudentId).toBe('enroll-1');
    expect(result.score).toBe(95);
    expect(result.resultStatus).toBe('Passed');
    expect(result.supervisorDecision).toBeNull();
    expect(result.examDate).toBe('2023-10-27');
    expect(result.notes).toBeNull();

    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(mockRepo.save).toHaveBeenCalledWith(result);
  });

  it('should create and save a new exam with supervisorDecision and notes', async () => {
    const mockRepo: IExamRepository = {
      save: vi.fn().mockImplementation((exam) => Promise.resolve(exam)),
      findById: vi.fn(),
      findAll: vi.fn(),
      findMany: vi.fn(),
    };

    const useCase = new CreateExamUseCase(mockRepo);
    
    const result = await useCase.execute({
      classStudentId: 'enroll-2',
      score: 40,
      resultStatus: 'Failed',
      supervisorDecision: 'RepeatBook',
      examDate: '2023-10-28',
      notes: 'Needs to study more'
    });

    expect(result.id).toBeDefined();
    expect(result.classStudentId).toBe('enroll-2');
    expect(result.score).toBe(40);
    expect(result.resultStatus).toBe('Failed');
    expect(result.supervisorDecision).toBe('RepeatBook');
    expect(result.examDate).toBe('2023-10-28');
    expect(result.notes).toBe('Needs to study more');

    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });
});
