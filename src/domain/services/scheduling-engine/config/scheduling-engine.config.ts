export interface RuleWeights {
  readonly teacherPreferenceWeight: number;
  readonly capacityWeight: number;
  readonly bookCompatibilityWeight: number;
}

export interface InstituteHours {
  readonly openingTime: string;
  readonly closingTime: string;
}

export interface TimeSlotConfig {
  readonly allowedDaysOfWeek: readonly string[];
  readonly instituteHours: InstituteHours;
  readonly classDurationMinutes: number;
}

export interface SchedulingEngineConfig {
  readonly minimumCapacity: number;
  readonly preferredCapacity: number;
  readonly maximumCapacity: number;
  readonly ruleWeights: RuleWeights;
  readonly timeSlotConfig: TimeSlotConfig;
}
