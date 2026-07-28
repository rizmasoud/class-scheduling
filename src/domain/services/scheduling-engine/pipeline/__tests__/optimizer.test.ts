import { describe, it, expect } from 'vitest';
import { Optimizer, EvaluatedCandidate } from '../optimizer';
import { ClassCandidate } from '../../models/class-candidate';
import { TimeSlot } from '../../models/time-slot';

describe('Optimizer', () => {
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
    studentIds: ['st1'], // same student, different day
    timeSlot: slotTuesdayMorning,
  };

  it('returns empty list for empty input', () => {
    const optimizer = new Optimizer();
    expect(optimizer.optimize([])).toEqual([]);
  });

  it('accepts a single candidate', () => {
    const optimizer = new Optimizer();
    const evaluated: EvaluatedCandidate = { candidate: cand1, totalScore: 10, reasons: [] };
    const accepted = optimizer.optimize([evaluated]);
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
    
    const accepted = optimizer.optimize(input);
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
    
    const accepted = optimizer.optimize(input);
    expect(accepted).toHaveLength(1);
    expect(accepted[0]).toBe(cand1);
  });

  it('rejects candidate with student conflict', () => {
    const optimizer = new Optimizer();
    const input: EvaluatedCandidate[] = [
      { candidate: cand1, totalScore: 50, reasons: [] }, // st1, st2, Monday 8-10
      { candidate: cand3, totalScore: 40, reasons: [] }, // st2, st3, Monday 9-11 (overlap)
    ];
    
    const accepted = optimizer.optimize(input);
    expect(accepted).toHaveLength(1);
    expect(accepted[0]).toBe(cand1);
  });

  it('highest score wins in conflict', () => {
    const optimizer = new Optimizer();
    const input: EvaluatedCandidate[] = [
      { candidate: cand1, totalScore: 40, reasons: [] },
      { candidate: cand2, totalScore: 50, reasons: [] }, // cand2 has higher score
    ];
    
    const accepted = optimizer.optimize(input);
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
    const accepted = optimizer.optimize(input);
    expect(accepted).toHaveLength(2);
    expect(accepted[0]).toBe(cand4);
    expect(accepted[1]).toBe(cand1);
  });
});
