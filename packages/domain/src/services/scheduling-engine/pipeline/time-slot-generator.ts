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
        
        const slot: TimeSlot = {
          id: `${weekDay}-${startTimeStr}-${endTimeStr}`,
          weekDay,
          startTime: startTimeStr,
          endTime: endTimeStr,
        };

        timeSlots.push(slot);

        currentStartTime = currentEndTime;
      }
    }

    return timeSlots;
  }

  private isSlotOccupied(slot: TimeSlot, context: SchedulingContext): boolean {
    const s1 = this.parseTime(slot.startTime);
    const e1 = this.parseTime(slot.endTime);

    for (const activeClass of context.activeClasses) {
      if (!activeClass.schedules) continue;
      
      for (const schedule of activeClass.schedules) {
        if (schedule.weekDay !== slot.weekDay) {
          continue;
        }

        const s2 = this.parseTime(schedule.startTime);
        const e2 = this.parseTime(schedule.endTime);

        if (Math.max(s1, s2) < Math.min(e1, e2)) {
          return true;
        }
      }
    }

    return false;
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

