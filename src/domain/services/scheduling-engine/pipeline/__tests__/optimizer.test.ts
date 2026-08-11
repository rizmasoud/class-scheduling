import { SchedulingContext } from '../../models/scheduling-context';
import { describe, it, expect } from 'vitest';
import { Optimizer, EvaluatedCandidate } from '../optimizer';
import { ClassCandidate } from '../../models/class-candidate';
import { TimeSlot } from '../../models/time-slot';

describe('Optimizer', () => {
  const dummyContext: SchedulingContext = {
    activeTeachers: [],
    activeStudents: [],
    activeBooks: [],
    activeClasses: []
  };
  const slotMondayMorning: TimeSlot = { id: 's1', weekDay: 'Monday', startTime: '08:00', endTime: '10:00' };
  const slotMondayOverlap: TimeSlot = { id: 's2', weekDay: 'Monday', startTime: '09:00', endTime: '11:00' };
  const slotMondayLate: TimeSlot = { id: 's3', weekDay: 'Monday', startTime: '10:00', endTime: '12:00' };
  const slotTuesdayMorning: TimeSlot = { id: 's4', weekDay: 'Tuesday', startTime: '08:00', endTime: '10:00' };

  const cand1: ClassCandidate = {
    bookId: 'b1',
    teacherId: 't1',
    studentIds: ['st1', 'st2'],
    timeSlot: slotMondayMorning,
  };

  const cand2: ClassCandidate = {
    bookId: 'b2',
    teacherId: 't1', // same teacher
    studentIds: ['st3'],
    timeSlot: slotMondayOverlap,
  };

  const cand3: ClassCandidate = {
    bookId: 'b1',
    teacherId: 't2', // different teacher
    studentIds: ['st2', 'st3'], // shared st2
    timeSlot: slotMondayOverlap,
  };

  const cand4: ClassCandidate = {
    bookId: 'b3',
    teacherId: 't3',
    studentIds: ['st4'],
    timeSlot: slotMondayLate, // adjacent, no overlap
  };

  const cand5: ClassCandidate = {
    bookId: 'b4',
    teacherId: 't1', // same teacher, different day
    studentIds: ['st5'], // completely different student
    timeSlot: slotTuesdayMorning,
  };

  it('returns empty list for empty input', () => {
    const optimizer = new Optimizer();
    expect(optimizer.optimize([], dummyContext)).toEqual([]);
  });

  it('accepts a single candidate', () => {
    const optimizer = new Optimizer();
    const evaluated: EvaluatedCandidate = { candidate: cand1, totalScore: 10, reasons: [] };
    const accepted = optimizer.optimize([evaluated], dummyContext);
    expect(accepted).toHaveLength(1);
    expect(accepted[0]).toBe(cand1);
  });

  it('accepts multiple non-conflicting candidates', () => {
    const optimizer = new Optimizer();
    const input: EvaluatedCandidate[] = [
      { candidate: cand1, totalScore: 50, reasons: [] },
      { candidate: cand4, totalScore: 40, reasons: [] },
      { candidate: cand5, totalScore: 30, reasons: [] },
    ];
    
    const accepted = optimizer.optimize(input, dummyContext);
    expect(accepted).toHaveLength(3);
    // Ordered by acceptance order (highest score first)
    expect(accepted[0]).toBe(cand1);
    expect(accepted[1]).toBe(cand4);
    expect(accepted[2]).toBe(cand5);
  });

  it('rejects candidate with teacher conflict', () => {
    const optimizer = new Optimizer();
    const input: EvaluatedCandidate[] = [
      { candidate: cand1, totalScore: 50, reasons: [] }, // t1, Monday 8-10
      { candidate: cand2, totalScore: 40, reasons: [] }, // t1, Monday 9-11 (overlap)
    ];
    
    const accepted = optimizer.optimize(input, dummyContext);
    expect(accepted).toHaveLength(1);
    expect(accepted[0]).toBe(cand1);
  });

  it('rejects candidate with student conflict', () => {
    const optimizer = new Optimizer();
    const input: EvaluatedCandidate[] = [
      { candidate: cand1, totalScore: 50, reasons: [] }, // st1, st2, Monday 8-10
      { candidate: cand3, totalScore: 40, reasons: [] }, // st2, st3, Monday 9-11 (overlap)
    ];
    
    const accepted = optimizer.optimize(input, dummyContext);
    expect(accepted).toHaveLength(1);
    expect(accepted[0]).toBe(cand1);
  });

  it('highest score wins in conflict', () => {
    const optimizer = new Optimizer();
    const input: EvaluatedCandidate[] = [
      { candidate: cand1, totalScore: 40, reasons: [] },
      { candidate: cand2, totalScore: 50, reasons: [] }, // cand2 has higher score
    ];
    
    const accepted = optimizer.optimize(input, dummyContext);
    expect(accepted).toHaveLength(1);
    expect(accepted[0]).toBe(cand2);
  });

  it('deterministic ordering for same scores', () => {
    const optimizer = new Optimizer();
    // cand1 and cand4 don't conflict, both have score 50
    const input: EvaluatedCandidate[] = [
      { candidate: cand4, totalScore: 50, reasons: [] },
      { candidate: cand1, totalScore: 50, reasons: [] },
    ];
    
    // JS sort is stable since ES2019. It should preserve the order of cand4 then cand1.
    const accepted = optimizer.optimize(input, dummyContext);
    expect(accepted).toHaveLength(2);
    expect(accepted[0]).toBe(cand4);
    expect(accepted[1]).toBe(cand1);
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
      { candidate: cand1, totalScore: 50, reasons: [] }, // t1
      { candidate: cand5, totalScore: 40, reasons: [] }, // t1, different day
    ];
    
    const accepted = optimizer.optimize(input, context);
    expect(accepted).toHaveLength(1);
    expect(accepted[0]).toBe(cand1); // Only first one is accepted
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
      { candidate: cand1, totalScore: 50, reasons: [] }, // t1
      { candidate: cand5, totalScore: 40, reasons: [] }, // t1, different day
    ];
    
    const accepted = optimizer.optimize(input, context);
    expect(accepted).toHaveLength(2);
    expect(accepted).toContain(cand1);
    expect(accepted).toContain(cand5);
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
      { candidate: cand1, totalScore: 50, reasons: [] } // t1
    ];
    
    const accepted = optimizer.optimize(input, context);
    expect(accepted).toHaveLength(0);
  });

  it('does not assign Teacher A to both overlapping classes (double-booking protection)', () => {
    const optimizer = new Optimizer();
    const candOverlap1: ClassCandidate = { bookId: 'b1', teacherId: 't1', studentIds: ['st1'], timeSlot: slotMondayMorning };
    const candOverlap2: ClassCandidate = { bookId: 'b2', teacherId: 't1', studentIds: ['st2'], timeSlot: slotMondayMorning };
    
    const input: EvaluatedCandidate[] = [
      { candidate: candOverlap1, totalScore: 50, reasons: [] },
      { candidate: candOverlap2, totalScore: 40, reasons: [] },
    ];
    
    const accepted = optimizer.optimize(input, dummyContext);
    expect(accepted).toHaveLength(1);
    expect(accepted[0]).toBe(candOverlap1); // Only the first is accepted due to overlap
  });
});
