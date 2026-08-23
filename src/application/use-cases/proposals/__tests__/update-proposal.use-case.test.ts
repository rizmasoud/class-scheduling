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
      findActiveDraft: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      saveWithClasses: vi.fn(),
      archive: vi.fn(), };

    const useCase = new UpdateProposalUseCase(mockRepo);

    const result = await useCase.execute({
      id: 'p-1',
      status: 'Committed',
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
    expect(result.status).toBe('Committed');
    expect(result.notes).toBe('Finalized');
    expect(result.classes).toHaveLength(1);
    expect(result.classes?.[0].bookId).toBe('book-2');

    expect(mockRepo.findById).toHaveBeenCalledWith('p-1');
    expect(mockRepo.save).toHaveBeenCalledWith(result);
  });

  it('should throw error if proposal not found', async () => {
    const mockRepo: IProposalRepository = {
      save: vi.fn(), saveWithClasses: vi.fn(),
      findById: vi.fn().mockResolvedValue(null),
      findActiveDraft: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      archive: vi.fn(), };

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
          schedules: [], studentIds: [],
        },
      ],
    };

    const mockRepo: IProposalRepository = {
      save: vi.fn().mockImplementation((proposal) => Promise.resolve(proposal)),
      findById: vi.fn().mockResolvedValue(existingProposal),
      findActiveDraft: vi.fn(),
      findAll: vi.fn(),
      findAllActive: vi.fn(),
      findMany: vi.fn(),
      saveWithClasses: vi.fn(),
      archive: vi.fn(), };

    const useCase = new UpdateProposalUseCase(mockRepo);

    const result = await useCase.execute({
      id: 'p-1',
      classes: null,
    });

    expect(result.classes).toHaveLength(0);
  });

  it('should preserve studentIds, schedules, and other fields when updating an existing class', async () => {
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
          teacherId: 't-1',
          generatedName: 'Class 1',
          customName: 'Custom Name 1',
          score: 80,
          reasons: ['Reason 1'],
          editedBySupervisor: true,
          status: 'Pending' as const,
          notes: 'Old notes',
          studentIds: ['s-1', 's-2'],
          schedules: [
            { id: 'sch-1', proposalClassId: 'pc-1', weekDay: 'Monday' as const, startTime: '10:00', endTime: '11:00' },
            { id: 'sch-2', proposalClassId: 'pc-1', weekDay: 'Wednesday' as const, startTime: '10:00', endTime: '11:00' }
          ],
        },
      ],
    };

    const mockRepo: IProposalRepository = {
      save: vi.fn().mockImplementation((proposal) => Promise.resolve(proposal)),
      findById: vi.fn().mockResolvedValue(existingProposal),
      findActiveDraft: vi.fn(), findAll: vi.fn(), findAllActive: vi.fn(), findMany: vi.fn(), saveWithClasses: vi.fn(), archive: vi.fn()
    };

    const useCase = new UpdateProposalUseCase(mockRepo);

    const result = await useCase.execute({
      id: 'p-1',
      classes: [
        {
          id: 'pc-1',
          bookId: 'book-1',
          generatedName: 'Class 1',
          notes: 'New notes'
        }
      ],
    });

    expect(result.classes).toHaveLength(1);
    const updatedClass = result.classes![0];
    
    // Updated fields
    expect(updatedClass.notes).toBe('New notes');
    
    // Preserved fields
    expect(updatedClass.studentIds).toEqual(['s-1', 's-2']); // studentIds preserved
    expect(updatedClass.schedules).toHaveLength(2); // schedules preserved
    expect(updatedClass.schedules![0].weekDay).toBe('Monday');
    expect(updatedClass.schedules![1].weekDay).toBe('Wednesday');
    expect(updatedClass.customName).toBe('Custom Name 1'); // customName preserved
    expect(updatedClass.score).toBe(80); // score preserved
    expect(updatedClass.reasons).toEqual(['Reason 1']); // reasons preserved
    expect(updatedClass.editedBySupervisor).toBe(true); // editedBySupervisor preserved
    expect(updatedClass.teacherId).toBe('t-1'); // teacherId preserved
  });

  it('should allow overriding schedules if explicitly provided', async () => {
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
          teacherId: 't-1',
          generatedName: 'Class 1',
          customName: null,
          score: 80,
          reasons: [],
          editedBySupervisor: false,
          status: 'Pending' as const,
          notes: null,
          studentIds: ['s-1', 's-2'],
          schedules: [
            { id: 'sch-1', proposalClassId: 'pc-1', weekDay: 'Monday' as const, startTime: '10:00', endTime: '11:00' },
          ],
        },
      ],
    };

    const mockRepo: IProposalRepository = {
      save: vi.fn().mockImplementation((proposal) => Promise.resolve(proposal)),
      findById: vi.fn().mockResolvedValue(existingProposal),
      findActiveDraft: vi.fn(), findAll: vi.fn(), findAllActive: vi.fn(), findMany: vi.fn(), saveWithClasses: vi.fn(), archive: vi.fn()
    };

    const useCase = new UpdateProposalUseCase(mockRepo);

    const result = await useCase.execute({
      id: 'p-1',
      classes: [
        {
          id: 'pc-1',
          bookId: 'book-1',
          generatedName: 'Class 1',
          schedules: [
            { id: 'sch-new', weekDay: 'Tuesday' as const, startTime: '12:00', endTime: '13:00' }
          ]
        }
      ],
    });

    expect(result.classes).toHaveLength(1);
    const updatedClass = result.classes![0];
    
    // Preserved fields
    expect(updatedClass.studentIds).toEqual(['s-1', 's-2']); // studentIds preserved
    
    // Updated schedules
    expect(updatedClass.schedules).toHaveLength(1);
    expect(updatedClass.schedules![0].weekDay).toBe('Tuesday');
    expect(updatedClass.schedules![0].startTime).toBe('12:00');
  });
});
