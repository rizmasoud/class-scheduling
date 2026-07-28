import { describe, it, expect, vi } from 'vitest';
import { SchedulingEngine, GenerateProposalInput } from '../scheduling-engine';
import { TimeSlotGenerator } from '../pipeline/time-slot-generator';
import { CandidateGenerator } from '../pipeline/candidate-generator';
import { RuleEngine } from '../rules/rule-engine';
import { Optimizer, EvaluatedCandidate } from '../pipeline/optimizer';
import { ProposalAssembler } from '../pipeline/proposal-assembler';
import { SchedulingContext } from '../models/scheduling-context';
import { ClassCandidate } from '../models/class-candidate';
import { SchedulingProposal, WeekDay } from '@/domain/models';
import { EvaluationResult } from '../models/evaluation-result';

describe('SchedulingEngine', () => {
  it('executes the pipeline in the correct order and returns the proposal', () => {
    // Arrange
    const mockTimeSlotGenerator = { generate: vi.fn() } as unknown as TimeSlotGenerator;
    const mockCandidateGenerator = { generate: vi.fn() } as unknown as CandidateGenerator;
    const mockRuleEngine = { evaluate: vi.fn() } as unknown as RuleEngine;
    const mockOptimizer = { optimize: vi.fn() } as unknown as Optimizer;
    const mockProposalAssembler = { assemble: vi.fn() } as unknown as ProposalAssembler;

    const engine = new SchedulingEngine(
      mockTimeSlotGenerator,
      mockCandidateGenerator,
      mockRuleEngine,
      mockOptimizer,
      mockProposalAssembler
    );

    const fakeTimeSlots = [{ id: 'slot-1' } as any];
    const fakeCandidate: ClassCandidate = {
      bookId: 'b1',
      teacherId: 't1',
      studentIds: ['s1'],
      timeSlot: { id: 'slot-1', weekDay: 'Monday', startTime: '10:00', endTime: '12:00' }
    };
    const fakeCandidates = [fakeCandidate];
    const fakeEvaluation: EvaluationResult = { valid: true, totalScore: 100, reasons: ['Good'] };
    const fakeOptimized = [fakeCandidate];
    const expectedProposal: SchedulingProposal = {
      id: 'prop-1',
      status: 'Draft',
      generatedAt: '2023-01-01',
      notes: null,
      classes: []
    };

    vi.mocked(mockTimeSlotGenerator.generate).mockReturnValue(fakeTimeSlots);
    vi.mocked(mockCandidateGenerator.generate).mockReturnValue(fakeCandidates);
    vi.mocked(mockRuleEngine.evaluate).mockReturnValue(fakeEvaluation);
    vi.mocked(mockOptimizer.optimize).mockReturnValue(fakeOptimized);
    vi.mocked(mockProposalAssembler.assemble).mockReturnValue(expectedProposal);

    const generateProposalClassId = vi.fn();
    const generateProposalClassScheduleId = vi.fn();

    const input: GenerateProposalInput = {
      proposalId: 'prop-1',
      generatedAt: '2023-01-01',
      activeTeachers: [],
      activeStudents: [],
      activeBooks: [],
      activeClasses: [],
      config: {} as any,
      generateProposalClassId,
      generateProposalClassScheduleId
    };

    // Act
    const result = engine.generateProposal(input);

    // Assert
    expect(result).toBe(expectedProposal);

    // Verify context creation and TimeSlotGenerator call
    const expectedContext: SchedulingContext = {
      activeTeachers: [],
      activeStudents: [],
      activeBooks: [],
      activeClasses: []
    };
    expect(mockTimeSlotGenerator.generate).toHaveBeenCalledOnce();
    expect(mockTimeSlotGenerator.generate).toHaveBeenCalledWith(expectedContext, input.config);

    // Verify CandidateGenerator call
    expect(mockCandidateGenerator.generate).toHaveBeenCalledOnce();
    expect(mockCandidateGenerator.generate).toHaveBeenCalledWith(expectedContext, fakeTimeSlots, input.config);

    // Verify RuleEngine call
    expect(mockRuleEngine.evaluate).toHaveBeenCalledOnce();
    expect(mockRuleEngine.evaluate).toHaveBeenCalledWith(fakeCandidate, expectedContext, input.config);

    // Verify Optimizer call
    expect(mockOptimizer.optimize).toHaveBeenCalledOnce();
    const expectedEvaluated: EvaluatedCandidate = {
      candidate: fakeCandidate,
      totalScore: 100,
      reasons: ['Good']
    };
    expect(mockOptimizer.optimize).toHaveBeenCalledWith([expectedEvaluated]);

    // Verify ProposalAssembler call
    expect(mockProposalAssembler.assemble).toHaveBeenCalledOnce();
    expect(mockProposalAssembler.assemble).toHaveBeenCalledWith({
      proposalId: 'prop-1',
      generatedAt: '2023-01-01',
      candidates: [{
        candidate: fakeCandidate,
        score: 100,
        reasons: ['Good']
      }],
      context: expectedContext,
      generateProposalClassId,
      generateProposalClassScheduleId
    });
  });

  it('handles empty pipeline correctly when candidates are rejected or none generated', () => {
    // Arrange
    const mockTimeSlotGenerator = { generate: vi.fn() } as unknown as TimeSlotGenerator;
    const mockCandidateGenerator = { generate: vi.fn() } as unknown as CandidateGenerator;
    const mockRuleEngine = { evaluate: vi.fn() } as unknown as RuleEngine;
    const mockOptimizer = { optimize: vi.fn() } as unknown as Optimizer;
    const mockProposalAssembler = { assemble: vi.fn() } as unknown as ProposalAssembler;

    const engine = new SchedulingEngine(
      mockTimeSlotGenerator,
      mockCandidateGenerator,
      mockRuleEngine,
      mockOptimizer,
      mockProposalAssembler
    );

    const fakeCandidate: ClassCandidate = {
      bookId: 'b1',
      teacherId: 't1',
      studentIds: ['s1'],
      timeSlot: { id: 'slot-1', weekDay: 'Monday', startTime: '10:00', endTime: '12:00' }
    };

    vi.mocked(mockTimeSlotGenerator.generate).mockReturnValue([]);
    vi.mocked(mockCandidateGenerator.generate).mockReturnValue([fakeCandidate]);
    // Rule engine rejects candidate
    vi.mocked(mockRuleEngine.evaluate).mockReturnValue({ valid: false, totalScore: 0, reasons: [], failedRule: 'SomeRule' });
    vi.mocked(mockOptimizer.optimize).mockReturnValue([]);
    
    const expectedProposal: SchedulingProposal = {
      id: 'prop-empty',
      status: 'Draft',
      generatedAt: '2023-01-01',
      notes: null,
      classes: []
    };
    vi.mocked(mockProposalAssembler.assemble).mockReturnValue(expectedProposal);

    const input: GenerateProposalInput = {
      proposalId: 'prop-empty',
      generatedAt: '2023-01-01',
      activeTeachers: [],
      activeStudents: [],
      activeBooks: [],
      activeClasses: [],
      config: {} as any,
      generateProposalClassId: vi.fn(),
      generateProposalClassScheduleId: vi.fn()
    };

    // Act
    const result = engine.generateProposal(input);

    // Assert
    expect(result).toBe(expectedProposal);
    expect(mockOptimizer.optimize).toHaveBeenCalledWith([]);
    expect(mockProposalAssembler.assemble).toHaveBeenCalledWith(expect.objectContaining({
      candidates: []
    }));
  });
});
