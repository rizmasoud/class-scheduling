import { describe, it, expect, vi } from 'vitest';
import { CommitProposalUseCase } from '../commit-proposal.use-case';
import { IProposalRepository } from '@/domain/repositories/i-proposal.repository';
import { SchedulingProposal, ProposalId } from '@/domain/models';

describe('CommitProposalUseCase', () => {
  it('should commit an approved proposal successfully', async () => {
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
          teacherId: 't-1' as any,
          generatedName: 'Gen Name',
          customName: null,
          score: 10,
          reasons: [],
          editedBySupervisor: false,
          status: 'Approved',
          notes: null,
          schedules: [
            {
              id: 'sch-1' as any,
              proposalClassId: 'pc-1' as any,
              weekDay: 'Monday',
              startTime: '10:00',
              endTime: '12:00'
            }
          ],
          studentIds: []
        },
        {
          id: 'pc-2' as any,
          proposalId: 'p-1' as ProposalId,
          bookId: 'b-2' as any,
          teacherId: null,
          generatedName: 'Pending Name',
          customName: null,
          score: 5,
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
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn(),
      saveWithClasses: vi.fn().mockResolvedValue(undefined),
      archive: vi.fn(),
    };

    const useCase = new CommitProposalUseCase(mockProposalRepo);
    await useCase.execute('p-1' as ProposalId);

    expect(mockProposalRepo.findById).toHaveBeenCalledWith('p-1');
    expect(mockProposalRepo.saveWithClasses).toHaveBeenCalledTimes(1);
    
    const [savedProposal, savedClasses] = vi.mocked(mockProposalRepo.saveWithClasses).mock.calls[0];
    
    expect(savedProposal.status).toBe('Closed');
    
    expect(savedClasses).toHaveLength(1); // Only the 'Approved' class should be saved
    expect(savedClasses[0].name).toBe('Gen Name');
    expect(savedClasses[0].bookId).toBe('b-1');
    expect(savedClasses[0].teacherId).toBe('t-1');
    expect(savedClasses[0].schedules).toHaveLength(1);
  });

  it('should throw an error if proposal is already closed', async () => {
    const proposal: SchedulingProposal = {
      id: 'p-1' as ProposalId,
      generatedAt: '2023-01-01',
      status: 'Closed',
      notes: null,
      classes: []
    };

    const mockProposalRepo: IProposalRepository = {
      findById: vi.fn().mockResolvedValue(proposal),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      save: vi.fn(),
      saveWithClasses: vi.fn(),
      archive: vi.fn(),
    };

    const useCase = new CommitProposalUseCase(mockProposalRepo);
    await expect(useCase.execute('p-1' as ProposalId)).rejects.toThrow(/already closed/);
  });
});
