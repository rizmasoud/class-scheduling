import { describe, it, expect, vi } from 'vitest';
import { ManualProposalEditor } from '@/domain/services/manual-editing/manual-proposal-editor';
import { RuleEngine } from '@/domain/services/scheduling-engine/rules/rule-engine';
import { SchedulingProposal, ProposalClass, ProposalId, ProposalClassId, StudentId, TeacherId } from '@/domain/models';
import { SchedulingContext } from '@/domain/services/scheduling-engine/models/scheduling-context';
import { SchedulingEngineConfig } from '@/domain/services/scheduling-engine/config/scheduling-engine.config';

describe('ManualProposalEditor', () => {
  const mockRuleEngine = {
    evaluate: vi.fn()
  } as unknown as RuleEngine;

  const editor = new ManualProposalEditor(mockRuleEngine);

  const config: SchedulingEngineConfig = {
    minimumCapacity: 4,
    preferredCapacity: 8,
    maximumCapacity: 12,
    ruleWeights: {
      teacherPreferenceWeight: 1,
      capacityWeight: 1,
      bookCompatibilityWeight: 1
    },
    timeSlotConfig: {
      allowedDaysOfWeek: ['Monday'],
      instituteHours: { openingTime: '08:00', closingTime: '20:00' },
      classDurationMinutes: 120
    }
  };

  const context: SchedulingContext = {
    activeBooks: [],
    activeTeachers: [],
    activeStudents: [],
    activeClasses: []
  };

  const createProposalClass = (id: string, studentIds: string[]): ProposalClass => ({
    id: id as ProposalClassId,
    proposalId: 'p1' as ProposalId,
    bookId: 'b1' as any,
    teacherId: 't1' as TeacherId,
    generatedName: 'Class ' + id,
    customName: null,
    score: 10,
    reasons: [],
    studentIds: studentIds as StudentId[],
    editedBySupervisor: false,
    status: 'Pending',
    notes: null,
    schedules: [{
      id: 'sch1' as any,
      proposalClassId: id as ProposalClassId,
      weekDay: 'Monday',
      startTime: '10:00',
      endTime: '12:00'
    }]
  });

  const createProposal = (classes: ProposalClass[]): SchedulingProposal => ({
    id: 'p1' as ProposalId,
    generatedAt: '2023-01-01',
    status: 'Draft',
    notes: null,
    classes
  });

  it('should successfully move a student', () => {
    vi.mocked(mockRuleEngine.evaluate).mockReturnValue({ valid: true, totalScore: 100, reasons: ['OK'] });
    
    const pClass1 = createProposalClass('c1', ['s1', 's2']);
    const pClass2 = createProposalClass('c2', ['s3']);
    const proposal = createProposal([pClass1, pClass2]);

    const updated = editor.moveStudent(proposal, 's1' as StudentId, 'c1' as ProposalClassId, 'c2' as ProposalClassId, context, config);
    
    const uc1 = updated.classes!.find(c => c.id === 'c1')!;
    const uc2 = updated.classes!.find(c => c.id === 'c2')!;
    
    expect(uc1.studentIds).not.toContain('s1');
    expect(uc2.studentIds).toContain('s1');
    expect(uc1.editedBySupervisor).toBe(true);
    expect(uc2.editedBySupervisor).toBe(true);
  });

  it('should reject invalid move student', () => {
    vi.mocked(mockRuleEngine.evaluate).mockReturnValue({ valid: false, totalScore: 0, reasons: ['Capacity exceeded'], failedRule: 'Capacity' });
    
    const pClass1 = createProposalClass('c1', ['s1', 's2']);
    const pClass2 = createProposalClass('c2', ['s3']);
    const proposal = createProposal([pClass1, pClass2]);

    expect(() => {
      editor.moveStudent(proposal, 's1' as StudentId, 'c1' as ProposalClassId, 'c2' as ProposalClassId, context, config);
    }).toThrow(/Invalid/);
  });
});
