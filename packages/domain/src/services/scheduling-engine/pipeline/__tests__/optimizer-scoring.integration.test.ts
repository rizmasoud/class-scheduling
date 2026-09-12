import { Optimizer } from '../optimizer';
import { RuleEngine } from '../../rules/rule-engine';
import { OptimalCapacityRule } from '../../rules/soft-rules/optimal-capacity.rule';
import { BalancedDistributionRule } from '../../rules/soft-rules/balanced-distribution.rule';
import { CapacityLimitRule } from '../../rules/hard-rules/capacity-limit.rule';
import { ClassCandidate } from '../../models/class-candidate';
import { SchedulingContext } from '../../models/scheduling-context';
import { SchedulingEngineConfig } from '../../config/scheduling-engine.config';
import { describe, it, expect } from 'vitest';

describe('Optimizer Soft Scoring Integration', () => {
  it('prefers a candidate with a better total score based on soft rules', () => {
    const rules = [
      new CapacityLimitRule(),
      new OptimalCapacityRule(),
      new BalancedDistributionRule()
    ];
    const ruleEngine = new RuleEngine(rules);
    const optimizer = new Optimizer(ruleEngine);

    const config: SchedulingEngineConfig = {
      minimumCapacity: 5,
      preferredCapacity: 10, // Optimal capacity is 10
      maximumCapacity: 15,
      ruleWeights: {
        teacherPreferenceWeight: 1,
        capacityWeight: 1,
        bookCompatibilityWeight: 1,
        optimalCapacityWeight: 2, // Emphasize capacity
        balancedDistributionWeight: 1
      },
      timeSlotConfig: {
        allowedDaysOfWeek: [],
        instituteHours: { openingTime: '08:00', closingTime: '17:00' },
        classDurationMinutes: 60
      }
    };

    const context: SchedulingContext = {
      activeClasses: [
        { teacherId: 'teacher-high-load', schedules: [{}, {}, {}, {}] }, // Load 4
        { teacherId: 'teacher-low-load', schedules: [{}] } // Load 1
      ] as any[],
      activeStudents: [],
      activeTeachers: [
        { id: 'teacher-high-load', name: 'High Load', skills: [{ bookId: 'b1', experienceLevel: 5 }] },
        { id: 'teacher-low-load', name: 'Low Load', skills: [{ bookId: 'b1', experienceLevel: 5 }] }
      ] as any[],
      activeBooks: []
    };

    // Candidate A: Perfect capacity (10), but high workload teacher
    const candidateA: ClassCandidate = {
      bookId: 'b1',
      teacherId: 'teacher-high-load',
      studentIds: Array.from({ length: 10 }, (_, i) => `sA${i}`), 
      timeSlots: [{ id: 'tsA', weekDay: 'Monday', startTime: '10:00', endTime: '11:00' }]
    };
    
    // Candidate B: Suboptimal capacity (5), but low workload teacher
    const candidateB: ClassCandidate = {
      bookId: 'b1',
      teacherId: 'teacher-low-load',
      studentIds: Array.from({ length: 5 }, (_, i) => `sB${i}`),
      timeSlots: [{ id: 'tsB', weekDay: 'Tuesday', startTime: '10:00', endTime: '11:00' }]
    };

    const evalA = ruleEngine.evaluate(candidateA, context, config);
    const evalB = ruleEngine.evaluate(candidateB, context, config);

    console.log(`Candidate A Score: ${evalA.totalScore} (Valid: ${evalA.valid})`);
    console.log(`Candidate B Score: ${evalB.totalScore} (Valid: ${evalB.valid})`);

    expect(evalA.totalScore).toBeGreaterThan(evalB.totalScore);

    const result = optimizer.optimize([{candidate: candidateA, ...evalA}, {candidate: candidateB, ...evalB}], context, config);
    
    expect(result.accepted).toHaveLength(2);
    expect(result.accepted[0].candidate.teacherId).toBe('teacher-high-load'); // Candidate A
    expect(result.accepted[1].candidate.teacherId).toBe('teacher-low-load');  // Candidate B
  });

  it('drops the lower-scoring candidate when there is a student conflict', () => {
    const rules = [
      new CapacityLimitRule(),
      new OptimalCapacityRule(),
      new BalancedDistributionRule()
    ];
    const ruleEngine = new RuleEngine(rules);
    const optimizer = new Optimizer(ruleEngine);

    const config: SchedulingEngineConfig = {
      minimumCapacity: 5,
      preferredCapacity: 10,
      maximumCapacity: 15,
      ruleWeights: {
        teacherPreferenceWeight: 1,
        capacityWeight: 1,
        bookCompatibilityWeight: 1,
        optimalCapacityWeight: 2, 
        balancedDistributionWeight: 1
      },
      timeSlotConfig: {
        allowedDaysOfWeek: [],
        instituteHours: { openingTime: '08:00', closingTime: '17:00' },
        classDurationMinutes: 60
      }
    };

    const context: SchedulingContext = {
      activeClasses: [
        { teacherId: 'teacher-high-load', schedules: [{}, {}, {}, {}] }, 
        { teacherId: 'teacher-low-load', schedules: [{}] }
      ] as any[],
      activeStudents: [],
      activeTeachers: [
        { id: 'teacher-high-load', name: 'High Load', skills: [{ bookId: 'b1', experienceLevel: 5 }] },
        { id: 'teacher-low-load', name: 'Low Load', skills: [{ bookId: 'b1', experienceLevel: 5 }] }
      ] as any[],
      activeBooks: []
    };

    const sharedStudents = ['shared1', 'shared2', 'shared3', 'shared4', 'shared5'];

    const candidateA: ClassCandidate = {
      bookId: 'b1',
      teacherId: 'teacher-high-load',
      studentIds: [...sharedStudents, 'sA1', 'sA2', 'sA3', 'sA4', 'sA5'], 
      timeSlots: [{ id: 'tsA', weekDay: 'Monday', startTime: '10:00', endTime: '11:00' }]
    };
    
    const candidateB: ClassCandidate = {
      bookId: 'b1',
      teacherId: 'teacher-low-load',
      studentIds: sharedStudents, 
      timeSlots: [{ id: 'tsA', weekDay: 'Monday', startTime: '10:00', endTime: '11:00' }]
    };

    const evalA = ruleEngine.evaluate(candidateA, context, config);
    const evalB = ruleEngine.evaluate(candidateB, context, config);
    
    const result = optimizer.optimize([{candidate: candidateA, ...evalA}, {candidate: candidateB, ...evalB}], context, config);
    
    expect(result.accepted).toHaveLength(1);
    expect(Array.from(result.rejectionReasons.keys()).length).toBeGreaterThan(0);

    expect(result.accepted[0].candidate.teacherId).toBe('teacher-high-load');

    console.log(`\n--- CONFLICT RESOLUTION ---`);
    console.log(`Candidate A (Accepted) -> OptimalCapacity: 2.0 | BalancedDistribution: 0.0 | Total: ${evalA.totalScore}`);
    console.log(`Candidate B (Rejected) -> OptimalCapacity: 0.0 | BalancedDistribution: 1.0 | Total: ${evalB.totalScore}`);
  });
});
