import { describe, it, expect, vi } from 'vitest';
import { UpdateProposalUseCase } from '../update-proposal.use-case';
import { IProposalRepository } from '@/domain/repositories/i-proposal.repository';

describe('UpdateProposalUseCase', () => {
  it('should update an existing proposal', async () => {
    const existingProposal = {
      id: 'p-1',
      generatedAt: '2023-10-27T10:00:00Z',
      status: 'Draft' as const,
      notes: null,
      classes: [],
    };

    const mockRepo: IProposalRepository = {
      save: vi.fn().mockImplementation((proposal) => Promise.resolve(proposal)),
      findById: vi.fn().mockResolvedValue(existingProposal),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
            saveWithClasses: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new UpdateProposalUseCase(mockRepo);

    const result = await useCase.execute({
      id: 'p-1',
      status: 'Closed',
      notes: 'Finalized',
      classes: [
        {
          bookId: 'book-2',
          generatedName: 'Gen Class 2',
          score: 90,
        },
      ],
    });

    expect(result.id).toBe('p-1');
    expect(result.status).toBe('Closed');
    expect(result.notes).toBe('Finalized');
    expect(result.classes).toHaveLength(1);
    expect(result.classes?.[0].bookId).toBe('book-2');

    expect(mockRepo.findById).toHaveBeenCalledWith('p-1');
    expect(mockRepo.save).toHaveBeenCalledWith(result);
  });

  it('should throw error if proposal not found', async () => {
    const mockRepo: IProposalRepository = {
      save: vi.fn(),
      saveWithClasses: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
            archive: vi.fn(),
    };

    const useCase = new UpdateProposalUseCase(mockRepo);

    await expect(useCase.execute({ id: 'p-non-existent' })).rejects.toThrow(
      'Proposal with id p-non-existent not found'
    );
  });

  it('should clear classes when passing null', async () => {
    const existingProposal = {
      id: 'p-1',
      generatedAt: '2023-10-27T10:00:00Z',
      status: 'Draft' as const,
      notes: null,
      classes: [
        {
          id: 'pc-1',
          proposalId: 'p-1',
          bookId: 'book-1',
          teacherId: null,
          generatedName: 'Class 1',
          customName: null,
          score: 80,
          reasons: [],
          editedBySupervisor: false,
          status: 'Pending' as const,
          notes: null,
          schedules: [],
        },
      ],
    };

    const mockRepo: IProposalRepository = {
      save: vi.fn().mockImplementation((proposal) => Promise.resolve(proposal)),
      findById: vi.fn().mockResolvedValue(existingProposal),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
            saveWithClasses: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new UpdateProposalUseCase(mockRepo);

    const result = await useCase.execute({
      id: 'p-1',
      classes: null,
    });

    expect(result.classes).toHaveLength(0);
  });
});
