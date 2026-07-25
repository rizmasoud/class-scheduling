import { describe, it, expect, vi } from 'vitest';
import { GetActiveProposalsUseCase } from '../get-active-proposals.use-case';
import { IProposalRepository } from '@/domain/repositories/i-proposal.repository';

describe('GetActiveProposalsUseCase', () => {
  it('should return all active proposals', async () => {
    const proposals = [
      {
        id: 'p-1',
        generatedAt: '2023-10-27T10:00:00Z',
        status: 'Draft' as const,
        notes: null,
        classes: [],
      },
    ];
    const mockRepo: IProposalRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn().mockResolvedValue(proposals),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new GetActiveProposalsUseCase(mockRepo);

    const result = await useCase.execute();

    expect(result).toEqual(proposals);
    expect(mockRepo.findAllActive).toHaveBeenCalledTimes(1);
  });
});
