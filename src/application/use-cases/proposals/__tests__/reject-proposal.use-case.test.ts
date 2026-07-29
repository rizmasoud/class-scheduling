import { describe, it, expect, vi } from 'vitest';
import { RejectProposalUseCase } from '../reject-proposal.use-case';
import { IProposalRepository } from '@/domain/repositories/i-proposal.repository';
import { SchedulingProposal, ProposalId } from '@/domain/models';

describe('RejectProposalUseCase', () => {
  it('should reject a proposal successfully', async () => {
    const proposal: SchedulingProposal = {
      id: 'p-1' as ProposalId,
      generatedAt: '2023-01-01',
      status: 'Draft',
      notes: null,
      classes: [
        {
          id: 'pc-1' as any,
          proposalId: 'p-1' as ProposalId,
          bookId: 'b-1' as any,
          teacherId: null,
          generatedName: 'Gen Name',
          customName: null,
          score: 10,
          reasons: [],
          editedBySupervisor: false,
          status: 'Pending',
          notes: null,
          schedules: [], studentIds: []
        }
      ]
    };

    const mockProposalRepo: IProposalRepository = {
      findById: vi.fn().mockResolvedValue(proposal),
      findActiveDraft: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn().mockImplementation((p) => Promise.resolve(p)),
      saveWithClasses: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new RejectProposalUseCase(mockProposalRepo);
    const result = await useCase.execute('p-1' as ProposalId);

    expect(mockProposalRepo.findById).toHaveBeenCalledWith('p-1');
    expect(mockProposalRepo.save).toHaveBeenCalled();
    expect(result.status).toBe('Archived');
    expect(result.classes![0].status).toBe('Rejected');
  });

  it('should throw an error if proposal is not found', async () => {
    const mockProposalRepo: IProposalRepository = {
      findById: vi.fn().mockResolvedValue(null),
      findActiveDraft: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn(),
      saveWithClasses: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new RejectProposalUseCase(mockProposalRepo);
    await expect(useCase.execute('non-existent' as ProposalId)).rejects.toThrow();
  });
});
