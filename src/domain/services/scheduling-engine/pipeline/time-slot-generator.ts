import { TimeSlot } from '../models/time-slot';
import { SchedulingContext } from '../models/scheduling-context';
import { SchedulingEngineConfig } from '../config/scheduling-engine.config';

export class TimeSlotGenerator {
  generate(context: SchedulingContext, config: SchedulingEngineConfig): readonly TimeSlot[] {
    const timeSlots: TimeSlot[] = [];
    const { allowedDaysOfWeek, instituteHours, classDurationMinutes } = config.timeSlotConfig;
    
    for (const weekDay of allowedDaysOfWeek) {
      let currentStartTime = this.parseTime(instituteHours.openingTime);
      const closingTime = this.parseTime(instituteHours.closingTime);

      while (currentStartTime + classDurationMinutes <= closingTime) {
        const currentEndTime = currentStartTime + classDurationMinutes;
        
        const startTimeStr = this.formatTime(currentStartTime);
        const endTimeStr = this.formatTime(currentEndTime);
        
        timeSlots.push({
          id: `${weekDay}-${startTimeStr}-${endTimeStr}`,
          weekDay,
          startTime: startTimeStr,
          endTime: endTimeStr,
        });

        currentStartTime = currentEndTime;
      }
    }

    return timeSlots;
  }

  private parseTime(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  }

  private formatTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}
