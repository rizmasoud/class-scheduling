import { BalancedDistributionRule } from '../balanced-distribution.rule';
import { ClassCandidate } from '../../../models/class-candidate';
import { SchedulingContext } from '../../../models/scheduling-context';
import { SchedulingEngineConfig } from '../../../config/scheduling-engine.config';
import { describe, it, expect } from 'vitest';

describe('BalancedDistributionRule', () => {
  const rule = new BalancedDistributionRule();
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

  const createCandidate = (teacherId: string): ClassCandidate => ({
    bookId: 'b1',
    teacherId,
    studentIds: [],
    timeSlots: [{ id: 'ts1', weekDay: 'Monday', startTime: '10:00', endTime: '11:00' }]
  });

  const activeTeachers = [
    { id: 't1', name: 'T1', skills: [{ bookId: 'b1', experienceLevel: 5 }] },
    { id: 't2', name: 'T2', skills: [{ bookId: 'b1', experienceLevel: 5 }] },
    { id: 't3', name: 'T3', skills: [{ bookId: 'b1', experienceLevel: 5 }] }
  ] as any[];

  it('scores maximally when teacher has the lowest workload', () => {
    const context: SchedulingContext = {
      activeClasses: [
        { teacherId: 't2', schedules: [{}, {}] },
        { teacherId: 't3', schedules: [{}, {}, {}] }
      ] as any[],
      activeStudents: [],
      activeTeachers,
      activeBooks: []
    };
    
    const candidate = createCandidate('t1');
    const result = rule.evaluate(candidate, context, config);
    expect(result.valid).toBe(true);
    expect(result.score).toBe(1);
    expect(result.reasons).toHaveLength(0);
  });

  it('scores 0 when teacher has the highest workload', () => {
    const context: SchedulingContext = {
      activeClasses: [
        { teacherId: 't1', schedules: [{}, {}, {}] },
        { teacherId: 't2', schedules: [{}] }
      ] as any[],
      activeStudents: [],
      activeTeachers,
      activeBooks: []
    };
    
    const candidate = createCandidate('t1');
    const result = rule.evaluate(candidate, context, config);
    expect(result.valid).toBe(true);
    expect(result.score).toBe(0);
    expect(result.reasons).toHaveLength(1);
  });

  it('scores maximally when all eligible teachers have equal workload', () => {
    const context: SchedulingContext = {
      activeClasses: [
        { teacherId: 't1', schedules: [{}, {}] },
        { teacherId: 't2', schedules: [{}, {}] },
        { teacherId: 't3', schedules: [{}, {}] }
      ] as any[],
      activeStudents: [],
      activeTeachers,
      activeBooks: []
    };
    
    const candidate = createCandidate('t1');
    const result = rule.evaluate(candidate, context, config);
    expect(result.valid).toBe(true);
    expect(result.score).toBe(1);
    expect(result.reasons).toHaveLength(0);
  });
});
