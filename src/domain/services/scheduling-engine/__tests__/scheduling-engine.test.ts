import { describe, it, expect, vi } from 'vitest';
import { SchedulingEngine } from '../scheduling-engine';
import { TimeSlotGenerator } from '../pipeline/time-slot-generator';
import { CandidateGenerator } from '../pipeline/candidate-generator';
import { RuleEngine } from '../rules/rule-engine';
import { Optimizer } from '../pipeline/optimizer';
import { ProposalAssembler } from '../pipeline/proposal-assembler';
import { SchedulingContext } from '../models/scheduling-context';
import { SchedulingEngineConfig } from '../config/scheduling-engine.config';
import { ClassCandidate } from '../models/class-candidate';
import { EvaluationResult } from '../models/evaluation-result';

describe('SchedulingEngine', () => {
  it('orchestrates the scheduling pipeline correctly', () => {
    const timeSlotGen = new TimeSlotGenerator();
    const candidateGen = new CandidateGenerator();
    const ruleEngine = new RuleEngine([]);
    const optimizer = new Optimizer();
    const proposalAssembler = new ProposalAssembler();

    vi.spyOn(timeSlotGen, 'generate').mockReturnValue([{ id: 'slot-1', weekDay: 'Monday', startTime: '10:00', endTime: '12:00' }]);
    
    const fakeCandidate: ClassCandidate = {
      bookId: 'b1',
      teacherId: 't1',
      studentIds: ['s1'],
      timeSlots: [{ id: 'slot-1', weekDay: 'Monday', startTime: '10:00', endTime: '12:00' }]
    };
    const fakeCandidates = [fakeCandidate];
    const fakeEvaluation: EvaluationResult = { valid: true, totalScore: 100, reasons: ['Good'] };

    vi.spyOn(candidateGen, 'generate').mockReturnValue({ candidates: fakeCandidates, rejectionReasons: new Map() });
    vi.spyOn(ruleEngine, 'evaluate').mockReturnValue(fakeEvaluation);
    vi.spyOn(optimizer, 'optimize').mockReturnValue({ accepted: fakeCandidates, rejectionReasons: new Map() });
    vi.spyOn(proposalAssembler, 'assemble').mockReturnValue({
      id: 'prop-1',
      generatedAt: 'now',
      status: 'Draft',
      notes: null,
      classes: [],
      unscheduledStudents: []
    });

    const engine = new SchedulingEngine(timeSlotGen, candidateGen, ruleEngine, optimizer, proposalAssembler);
    
    const context: SchedulingContext = { activeBooks: [], activeTeachers: [], activeStudents: [], activeClasses: [] };
    const config: SchedulingEngineConfig = {
      minimumCapacity: 5, preferredCapacity: 10, maximumCapacity: 15,
      timeSlotConfig: { allowedDaysOfWeek: ['Monday'], instituteHours: { openingTime: '08:00', closingTime: '12:00' }, classDurationMinutes: 120 },
      ruleWeights: { capacityWeight: 1, teacherPreferenceWeight: 1, bookCompatibilityWeight: 1 }
    };

    const proposal = engine.generateProposal({
      proposalId: 'prop-1',
      generatedAt: 'now',
      activeBooks: context.activeBooks,
      activeTeachers: context.activeTeachers,
      activeStudents: context.activeStudents,
      activeClasses: context.activeClasses,
      config,
      generateProposalClassId: () => 'cls-1',
      generateProposalClassScheduleId: () => 'sch-1'
    });

    expect(timeSlotGen.generate).toHaveBeenCalled();
    expect(candidateGen.generate).toHaveBeenCalled();
    expect(ruleEngine.evaluate).toHaveBeenCalledWith(fakeCandidate, context, config);
    expect(optimizer.optimize).toHaveBeenCalled();
    expect(proposalAssembler.assemble).toHaveBeenCalled();
    
    expect(proposal).toBeDefined();
    expect(proposal.id).toBeDefined();
  });

  it('handles empty candidates from generator', () => {
    const timeSlotGen = new TimeSlotGenerator();
    const candidateGen = new CandidateGenerator();
    const ruleEngine = new RuleEngine([]);
    const optimizer = new Optimizer();
    const proposalAssembler = new ProposalAssembler();

    vi.spyOn(timeSlotGen, 'generate').mockReturnValue([{ id: 'slot-1', weekDay: 'Monday', startTime: '10:00', endTime: '12:00' }]);
    vi.spyOn(candidateGen, 'generate').mockReturnValue({ candidates: [], rejectionReasons: new Map() });
    
    const engine = new SchedulingEngine(timeSlotGen, candidateGen, ruleEngine, optimizer, proposalAssembler);
    
    const context: SchedulingContext = { activeBooks: [], activeTeachers: [], activeStudents: [], activeClasses: [] };
    const config: SchedulingEngineConfig = {
      minimumCapacity: 5, preferredCapacity: 10, maximumCapacity: 15,
      timeSlotConfig: { allowedDaysOfWeek: ['Monday'], instituteHours: { openingTime: '08:00', closingTime: '12:00' }, classDurationMinutes: 120 },
      ruleWeights: { capacityWeight: 1, teacherPreferenceWeight: 1, bookCompatibilityWeight: 1 }
    };

    const proposal = engine.generateProposal({
      proposalId: 'prop-1',
      generatedAt: 'now',
      activeBooks: context.activeBooks,
      activeTeachers: context.activeTeachers,
      activeStudents: context.activeStudents,
      activeClasses: context.activeClasses,
      config,
      generateProposalClassId: () => 'cls-1',
      generateProposalClassScheduleId: () => 'sch-1'
    });

    expect(proposal.classes).toEqual([]);
    expect(proposal.unscheduledStudents).toEqual([]);
  });
});
