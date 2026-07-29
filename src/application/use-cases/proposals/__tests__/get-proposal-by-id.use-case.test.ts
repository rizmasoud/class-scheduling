import { describe, it, expect, vi } from 'vitest';
import { GetProposalByIdUseCase } from '../get-proposal-by-id.use-case';
import { IProposalRepository } from '@/domain/repositories/i-proposal.repository';

describe('GetProposalByIdUseCase', () => {
  it('should return a proposal by id', async () => {
    const proposal = {
      id: 'p-1',
      generatedAt: '2023-10-27T10:00:00Z',
      status: 'Draft' as const,
      notes: null,
      classes: [],
    };
    const mockRepo: IProposalRepository = {
      save: vi.fn(),
      saveWithClasses: vi.fn(),
      findById: vi.fn().mockResolvedValue(proposal),
      findActiveDraft: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new GetProposalByIdUseCase(mockRepo);

    const result = await useCase.execute('p-1');

    expect(result).toEqual(proposal);
    expect(mockRepo.findById).toHaveBeenCalledWith('p-1');
  });
});
