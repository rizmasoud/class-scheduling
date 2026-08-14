import { describe, it, expect } from 'vitest';
import { CandidateGenerator } from '../candidate-generator';
import { SchedulingContext } from '../../models/scheduling-context';
import { TimeSlot } from '../../models/time-slot';
import { SchedulingEngineConfig } from '../../config/scheduling-engine.config';
import { Book, Teacher, Student, Class } from '@/domain/models';

describe('CandidateGenerator', () => {

  

  const config: SchedulingEngineConfig = {
    minimumCapacity: 5,
    preferredCapacity: 10,
    maximumCapacity: 15,
    ruleWeights: {
      teacherPreferenceWeight: 1,
      capacityWeight: 1,
      bookCompatibilityWeight: 1,
    },
    timeSlotConfig: {
      allowedDaysOfWeek: ['Monday'],
      instituteHours: { openingTime: '08:00', closingTime: '12:00' },
      classDurationMinutes: 120,
    },
  };

  const slot1: TimeSlot = { id: 's1', weekDay: 'Monday', startTime: '08:00', endTime: '10:00' };

  const book1: Book = { id: 'b1', name: 'Book 1', level: 1, sequenceOrder: 1, sessionCount: 10 };
  
  const teacher1: Teacher = { 
    id: 't1', 
    fullName: 'Teacher 1', 
    notes: null,
    skills: [{ id: 'sk1', teacherId: 't1', bookId: 'b1' }]
  };

  const student1: Student = { id: 'st1', fullName: 'Student 1', currentBookId: 'b1', notes: null };

  it('generates a successful candidate', () => {
    const generator = new CandidateGenerator();
    const context: SchedulingContext = {
      activeBooks: [book1],
      activeTeachers: [teacher1],
      activeStudents: [student1],
      activeClasses: []
    };

    const { candidates } = generator.generate(context, [slot1], config);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].bookId).toBe('b1');
    expect(candidates[0].teacherId).toBe('t1');
    expect(candidates[0].studentIds).toEqual(['st1']);
    expect(candidates[0].timeSlot.id).toBe('s1');
  });

  it('skips if zero students', () => {
    const generator = new CandidateGenerator();
    const context: SchedulingContext = {
      activeBooks: [book1],
      activeTeachers: [teacher1],
      activeStudents: [],
      activeClasses: []
    };

    const { candidates } = generator.generate(context, [slot1], config);
    expect(candidates).toHaveLength(0);
  });

  it('splits group if size exceeds maximum capacity', () => {
    const generator = new CandidateGenerator();
    const manyStudents = Array.from({ length: 31 }).map((_, i) => ({
      id: `st${i}`, fullName: `Student ${i}`, currentBookId: 'b1', notes: null
    }));

    const context: SchedulingContext = {
      activeBooks: [book1],
      activeTeachers: [teacher1],
      activeStudents: manyStudents,
      activeClasses: []
    };

    const { candidates } = generator.generate(context, [slot1], config);
    // Should generate full chunks and then single-student fallbacks for chunks > 1
    // Total candidates: 
    // chunk 1 (size 15) -> 1 + 15
    // chunk 2 (size 15) -> 1 + 15
    // chunk 3 (size 1) -> 1
    // 16 + 16 + 1 = 33
    expect(candidates).toHaveLength(33);
    
    // Check sizes of the studentIds arrays in generated candidates
    const groupSizes = candidates.map(c => c.studentIds.length);
    // the first candidate is the chunk of 15
    expect(groupSizes[0]).toEqual(15);
    // followed by 15 single-student candidates
    for (let i = 1; i <= 15; i++) {
      expect(groupSizes[i]).toEqual(1);
    }
    // then the next chunk of 15
    expect(groupSizes[16]).toEqual(15);
    // followed by 15 single-student candidates
    for (let i = 17; i <= 31; i++) {
      expect(groupSizes[i]).toEqual(1);
    }
    // then the final chunk of 1
    expect(groupSizes[32]).toEqual(1);
    
    // Make sure we preserve ordering
    expect(candidates[0].studentIds[0]).toBe('st0');
    expect(candidates[0].studentIds[14]).toBe('st14');
    expect(candidates[16].studentIds[0]).toBe('st15');
    expect(candidates[16].studentIds[14]).toBe('st29');
    expect(candidates[32].studentIds[0]).toBe('st30');
  });

  it('skips if incompatible teacher/book', () => {
    const generator = new CandidateGenerator();
    const badTeacher: Teacher = { 
      id: 't2', 
      fullName: 'Teacher 2', 
      notes: null,
      skills: [{ id: 'sk2', teacherId: 't2', bookId: 'b2' }] // Wrong book
    };

    const context: SchedulingContext = {
      activeBooks: [book1],
      activeTeachers: [badTeacher],
      activeStudents: [student1],
      activeClasses: []
    };

    const { candidates } = generator.generate(context, [slot1], config);
    expect(candidates).toHaveLength(0);
  });

  it('skips if teacher unavailable due to pattern', () => {
    const generator = new CandidateGenerator();
    const unavailableTeacher: Teacher = { 
      ...teacher1,
      preference: {
        id: 'pref1',
        teacherId: 't1',
        unavailableDayPattern: 'Odd' as any, // Monday is odd
        unavailableTimeRanges: null,
        maxWeeklySessions: null,
        notes: null
      }
    };

    const context: SchedulingContext = {
      activeBooks: [book1],
      activeTeachers: [unavailableTeacher],
      activeStudents: [student1],
      activeClasses: []
    };

    const { candidates } = generator.generate(context, [slot1], config);
    expect(candidates).toHaveLength(0);
  });

  it('skips if teacher unavailable due to time range', () => {
    const generator = new CandidateGenerator();
    const unavailableTeacher: Teacher = { 
      ...teacher1,
      preference: {
        id: 'pref1',
        teacherId: 't1',
        unavailableDayPattern: null,
        unavailableTimeRanges: ['09:00-11:00'],
        maxWeeklySessions: null,
        notes: null
      }
    };

    const context: SchedulingContext = {
      activeBooks: [book1],
      activeTeachers: [unavailableTeacher],
      activeStudents: [student1],
      activeClasses: []
    };

    const { candidates } = generator.generate(context, [slot1], config);
    expect(candidates).toHaveLength(0);
  });

  it('skips if slot conflicts with immutable existing class for teacher', () => {
    const generator = new CandidateGenerator();
    
    const activeClass: Class = {
      id: 'c1',
      name: 'Class 1',
      bookId: 'b2',
      teacherId: 't1',
      status: 'Active',
      minCapacity: 5,
      targetCapacity: 10,
      maxCapacity: 15,
      notes: null,
      schedules: [
        { id: 'sc1', classId: 'c1', weekDay: 'Monday', startTime: '09:00', endTime: '11:00' }
      ]
    };

    const context: SchedulingContext = {
      activeBooks: [book1],
      activeTeachers: [teacher1],
      activeStudents: [student1],
      activeClasses: [activeClass]
    };

    const { candidates } = generator.generate(context, [slot1], config);
    expect(candidates).toHaveLength(0);
  });

  it('allows candidate if student available according to preference', () => {
    const generator = new CandidateGenerator();
    const availableStudent: Student = {
      ...student1,
      preference: {
        id: 'pref1',
        studentId: 'st1',
        availableDayPattern: 'Odd', // Monday is Odd
        unavailableTimeRanges: null,
        notes: null
      }
    };
    const context: SchedulingContext = {
      activeBooks: [book1],
      activeTeachers: [teacher1],
      activeStudents: [availableStudent],
      activeClasses: []
    };
    const { candidates } = generator.generate(context, [slot1], config);
    expect(candidates).toHaveLength(1);
  });

  it('skips if student unavailable on that day', () => {
    const generator = new CandidateGenerator();
    const unavailableStudent: Student = {
      ...student1,
      preference: {
        id: 'pref1',
        studentId: 'st1',
        availableDayPattern: 'Even', // Monday is Odd, student only available Even
        unavailableTimeRanges: null,
        notes: null
      }
    };
    const context: SchedulingContext = {
      activeBooks: [book1],
      activeTeachers: [teacher1],
      activeStudents: [unavailableStudent],
      activeClasses: []
    };
    const { candidates } = generator.generate(context, [slot1], config);
    expect(candidates).toHaveLength(0);
  });

  it('skips if student unavailable during that time', () => {
    const generator = new CandidateGenerator();
    const unavailableStudent: Student = {
      ...student1,
      preference: {
        id: 'pref1',
        studentId: 'st1',
        availableDayPattern: 'Odd',
        unavailableTimeRanges: ['09:00-11:00'],
        notes: null
      }
    };
    const context: SchedulingContext = {
      activeBooks: [book1],
      activeTeachers: [teacher1],
      activeStudents: [unavailableStudent],
      activeClasses: []
    };
    const { candidates } = generator.generate(context, [slot1], config);
    expect(candidates).toHaveLength(0);
  });

  it('skips if slot conflicts with existing class for student', () => {
    const generator = new CandidateGenerator();
    const activeClass: Class = {
      id: 'c1',
      name: 'Class 1',
      bookId: 'b2',
      teacherId: 't2', // different teacher
      status: 'Active',
      minCapacity: 5,
      targetCapacity: 10,
      maxCapacity: 15,
      notes: null,
      schedules: [
        { id: 'sc1', classId: 'c1', weekDay: 'Monday', startTime: '09:00', endTime: '11:00' }
      ],
      enrollments: [
        { id: 'en1', classId: 'c1', studentId: 'st1', enrollmentStatus: 'Active', joinedAt: '', leftAt: null }
      ]
    };

    const context: SchedulingContext = {
      activeBooks: [book1],
      activeTeachers: [teacher1],
      activeStudents: [student1],
      activeClasses: [activeClass]
    };

    const { candidates } = generator.generate(context, [slot1], config);
    expect(candidates).toHaveLength(0);
  });

  it('records NO_ELIGIBLE_TEACHER if no teachers have the required skill', () => {
    const generator = new CandidateGenerator();
    const localContext = { activeBooks: [book1], activeTeachers: [], activeStudents: [student1], activeClasses: [] };
    const { candidates, rejectionReasons } = generator.generate(localContext, [slot1], config);
    expect(candidates).toHaveLength(0);
    expect(rejectionReasons.get('st1')?.has('NO_ELIGIBLE_TEACHER')).toBe(true);
  });

  it('records NO_MUTUAL_AVAILABILITY if teachers exist but no mutual slot is found', () => {
    const generator = new CandidateGenerator();
    const localTeacher = { ...teacher1, preference: { id: 'p', teacherId: teacher1.id, maxWeeklySessions: null, unavailableTimeRanges: null, notes: null, unavailableDayPattern: 'Odd' as any } };
    const localContext = { activeBooks: [book1], activeTeachers: [localTeacher], activeStudents: [student1], activeClasses: [] };
    const { candidates, rejectionReasons } = generator.generate(localContext, [slot1], config);
    expect(candidates).toHaveLength(0);
    expect(rejectionReasons.get('st1')?.has('NO_MUTUAL_AVAILABILITY')).toBe(true);
  });

});
