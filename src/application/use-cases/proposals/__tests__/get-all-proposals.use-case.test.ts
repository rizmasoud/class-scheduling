import { describe, it, expect, vi } from 'vitest';
import { GetAllProposalsUseCase } from '../get-all-proposals.use-case';
import { IProposalRepository } from '@/domain/repositories/i-proposal.repository';

describe('GetAllProposalsUseCase', () => {
  it('should return all proposals', async () => {
    const proposals = [
      {
        id: 'p-1',
        generatedAt: '2023-10-27T10:00:00Z',
        status: 'Draft' as const,
        notes: null,
        classes: [],
      },
      {
        id: 'p-2',
        generatedAt: '2023-10-28T10:00:00Z',
        status: 'Closed' as const,
        notes: null,
        classes: [],
      },
    ];
    const mockRepo: IProposalRepository = {
      save: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn().mockResolvedValue(proposals),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new GetAllProposalsUseCase(mockRepo);

    const result = await useCase.execute();

    expect(result).toEqual(proposals);
    expect(mockRepo.findAll).toHaveBeenCalledTimes(1);
  });
});
