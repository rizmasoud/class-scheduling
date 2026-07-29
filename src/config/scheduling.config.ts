import { SchedulingEngineConfig } from '@/domain/services/scheduling-engine/config/scheduling-engine.config';

export const defaultSchedulingConfig: SchedulingEngineConfig = {
  minimumCapacity: 5,
  preferredCapacity: 8,
  maximumCapacity: 12,
  ruleWeights: {
    teacherPreferenceWeight: 1,
    capacityWeight: 1,
    bookCompatibilityWeight: 1,
  },
  timeSlotConfig: {
    allowedDaysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    instituteHours: {
      openingTime: '08:00',
      closingTime: '20:00',
    },
    classDurationMinutes: 120,
  },
};
