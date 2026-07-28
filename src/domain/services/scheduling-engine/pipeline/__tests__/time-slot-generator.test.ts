import { describe, it, expect } from 'vitest';
import { TimeSlotGenerator } from '../time-slot-generator';
import { SchedulingContext } from '../../models/scheduling-context';
import { SchedulingEngineConfig } from '../../config/scheduling-engine.config';
import { Class } from '@/domain/models';

describe('TimeSlotGenerator', () => {
  const baseConfig: SchedulingEngineConfig = {
    minimumCapacity: 5,
    preferredCapacity: 10,
    maximumCapacity: 15,
    ruleWeights: {
      teacherPreferenceWeight: 1,
      capacityWeight: 1,
      bookCompatibilityWeight: 1,
    },
    timeSlotConfig: {
      allowedDaysOfWeek: ['Monday', 'Tuesday'],
      instituteHours: {
        openingTime: '08:00',
        closingTime: '12:00',
      },
      classDurationMinutes: 120,
    },
  };

  it('generates contiguous time slots based on configuration with no active classes', () => {
    const generator = new TimeSlotGenerator();
    
    const context: SchedulingContext = {
      activeTeachers: [],
      activeStudents: [],
      activeBooks: [],
      activeClasses: [],
    };
    
    const slots = generator.generate(context, baseConfig);

    expect(slots).toHaveLength(4);
    expect(slots[0]).toEqual({
      id: 'Monday-08:00-10:00',
      weekDay: 'Monday',
      startTime: '08:00',
      endTime: '10:00',
    });
    expect(slots[1]).toEqual({
      id: 'Monday-10:00-12:00',
      weekDay: 'Monday',
      startTime: '10:00',
      endTime: '12:00',
    });
    expect(slots[2]).toEqual({
      id: 'Tuesday-08:00-10:00',
      weekDay: 'Tuesday',
      startTime: '08:00',
      endTime: '10:00',
    });
    expect(slots[3]).toEqual({
      id: 'Tuesday-10:00-12:00',
      weekDay: 'Tuesday',
      startTime: '10:00',
      endTime: '12:00',
    });
  });

  it('handles odd durations and truncates last slot if it exceeds closing time', () => {
    const generator = new TimeSlotGenerator();
    
    const context: SchedulingContext = {
      activeTeachers: [],
      activeStudents: [],
      activeBooks: [],
      activeClasses: [],
    };
    
    const config: SchedulingEngineConfig = {
      ...baseConfig,
      timeSlotConfig: {
        allowedDaysOfWeek: ['Wednesday'],
        instituteHours: {
          openingTime: '09:00',
          closingTime: '10:30',
        },
        classDurationMinutes: 60,
      },
    };

    const slots = generator.generate(context, config);

    expect(slots).toHaveLength(1);
    expect(slots[0]).toEqual({
      id: 'Wednesday-09:00-10:00',
      weekDay: 'Wednesday',
      startTime: '09:00',
      endTime: '10:00',
    });
  });

  it('removes a slot that is completely occupied by an active class', () => {
    const generator = new TimeSlotGenerator();
    
    const occupiedClass: Class = {
      id: 'c1',
      name: 'Math',
      bookId: 'b1',
      teacherId: 't1',
      status: 'Active',
      minCapacity: 5,
      targetCapacity: 10,
      maxCapacity: 15,
      notes: null,
      schedules: [
        {
          id: 's1',
          classId: 'c1',
          weekDay: 'Monday',
          startTime: '08:00',
          endTime: '10:00'
        }
      ]
    };

    const context: SchedulingContext = {
      activeTeachers: [],
      activeStudents: [],
      activeBooks: [],
      activeClasses: [occupiedClass],
    };
    
    const slots = generator.generate(context, baseConfig);

    expect(slots).toHaveLength(3);
    expect(slots.find(s => s.id === 'Monday-08:00-10:00')).toBeUndefined();
    expect(slots.find(s => s.id === 'Monday-10:00-12:00')).toBeDefined();
    expect(slots.find(s => s.id === 'Tuesday-08:00-10:00')).toBeDefined();
    expect(slots.find(s => s.id === 'Tuesday-10:00-12:00')).toBeDefined();
  });

  it('removes multiple slots that are partially or fully occupied by active classes', () => {
    const generator = new TimeSlotGenerator();
    
    const class1: Class = {
      id: 'c1',
      name: 'Math',
      bookId: 'b1',
      teacherId: 't1',
      status: 'Active',
      minCapacity: 5,
      targetCapacity: 10,
      maxCapacity: 15,
      notes: null,
      schedules: [
        {
          id: 's1',
          classId: 'c1',
          weekDay: 'Monday',
          startTime: '09:00',
          endTime: '11:00' // Overlaps 08:00-10:00 and 10:00-12:00
        }
      ]
    };

    const class2: Class = {
      id: 'c2',
      name: 'Science',
      bookId: 'b2',
      teacherId: 't2',
      status: 'Active',
      minCapacity: 5,
      targetCapacity: 10,
      maxCapacity: 15,
      notes: null,
      schedules: [
        {
          id: 's2',
          classId: 'c2',
          weekDay: 'Tuesday',
          startTime: '09:00',
          endTime: '09:30' // Overlaps 08:00-10:00
        }
      ]
    };

    const context: SchedulingContext = {
      activeTeachers: [],
      activeStudents: [],
      activeBooks: [],
      activeClasses: [class1, class2],
    };
    
    const slots = generator.generate(context, baseConfig);

    // Monday-08:00-10:00 overlapping with c1 (09:00-11:00) -> removed
    // Monday-10:00-12:00 overlapping with c1 (09:00-11:00) -> removed
    // Tuesday-08:00-10:00 overlapping with c2 (09:00-09:30) -> removed
    // Tuesday-10:00-12:00 not overlapping -> kept

    expect(slots).toHaveLength(1);
    expect(slots[0]).toEqual({
      id: 'Tuesday-10:00-12:00',
      weekDay: 'Tuesday',
      startTime: '10:00',
      endTime: '12:00',
    });
  });
});
