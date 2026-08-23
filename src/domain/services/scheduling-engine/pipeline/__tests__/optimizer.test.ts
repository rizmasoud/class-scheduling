import { describe, it, expect } from 'vitest';
import { Optimizer, EvaluatedCandidate } from '../optimizer';
import { ClassCandidate } from '../../models/class-candidate';
import { SchedulingContext } from '../../models/scheduling-context';
import { TimeSlot } from '../../models/time-slot';

describe('Optimizer', () => {
  const dummyConfig = {
    minimumCapacity: 1,
    preferredCapacity: 2,
    maximumCapacity: 10,
    timeSlotConfig: { allowedDaysOfWeek: ['Monday', 'Tuesday'], instituteHours: { openingTime: '08:00', closingTime: '18:00' }, classDurationMinutes: 120 },
    ruleWeights: { capacityWeight: 1, teacherPreferenceWeight: 1, bookCompatibilityWeight: 1 }
  };

  const slotMondayMorning: TimeSlot = { id: 's1', weekDay: 'Monday', startTime: '08:00', endTime: '10:00' };
  const slotMondayOverlap: TimeSlot = { id: 's2', weekDay: 'Monday', startTime: '09:00', endTime: '11:00' };
  const slotMondayLate: TimeSlot = { id: 's3', weekDay: 'Monday', startTime: '10:00', endTime: '12:00' };
  const slotTuesday: TimeSlot = { id: 's4', weekDay: 'Tuesday', startTime: '08:00', endTime: '10:00' };

  const cand1: ClassCandidate = { bookId: 'b1', teacherId: 't1', studentIds: ['st1', 'st2'], timeSlots: [slotMondayMorning] };
  const cand2: ClassCandidate = { bookId: 'b2', teacherId: 't1', studentIds: ['st3'], timeSlots: [slotMondayOverlap] };
  const cand3: ClassCandidate = { bookId: 'b3', teacherId: 't2', studentIds: ['st2', 'st3'], timeSlots: [slotMondayOverlap] };
  const cand4: ClassCandidate = { bookId: 'b4', teacherId: 't2', studentIds: ['st4'], timeSlots: [slotMondayLate] };
  const cand5: ClassCandidate = { bookId: 'b5', teacherId: 't1', studentIds: ['st5'], timeSlots: [slotTuesday] };

  const dummyContext: SchedulingContext = {
    activeBooks: [],
    activeTeachers: [{
      id: 't1', fullName: 'T1', notes: null, preference: { id: 'p1', teacherId: 't1', maxWeeklySessions: 10, notes: null, unavailableDayPattern: null, unavailableTimeRanges: null }
    }],
    activeStudents: [],
    activeClasses: []
  };

  it('accepts single candidate', () => {
    const optimizer = new Optimizer();
    const input: EvaluatedCandidate[] = [
      { candidate: cand1, totalScore: 50, reasons: [] }
    ];
    
    const accepted = optimizer.optimize(input, dummyContext, dummyConfig);
    expect(accepted.accepted).toHaveLength(1);
    expect(accepted.accepted[0]).toBe(cand1);
  });

  it('accepts multiple non-conflicting candidates', () => {
    const optimizer = new Optimizer();
    const input: EvaluatedCandidate[] = [
      { candidate: cand1, totalScore: 50, reasons: [] },
      { candidate: cand4, totalScore: 40, reasons: [] },
      { candidate: cand5, totalScore: 30, reasons: [] },
    ];
    
    const accepted = optimizer.optimize(input, dummyContext, dummyConfig);
    expect(accepted.accepted).toHaveLength(3);
    expect(accepted.accepted[0]).toBe(cand1);
    expect(accepted.accepted[1]).toBe(cand4);
    expect(accepted.accepted[2]).toBe(cand5);
  });

  it('rejects candidate with teacher conflict', () => {
    const optimizer = new Optimizer();
    const input: EvaluatedCandidate[] = [
      { candidate: cand1, totalScore: 50, reasons: [] },
      { candidate: cand2, totalScore: 40, reasons: [] },
    ];
    
    const accepted = optimizer.optimize(input, dummyContext, dummyConfig);
    expect(accepted.accepted).toHaveLength(1);
    expect(accepted.accepted[0]).toBe(cand1);
  });

  

  it('highest score wins in conflict', () => {
    const optimizer = new Optimizer();
    const input: EvaluatedCandidate[] = [
      { candidate: cand1, totalScore: 40, reasons: [] },
      { candidate: cand2, totalScore: 50, reasons: [] },
    ];
    
    const accepted = optimizer.optimize(input, dummyContext, dummyConfig);
    expect(accepted.accepted).toHaveLength(1);
    expect(accepted.accepted[0]).toBe(cand2);
  });

  it('deterministic ordering for same scores', () => {
    const optimizer = new Optimizer();
    const input: EvaluatedCandidate[] = [
      { candidate: cand4, totalScore: 50, reasons: [] },
      { candidate: cand1, totalScore: 50, reasons: [] },
    ];
    
    const accepted = optimizer.optimize(input, dummyContext, dummyConfig);
    expect(accepted.accepted).toHaveLength(2);
    expect(accepted.accepted[0]).toBe(cand4);
    expect(accepted.accepted[1]).toBe(cand1);
  });

  it('rejects candidate if teacher exceeds maxWeeklySessions (max = 1)', () => {
    const optimizer = new Optimizer();
    const context: SchedulingContext = {
      ...dummyContext,
      activeTeachers: [{
        id: 't1', fullName: 'T1', notes: null,
        preference: { id: 'p1', teacherId: 't1', maxWeeklySessions: 1, notes: null, unavailableDayPattern: null, unavailableTimeRanges: null }
      }]
    };
    const input: EvaluatedCandidate[] = [
      { candidate: cand1, totalScore: 50, reasons: [] },
      { candidate: cand5, totalScore: 40, reasons: [] },
    ];
    
    const accepted = optimizer.optimize(input, context, dummyConfig);
    expect(accepted.accepted).toHaveLength(1);
    expect(accepted.accepted[0]).toBe(cand1);
  });

  it('accepts both candidates if maxWeeklySessions is 2', () => {
    const optimizer = new Optimizer();
    const context: SchedulingContext = {
      ...dummyContext,
      activeTeachers: [{
        id: 't1', fullName: 'T1', notes: null,
        preference: { id: 'p1', teacherId: 't1', maxWeeklySessions: 2, notes: null, unavailableDayPattern: null, unavailableTimeRanges: null }
      }]
    };
    const input: EvaluatedCandidate[] = [
      { candidate: cand1, totalScore: 50, reasons: [] },
      { candidate: cand5, totalScore: 40, reasons: [] },
    ];
    
    const accepted = optimizer.optimize(input, context, dummyConfig);
    expect(accepted.accepted).toHaveLength(2);
    expect(accepted.accepted).toContain(cand1);
    expect(accepted.accepted).toContain(cand5);
  });

  it('rejects candidate if teacher already reached maxWeeklySessions with active classes', () => {
    const optimizer = new Optimizer();
    const context: SchedulingContext = {
      ...dummyContext,
      activeTeachers: [{
        id: 't1', fullName: 'T1', notes: null,
        preference: { id: 'p1', teacherId: 't1', maxWeeklySessions: 1, notes: null, unavailableDayPattern: null, unavailableTimeRanges: null }
      }],
      activeClasses: [{
        id: 'c1', name: 'Class 1', bookId: 'b1', status: 'Active', minCapacity: 1, targetCapacity: 1, maxCapacity: 1, notes: null, teacherId: 't1',
        schedules: [{ id: 'sch1', classId: 'c1', weekDay: 'Monday', startTime: '12:00', endTime: '14:00' }]
      }]
    };
    const input: EvaluatedCandidate[] = [
      { candidate: cand1, totalScore: 50, reasons: [] }
    ];
    
    const accepted = optimizer.optimize(input, context, dummyConfig);
    expect(accepted.accepted).toHaveLength(0);
  });

  it('does not assign Teacher A to both overlapping classes (double-booking protection)', () => {
    const optimizer = new Optimizer();
    const candOverlap1: ClassCandidate = { bookId: 'b1', teacherId: 't1', studentIds: ['st1'], timeSlots: [slotMondayMorning] };
    const candOverlap2: ClassCandidate = { bookId: 'b2', teacherId: 't1', studentIds: ['st2'], timeSlots: [slotMondayMorning] };
    
    const input: EvaluatedCandidate[] = [
      { candidate: candOverlap1, totalScore: 50, reasons: [] },
      { candidate: candOverlap2, totalScore: 40, reasons: [] },
    ];
    
    const accepted = optimizer.optimize(input, dummyContext, dummyConfig);
    expect(accepted.accepted).toHaveLength(1);
    expect(accepted.accepted[0]).toBe(candOverlap1);
  });

  it('allows two classes with different teachers and different students to occupy the same time slot (parallel classes)', () => {
    const optimizer = new Optimizer();
    const sameTimeCand1: ClassCandidate = { bookId: 'b1', teacherId: 't1', studentIds: ['st1'], timeSlots: [slotMondayMorning] };
    const sameTimeCand2: ClassCandidate = { bookId: 'b2', teacherId: 't2', studentIds: ['st2'], timeSlots: [slotMondayMorning] };
    
    const input: EvaluatedCandidate[] = [
      { candidate: sameTimeCand1, totalScore: 50, reasons: [] },
      { candidate: sameTimeCand2, totalScore: 40, reasons: [] },
    ];
    
    const accepted = optimizer.optimize(input, dummyContext, dummyConfig);
    expect(accepted.accepted).toHaveLength(2);
    expect(accepted.accepted).toContain(sameTimeCand1);
    expect(accepted.accepted).toContain(sameTimeCand2);
  });

  it('records TEACHER_CAPACITY_REACHED when a teacher hits maxWeeklySessions', () => {
    const optimizer = new Optimizer();
    const localTeacher = { id: 't1', fullName: 'T1', notes: null, preference: { id: 'p1', teacherId: 't1', maxWeeklySessions: 0, notes: null, unavailableDayPattern: null, unavailableTimeRanges: null } };
    const localContext = { ...dummyContext, activeTeachers: [localTeacher] };
    const evalCand = { candidate: cand1, totalScore: 100, reasons: [] };
    const { accepted, rejectionReasons } = optimizer.optimize([evalCand], localContext, dummyConfig);
    expect(accepted).toHaveLength(0);
    expect(rejectionReasons.get('st1')?.has('TEACHER_CAPACITY_REACHED')).toBe(true);
  });

  it('records OPTIMIZER_CONFLICT when candidates conflict', () => {
    const optimizer = new Optimizer();
    const evalCand1 = { candidate: cand1, totalScore: 100, reasons: [] };
    const evalCand2 = { candidate: cand2, totalScore: 50, reasons: [] };
    const { accepted, rejectionReasons } = optimizer.optimize([evalCand1, evalCand2], dummyContext, dummyConfig);
    expect(accepted).toHaveLength(1);
    expect(accepted[0].bookId).toBe('b1');
    expect(rejectionReasons.get('st3')?.has('OPTIMIZER_CONFLICT')).toBe(true);
  });
});

