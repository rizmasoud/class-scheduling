import { describe, it, expect, vi } from 'vitest';
import { ArchiveProposalUseCase } from '../archive-proposal.use-case';
import { IProposalRepository } from '@/domain/repositories/i-proposal.repository';

describe('ArchiveProposalUseCase', () => {
  it('should archive a proposal', async () => {
    const mockRepo: IProposalRepository = {
      save: vi.fn(),
      saveWithClasses: vi.fn(),
      findById: vi.fn().mockResolvedValue({ id: 'p-1', status: 'Draft' }),
      findActiveDraft: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn().mockResolvedValue(undefined),
    };

    const useCase = new ArchiveProposalUseCase(mockRepo);

    await useCase.execute('p-1');

    expect(mockRepo.archive).toHaveBeenCalledTimes(1);
    expect(mockRepo.archive).toHaveBeenCalledWith('p-1');
  });
});
