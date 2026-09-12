import { describe, it, expect, vi } from 'vitest';
import { ManualProposalEditor } from '../manual-proposal-editor';
import { RuleEngine } from '../../scheduling-engine/rules/rule-engine';
import { SchedulingProposal, ProposalClass, ProposalId, ProposalClassId, StudentId, TeacherId } from '../../../models';
import { SchedulingContext } from '../../scheduling-engine/models/scheduling-context';
import { SchedulingEngineConfig } from '../../scheduling-engine/config/scheduling-engine.config';

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
      optimalCapacityWeight: 2,
      balancedDistributionWeight: 1,
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

  it('should successfully update a specific schedule in a multi-session class without changing others', () => {
    vi.mocked(mockRuleEngine.evaluate).mockReturnValue({ valid: true, totalScore: 100, reasons: [] });
    
    const pClass: ProposalClass = {
      ...createProposalClass('c1', ['s1']),
      schedules: [
        { id: 'sch1' as any, proposalClassId: 'c1' as any, weekDay: 'Monday', startTime: '10:00', endTime: '12:00' },
        { id: 'sch2' as any, proposalClassId: 'c1' as any, weekDay: 'Wednesday', startTime: '14:00', endTime: '16:00' }
      ]
    };
    const proposal = createProposal([pClass]);

    const updated = editor.changeSchedule(proposal, 'c1' as ProposalClassId, 'sch1', 'Tuesday', '08:00', '10:00', context, config);
    const updatedClass = updated.classes!.find(c => c.id === 'c1')!;
    
    expect(updatedClass.schedules![0].weekDay).toBe('Tuesday');
    expect(updatedClass.schedules![0].startTime).toBe('08:00');
    expect(updatedClass.schedules![1].weekDay).toBe('Wednesday');
    expect(updatedClass.schedules![1].startTime).toBe('14:00');
    expect(updatedClass.schedules).toHaveLength(2);
  });

  it('should allow editing session 2 preserving session 1', () => {
    vi.mocked(mockRuleEngine.evaluate).mockReturnValue({ valid: true, totalScore: 100, reasons: [] });
    
    const pClass: ProposalClass = {
      ...createProposalClass('c1', ['s1']),
      schedules: [
        { id: 'sch1' as any, proposalClassId: 'c1' as any, weekDay: 'Monday', startTime: '10:00', endTime: '12:00' },
        { id: 'sch2' as any, proposalClassId: 'c1' as any, weekDay: 'Wednesday', startTime: '14:00', endTime: '16:00' }
      ]
    };
    const proposal = createProposal([pClass]);

    const updated = editor.changeSchedule(proposal, 'c1' as ProposalClassId, 'sch2', 'Thursday', '10:00', '12:00', context, config);
    const updatedClass = updated.classes!.find(c => c.id === 'c1')!;
    
    expect(updatedClass.schedules![0].weekDay).toBe('Monday');
    expect(updatedClass.schedules![1].weekDay).toBe('Thursday');
    expect(updatedClass.schedules![1].startTime).toBe('10:00');
  });

  it('should successfully update schedule for a single-session class', () => {
    vi.mocked(mockRuleEngine.evaluate).mockReturnValue({ valid: true, totalScore: 100, reasons: [] });
    
    const pClass = createProposalClass('c1', ['s1']);
    const proposal = createProposal([pClass]);

    const updated = editor.changeSchedule(proposal, 'c1' as ProposalClassId, 'sch1', 'Friday', '09:00', '11:00', context, config);
    const updatedClass = updated.classes!.find(c => c.id === 'c1')!;
    
    expect(updatedClass.schedules![0].weekDay).toBe('Friday');
    expect(updatedClass.schedules![0].startTime).toBe('09:00');
    expect(updatedClass.schedules).toHaveLength(1);
  });

  it('should reject invalid schedule change', () => {
    vi.mocked(mockRuleEngine.evaluate).mockReturnValue({ valid: false, totalScore: 0, reasons: ['Time conflict'], failedRule: 'Time' });
    
    const pClass = createProposalClass('c1', ['s1']);
    const proposal = createProposal([pClass]);

    expect(() => {
      editor.changeSchedule(proposal, 'c1' as ProposalClassId, 'sch1', 'Monday', '00:00', '02:00', context, config);
    }).toThrow(/Invalid/);
  });
});