describe('Phase 2 Student Conflict Rules', () => {
  const dummyContext: SchedulingContext = { activeBooks: [], activeTeachers: [{ id: 't1', fullName: 'T1', notes: null, preference: { id: 'p1', teacherId: 't1', maxWeeklySessions: 10, notes: null, unavailableDayPattern: null, unavailableTimeRanges: null } }, { id: 't2', fullName: 'T2', notes: null, preference: { id: 'p2', teacherId: 't2', maxWeeklySessions: 10, notes: null, unavailableDayPattern: null, unavailableTimeRanges: null } }], activeStudents: [], activeClasses: [] };
  const dummyConfig = {
    minimumCapacity: 1,
    preferredCapacity: 2,
    maximumCapacity: 10,
    timeSlotConfig: { allowedDaysOfWeek: ['Monday', 'Tuesday'], instituteHours: { openingTime: '08:00', closingTime: '18:00' }, classDurationMinutes: 120 },
    ruleWeights: { capacityWeight: 1, teacherPreferenceWeight: 1, bookCompatibilityWeight: 1 }
  };

  const slotMon = { id: 's1', weekDay: 'Monday', startTime: '09:00', endTime: '10:30' };
  const slotWed = { id: 's2', weekDay: 'Wednesday', startTime: '09:00', endTime: '10:30' };

  it('Partial student conflict', () => {
    const optimizer = new Optimizer();
    const c1 = { bookId: 'b1', teacherId: 't1', studentIds: ['s1', 's2', 's3'], timeSlots: [slotMon] };
    const c2 = { bookId: 'b2', teacherId: 't2', studentIds: ['s3', 's4', 's5'], timeSlots: [slotMon] };
    const input = [
      { candidate: c1, totalScore: 50, reasons: [] },
      { candidate: c2, totalScore: 40, reasons: [] }
    ];
    const { accepted } = optimizer.optimize(input, dummyContext, dummyConfig);
    expect(accepted).toHaveLength(2);
    expect(accepted[0].studentIds).toEqual(['s1', 's2', 's3']);
    expect(accepted[1].studentIds).toEqual(['s4', 's5']);
  });

  it('Entire candidate conflicts', () => {
    const optimizer = new Optimizer();
    const c1 = { bookId: 'b1', teacherId: 't1', studentIds: ['s1', 's2', 's3'], timeSlots: [slotMon] };
    const c2 = { bookId: 'b2', teacherId: 't2', studentIds: ['s1', 's2', 's3'], timeSlots: [slotMon] };
    const input = [
      { candidate: c1, totalScore: 50, reasons: [] },
      { candidate: c2, totalScore: 40, reasons: [] }
    ];
    const { accepted } = optimizer.optimize(input, dummyContext, dummyConfig);
    expect(accepted).toHaveLength(1);
    expect(accepted[0]).toBe(c1);
  });

  it('Below minimum capacity', () => {
    const optimizer = new Optimizer();
    const c1 = { bookId: 'b1', teacherId: 't1', studentIds: ['s1', 's2', 's3'], timeSlots: [slotMon] };
    const c2 = { bookId: 'b2', teacherId: 't2', studentIds: ['s3', 's4'], timeSlots: [slotMon] };
    const input = [
      { candidate: c1, totalScore: 50, reasons: [] },
      { candidate: c2, totalScore: 40, reasons: [] }
    ];
    const strictConfig = { ...dummyConfig, minimumCapacity: 2 };
    const { accepted, rejectionReasons } = optimizer.optimize(input, dummyContext, strictConfig);
    expect(accepted).toHaveLength(1);
    expect(accepted[0]).toBe(c1);
    expect(rejectionReasons.get('s4')?.has('OPTIMIZER_CONFLICT')).toBe(true);
  });

  it('Multi-session partial conflict', () => {
    const optimizer = new Optimizer();
    const c1 = { bookId: 'b1', teacherId: 't1', studentIds: ['s3'], timeSlots: [slotMon, slotWed] };
    const c2 = { bookId: 'b2', teacherId: 't2', studentIds: ['s3', 's4', 's5'], timeSlots: [slotMon, slotWed] };
    const input = [
      { candidate: c1, totalScore: 50, reasons: [] },
      { candidate: c2, totalScore: 40, reasons: [] }
    ];
    const { accepted } = optimizer.optimize(input, dummyContext, dummyConfig);
    expect(accepted).toHaveLength(2);
    expect(accepted[0]).toBe(c1);
    expect(accepted[1].studentIds).toEqual(['s4', 's5']);
    expect(accepted[1].timeSlots).toHaveLength(2);
  });

  it('Student has no schedule conflict', () => {
    const optimizer = new Optimizer();
    const slotAfternoon = { id: 's3', weekDay: 'Monday', startTime: '14:00', endTime: '15:30' };
    const c1 = { bookId: 'b1', teacherId: 't1', studentIds: ['s3'], timeSlots: [slotMon] };
    const c2 = { bookId: 'b2', teacherId: 't2', studentIds: ['s3', 's4', 's5'], timeSlots: [slotAfternoon] };
    const input = [
      { candidate: c1, totalScore: 50, reasons: [] },
      { candidate: c2, totalScore: 40, reasons: [] }
    ];
    const { accepted } = optimizer.optimize(input, dummyContext, dummyConfig);
    expect(accepted).toHaveLength(2);
    expect(accepted[1].studentIds).toEqual(['s3', 's4', 's5']); // s3 is not removed
  });

  it('Teacher conflict remains atomic', () => {
    const optimizer = new Optimizer();
    const c1 = { bookId: 'b1', teacherId: 't1', studentIds: ['s1'], timeSlots: [slotMon] };
    const c2 = { bookId: 'b2', teacherId: 't1', studentIds: ['s2', 's3'], timeSlots: [slotMon] };
    const input = [
      { candidate: c1, totalScore: 50, reasons: [] },
      { candidate: c2, totalScore: 40, reasons: [] }
    ];
    const { accepted } = optimizer.optimize(input, dummyContext, dummyConfig);
    expect(accepted).toHaveLength(1);
    expect(accepted[0]).toBe(c1);
  });
});
