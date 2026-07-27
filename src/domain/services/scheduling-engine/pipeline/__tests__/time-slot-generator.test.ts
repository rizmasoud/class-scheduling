import { describe, it, expect } from 'vitest';
import { TimeSlotGenerator } from '../time-slot-generator';
import { SchedulingContext } from '../../models/scheduling-context';
import { SchedulingEngineConfig } from '../../config/scheduling-engine.config';

describe('TimeSlotGenerator', () => {
  it('generates contiguous time slots based on configuration', () => {
    const generator = new TimeSlotGenerator();
    
    const context: SchedulingContext = {
      activeTeachers: [],
      activeStudents: [],
      activeBooks: [],
      activeClasses: [],
    };
    
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
        allowedDaysOfWeek: ['Monday', 'Tuesday'],
        instituteHours: {
          openingTime: '08:00',
          closingTime: '12:00',
        },
        classDurationMinutes: 120,
      },
    };

    const slots = generator.generate(context, config);

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
      minimumCapacity: 5,
      preferredCapacity: 10,
      maximumCapacity: 15,
      ruleWeights: {
        teacherPreferenceWeight: 1,
        capacityWeight: 1,
        bookCompatibilityWeight: 1,
      },
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
});
