import { OptimalCapacityRule } from '../optimal-capacity.rule';
import { ClassCandidate } from '../../../models/class-candidate';
import { SchedulingContext } from '../../../models/scheduling-context';
import { SchedulingEngineConfig } from '../../../config/scheduling-engine.config';
import { describe, it, expect } from 'vitest';

describe('OptimalCapacityRule', () => {
  const rule = new OptimalCapacityRule();
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
    activeClasses: [],
    activeStudents: [],
    activeTeachers: [],
    activeBooks: []
  };

  const createCandidate = (size: number): ClassCandidate => ({
    bookId: 'b1',
    teacherId: 't1',
    studentIds: Array.from({ length: size }, (_, i) => `s${i}`),
    timeSlots: [{ id: 'ts1', weekDay: 'Monday', startTime: '10:00', endTime: '11:00' }]
  });

  it('scores maximally when group size equals preferred capacity', () => {
    const candidate = createCandidate(10);
    const result = rule.evaluate(candidate, context, config);
    expect(result.valid).toBe(true);
    expect(result.score).toBe(2);
    expect(result.reasons).toHaveLength(0);
  });

  it('scores 0 when group size equals minimum capacity', () => {
    const candidate = createCandidate(5);
    const result = rule.evaluate(candidate, context, config);
    expect(result.valid).toBe(true);
    expect(result.score).toBe(0);
    expect(result.reasons).toHaveLength(1);
  });

  it('scores 0 when group size equals maximum capacity', () => {
    const candidate = createCandidate(15);
    const result = rule.evaluate(candidate, context, config);
    expect(result.valid).toBe(true);
    expect(result.score).toBe(0);
    expect(result.reasons).toHaveLength(1);
  });

  it('scores proportionally when group size is between preferred and maximum', () => {
    const candidate = createCandidate(12); // distance = 2, maxDistance = 5, score = 1 - 2/5 = 0.6. 0.6 * 2 = 1.2
    const result = rule.evaluate(candidate, context, config);
    expect(result.valid).toBe(true);
    expect(result.score).toBeCloseTo(1.2);
    expect(result.reasons).toHaveLength(0); // 0.6 > 0.3
  });
});
