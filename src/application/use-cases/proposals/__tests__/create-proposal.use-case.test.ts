import { describe, it, expect, vi } from 'vitest';
import { CreateProposalUseCase } from '../create-proposal.use-case';
import { IProposalRepository } from '@/domain/repositories/i-proposal.repository';

describe('CreateProposalUseCase', () => {
  it('should create and save a new proposal without classes', async () => {
    const mockRepo: IProposalRepository = {
      save: vi.fn().mockImplementation((proposal) => Promise.resolve(proposal)),
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
            saveWithClasses: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new CreateProposalUseCase(mockRepo);

    const result = await useCase.execute({
      generatedAt: '2023-10-27T10:00:00Z',
      status: 'Draft',
      notes: 'Initial proposal',
    });

    expect(result.id).toBeDefined();
    expect(result.generatedAt).toBe('2023-10-27T10:00:00Z');
    expect(result.status).toBe('Draft');
    expect(result.notes).toBe('Initial proposal');
    expect(result.classes).toHaveLength(0);

    expect(mockRepo.save).toHaveBeenCalledTimes(1);
    expect(mockRepo.save).toHaveBeenCalledWith(result);
  });

  it('should create and save a new proposal with classes and schedules', async () => {
    const mockRepo: IProposalRepository = {
      save: vi.fn().mockImplementation((proposal) => Promise.resolve(proposal)),
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
            saveWithClasses: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new CreateProposalUseCase(mockRepo);

    const result = await useCase.execute({
      classes: [
        {
          bookId: 'book-1',
          teacherId: 'teacher-1',
          generatedName: 'Gen Class 1',
          score: 85,
          schedules: [
            { weekDay: 'Monday', startTime: '09:00', endTime: '10:30' },
          ],
        },
      ],
    });

    expect(result.id).toBeDefined();
    expect(result.classes).toHaveLength(1);
    expect(result.classes?.[0].bookId).toBe('book-1');
    expect(result.classes?.[0].teacherId).toBe('teacher-1');
    expect(result.classes?.[0].schedules).toHaveLength(1);
    expect(result.classes?.[0].schedules?.[0].weekDay).toBe('Monday');

    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });
});
