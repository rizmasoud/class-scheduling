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
  const book1: Book = { id: 'b1', name: 'Book 1', level: 1, sequenceOrder: 1, sessionCount: 1 };
  
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
    expect(candidates[0].timeSlots[0].id).toBe('s1');
  });

  describe('Multi-session candidates', () => {
    it('generates a candidate with 2 sessions when sessionCount is 2', () => {
      const generator = new CandidateGenerator();
      const localBook = { ...book1, sessionCount: 2 };
      const slot2 = { id: 's2', weekDay: 'Wednesday', startTime: '08:00', endTime: '10:00' } as TimeSlot;
      const context = { activeBooks: [localBook], activeTeachers: [teacher1], activeStudents: [student1], activeClasses: [] };
      const { candidates } = generator.generate(context, [slot1, slot2], config);
      expect(candidates).toHaveLength(1);
      expect(candidates[0].timeSlots).toHaveLength(2);
      expect(candidates[0].timeSlots[0].id).toBe('s1');
      expect(candidates[0].timeSlots[1].id).toBe('s2');
    });

    it('generates a candidate with 3 sessions when sessionCount is 3', () => {
      const generator = new CandidateGenerator();
      const localBook = { ...book1, sessionCount: 3 };
      const slot2 = { id: 's2', weekDay: 'Wednesday', startTime: '08:00', endTime: '10:00' } as TimeSlot;
      const slot3 = { id: 's3', weekDay: 'Saturday', startTime: '08:00', endTime: '10:00' } as TimeSlot;
      const context = { activeBooks: [localBook], activeTeachers: [teacher1], activeStudents: [student1], activeClasses: [] };
      const { candidates } = generator.generate(context, [slot1, slot2, slot3], config);
      expect(candidates).toHaveLength(1);
      expect(candidates[0].timeSlots).toHaveLength(3);
    });

    it('skips student if unavailable for one required session', () => {
      const generator = new CandidateGenerator();
      const localBook = { ...book1, sessionCount: 2 };
      const slot2 = { id: 's2', weekDay: 'Wednesday', startTime: '08:00', endTime: '10:00' } as TimeSlot;
      const localStudent = { ...student1, preference: { id: 'p', studentId: 'st1', availableDayPattern: 'Both' as any, unavailableTimeRanges: null, notes: null } };
      const activeClass = {
        id: 'c1', name: 'Class 1', bookId: 'b2', teacherId: 't2', status: 'Active', minCapacity: 5, targetCapacity: 10, maxCapacity: 15, notes: null,
        schedules: [{ id: 'sc1', classId: 'c1', weekDay: 'Monday', startTime: '08:00', endTime: '10:00' }],
        enrollments: [{ id: 'en1', classId: 'c1', studentId: 'st1', enrollmentStatus: 'Active', joinedAt: '', leftAt: null }]
      } as Class;
      const context = { activeBooks: [localBook], activeTeachers: [teacher1], activeStudents: [localStudent], activeClasses: [activeClass] };
      const { candidates } = generator.generate(context, [slot1, slot2], config);
      expect(candidates).toHaveLength(0);
    });

    it('skips teacher if unavailable for one required session', () => {
      const generator = new CandidateGenerator();
      const localBook = { ...book1, sessionCount: 2 };
      const slot2 = { id: 's2', weekDay: 'Wednesday', startTime: '08:00', endTime: '10:00' } as TimeSlot;
      const activeClass = {
        id: 'c1', name: 'Class 1', bookId: 'b2', teacherId: 't1', status: 'Active', minCapacity: 5, targetCapacity: 10, maxCapacity: 15, notes: null,
        schedules: [{ id: 'sc1', classId: 'c1', weekDay: 'Wednesday', startTime: '08:00', endTime: '10:00' }]
      } as Class;
      const context = { activeBooks: [localBook], activeTeachers: [teacher1], activeStudents: [student1], activeClasses: [activeClass] };
      const { candidates } = generator.generate(context, [slot1, slot2], config);
      expect(candidates).toHaveLength(0);
    });
  });
});
