import { ClassSession, ClassSchedule, WeekDay } from '../models';

const WEEKDAY_TO_NUM: Record<string, number> = {
  'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
  'Thursday': 4, 'Friday': 5, 'Saturday': 6
};

export function projectSessionDates(
  termStartDateStr: string,
  termEndDateStr: string,
  schedules: Omit<ClassSchedule, 'id' | 'classId'>[],
  sessionCount: number,
  classId: string,
  scheduledTeacherId: string | null,
  generateId: () => string
): ClassSession[] {
  // Parses dates at noon to avoid timezone shifts.
  const start = new Date(termStartDateStr + 'T12:00:00Z');
  const end = new Date(termEndDateStr + 'T12:00:00Z');
  
  if (schedules.length === 0) return [];
  
  let current = new Date(start);
  const sessions: ClassSession[] = [];
  
  // Sort schedules to make them consistent
  const sortedSchedules = [...schedules].sort((a, b) => {
    return WEEKDAY_TO_NUM[a.weekDay] - WEEKDAY_TO_NUM[b.weekDay] || a.startTime.localeCompare(b.startTime);
  });
  
  // Maximum days to loop (to prevent infinite loop if data is weird)
  let sanityCheck = 0;
  
  while (sessions.length < sessionCount && current <= end && sanityCheck < 1000) {
    const dayOfWeek = current.getUTCDay();
    const matchingSchedules = sortedSchedules.filter(s => WEEKDAY_TO_NUM[s.weekDay] === dayOfWeek);
    
    for (const sched of matchingSchedules) {
      if (sessions.length >= sessionCount) break;
      const dateStr = current.toISOString().split('T')[0];
      sessions.push({
        id: generateId(),
        classId,
        date: dateStr,
        startTime: sched.startTime,
        endTime: sched.endTime,
        scheduledTeacherId,
        actualTeacherId: scheduledTeacherId,
        status: 'Scheduled'
      });
    }
    
    current.setUTCDate(current.getUTCDate() + 1);
    sanityCheck++;
  }
  
  return sessions;
}
