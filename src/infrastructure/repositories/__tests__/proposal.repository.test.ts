import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './db-setup';
import { ProposalRepository } from '../proposal.repository';
import { SchedulingProposal } from '@/domain/models';

describe('ProposalRepository', () => {
  let db: any;
  let repo: ProposalRepository;

  beforeEach(() => {
    db = createTestDb();
    repo = new ProposalRepository(db);
  });

  const sampleProposal: SchedulingProposal = {
    id: 'prop-1',
    generatedAt: '2023-05-05T00:00:00Z',
    status: 'Draft',
    notes: 'A test proposal',
    unscheduledStudents: [],
    classes: [
      {
        id: 'pclass-1',
        proposalId: 'prop-1',
        bookId: 'book-1',
        teacherId: 'teacher-1',
        generatedName: 'Class 1',
        customName: null,
        score: 95,
        reasons: ['Good fit'],
        editedBySupervisor: false,
        status: 'Pending',
        notes: null,
        schedules: [
          { id: 'psched-1', proposalClassId: 'pclass-1', weekDay: 'Tuesday', startTime: '09:00', endTime: '10:00' }
        ],
        studentIds: []
      }
    ],
  };

  it('should save and find a proposal by id with nested classes and schedules', async () => {
    const saved = await repo.save(sampleProposal);
    expect(saved).toEqual(sampleProposal);

    const found = await repo.findById('prop-1');
    expect(found).toEqual(sampleProposal);
  });

  it('should update an existing proposal, removing nested classes and schedules', async () => {
    await repo.save(sampleProposal);
    
    const updatedProposal: SchedulingProposal = { 
      ...sampleProposal, 
      notes: 'Updated proposal',
      classes: [],
    };
    await repo.save(updatedProposal);

    const found = await repo.findById('prop-1');
    expect(found?.notes).toBe('Updated proposal');
    expect(found?.classes).toHaveLength(0);
  });

  it('should find active draft proposal', async () => {
    await repo.save(sampleProposal);

    const activeDraft = await repo.findActiveDraft();
    expect(activeDraft).not.toBeNull();
    expect(activeDraft?.id).toBe('prop-1');
    expect(activeDraft?.status).toBe('Draft');
  });

  it('should not return committed or archived proposals as active draft', async () => {
    const committedProposal: SchedulingProposal = {
      ...sampleProposal,
      id: 'prop-committed',
      status: 'Committed'
    };
    await repo.save(committedProposal);

    const activeDraft = await repo.findActiveDraft();
    expect(activeDraft).toBeNull();
  });

  it('should soft delete (archive) a draft proposal and update status to Archived', async () => {
    await repo.save(sampleProposal);
    await repo.archive('prop-1');

    const activeProposals = await repo.findAllActive();
    expect(activeProposals).toHaveLength(0);

    const allProposals = await repo.findAll();
    expect(allProposals).toHaveLength(1);
    expect(allProposals[0].status).toBe('Archived');
  });

  it('should throw error when attempting to archive a non-draft proposal', async () => {
    const committedProposal: SchedulingProposal = {
      ...sampleProposal,
      id: 'prop-committed',
      status: 'Committed'
    };
    await repo.save(committedProposal);

    await expect(repo.archive('prop-committed')).rejects.toThrow(/Only Draft proposals may be archived/);
  });

  
});
