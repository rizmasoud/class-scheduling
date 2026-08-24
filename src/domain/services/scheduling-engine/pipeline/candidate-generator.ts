import { ClassCandidate } from '../models/class-candidate';
import { SchedulingContext } from '../models/scheduling-context';
import { TimeSlot } from '../models/time-slot';
import { SchedulingEngineConfig } from '../config/scheduling-engine.config';
import { Book, Teacher, Student } from '@/domain/models';

export class CandidateGenerator {
  generate(
    context: SchedulingContext,
    timeSlots: readonly TimeSlot[],
    config: SchedulingEngineConfig
  ): { candidates: readonly ClassCandidate[], rejectionReasons: Map<string, Set<string>> } {
    const candidates: ClassCandidate[] = [];
    const rejectionReasons = new Map<string, Set<string>>();
    
    const recordReason = (studentIds: readonly string[], reason: string) => {
      for (const id of studentIds) {
        if (!rejectionReasons.has(id)) {
          rejectionReasons.set(id, new Set());
        }
        rejectionReasons.get(id)!.add(reason);
      }
    };

    const studentHasCandidate = new Set<string>();

    for (const book of context.activeBooks) {
      const eligibleTeachers = this.findEligibleTeachers(book, context.activeTeachers);
      const bookStudents = context.activeStudents.filter(s => s.currentBookId === book.id);
      
      if (bookStudents.length === 0) continue;
      if (eligibleTeachers.length === 0) {
        recordReason(bookStudents.map(s => s.id), 'NO_ELIGIBLE_TEACHER');
        continue;
      }

      for (const teacher of eligibleTeachers) {
        const teacherSlots = timeSlots.filter(s => this.isTeacherAvailable(teacher, s));
        const slotCombinations = this.getCombinations(teacherSlots, book.sessionCount).filter(
          combo => new Set(combo.map(s => s.weekDay)).size === combo.length
        );

        for (const combo of slotCombinations) {
          const availableStudents = bookStudents.filter(s => 
            this.areStudentsAvailable([s.id], combo, context.activeStudents) &&
            !this.comboConflictsWithExistingClasses([s.id], teacher, combo, context)
          );

          if (availableStudents.length === 0) continue;

          const numStudents = availableStudents.length;
          let validG = 0;
          const minG = Math.ceil(numStudents / config.maximumCapacity);
          for (let g = minG; g * config.minimumCapacity <= numStudents; g++) {
            if (g * config.maximumCapacity >= numStudents) {
              validG = g;
              break;
            }
          }

          const chunks: Student[][] = [];
          if (validG > 0) {
            const baseSize = Math.floor(numStudents / validG);
            let remainder = numStudents % validG;
            let start = 0;
            for (let i = 0; i < validG; i++) {
              const size = baseSize + (remainder > 0 ? 1 : 0);
              chunks.push(availableStudents.slice(start, start + size));
              start += size;
              remainder--;
            }
          } else {
            for (let i = 0; i < numStudents; i += config.maximumCapacity) {
              chunks.push(availableStudents.slice(i, i + config.maximumCapacity));
            }
          }

          for (const chunk of chunks) {
            const chunkIds = chunk.map(s => s.id);
            
            candidates.push(this.generateCandidate(book, teacher, chunkIds, combo));
            chunkIds.forEach(id => studentHasCandidate.add(id));

            // Generate single-student fallback candidates
            if (config.minimumCapacity <= 1 && chunk.length > 1) {
              for (const s of chunk) {
                candidates.push(this.generateCandidate(book, teacher, [s.id], combo));
              }
            }
          }
        }
      }
    }

    for (const student of context.activeStudents) {
      if (!studentHasCandidate.has(student.id) && !rejectionReasons.has(student.id)) {
        recordReason([student.id], 'NO_MUTUAL_AVAILABILITY');
      }
    }

    return { candidates, rejectionReasons };
  }

  private getCombinations<T>(array: readonly T[], size: number): T[][] {
    const result: T[][] = [];
    const helper = (start: number, current: T[]) => {
      if (current.length === size) {
        result.push([...current]);
        return;
      }
      for (let i = start; i < array.length; i++) {
        current.push(array[i]);
        helper(i + 1, current);
        current.pop();
      }
    };
    helper(0, []);
    return result;
  }

  private findEligibleTeachers(book: Book, teachers: readonly Teacher[]): Teacher[] {
    return teachers.filter(teacher =>
      teacher.skills?.some(skill => skill.bookId === book.id)
    );
  }

  private isTeacherAvailable(teacher: Teacher, slot: TimeSlot): boolean {
    if (teacher.preference?.unavailableDayPattern) {
      const oddDays = ['Saturday', 'Monday', 'Wednesday'];
      const evenDays = ['Sunday', 'Tuesday', 'Thursday'];
      const isOdd = oddDays.includes(slot.weekDay);
      const isEven = evenDays.includes(slot.weekDay);
      
      const pattern = teacher.preference.unavailableDayPattern;
      if (pattern === 'Both') return false;
      if (pattern === 'Odd' && isOdd) return false;
      if (pattern === 'Even' && isEven) return false;
    }

    if (teacher.preference?.unavailableTimeRanges) {
      for (const range of teacher.preference.unavailableTimeRanges) {
        const [start, end] = range.split('-');
        if (this.timeOverlaps(slot.startTime, slot.endTime, start, end)) {
          return false;
        }
      }
    }
    return true;
  }

  private areStudentsAvailable(studentIds: readonly string[], slots: readonly TimeSlot[], allStudents: readonly Student[]): boolean {
    for (const slot of slots) {
      for (const studentId of studentIds) {
        const student = allStudents.find(s => s.id === studentId);
        if (!student || !student.preference) continue;
        
        const oddDays = ['Saturday', 'Monday', 'Wednesday'];
        const evenDays = ['Sunday', 'Tuesday', 'Thursday'];
        const isOdd = oddDays.includes(slot.weekDay);
        const isEven = evenDays.includes(slot.weekDay);

        const pattern = student.preference.availableDayPattern;
        if (pattern === 'Odd' && !isOdd) return false;
        if (pattern === 'Even' && !isEven) return false;

        if (student.preference.unavailableTimeRanges) {
          for (const range of student.preference.unavailableTimeRanges) {
            const [start, end] = range.split('-');
            if (this.timeOverlaps(slot.startTime, slot.endTime, start, end)) {
              return false;
            }
          }
        }
      }
    }
    return true;
  }

  private comboConflictsWithExistingClasses(
    studentIds: readonly string[], 
    teacher: Teacher, 
    slots: readonly TimeSlot[], 
    context: SchedulingContext
  ): boolean {
    for (const slot of slots) {
      for (const activeClass of context.activeClasses) {
        const hasOverlappingSchedule = activeClass.schedules?.some(schedule => 
          schedule.weekDay === slot.weekDay && 
          this.timeOverlaps(slot.startTime, slot.endTime, schedule.startTime, schedule.endTime)
        );
        if (!hasOverlappingSchedule) {
          continue;
        }
        if (activeClass.teacherId === teacher.id) {
          return true;
        }
        if (activeClass.enrollments) {
          for (const enrollment of activeClass.enrollments) {
            if (enrollment.enrollmentStatus === 'Active' && studentIds.includes(enrollment.studentId)) {
              return true;
            }
          }
        }
      }
    }
    return false;
  }

  private timeOverlaps(start1: string, end1: string, start2: string, end2: string): boolean {
    const s1 = this.parseTime(start1);
    const e1 = this.parseTime(end1);
    const s2 = this.parseTime(start2);
    const e2 = this.parseTime(end2);
    return Math.max(s1, s2) < Math.min(e1, e2);
  }

  private parseTime(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + (m || 0);
  }

  private generateCandidate(
    book: Book, 
    teacher: Teacher, 
    studentIds: readonly string[], 
    timeSlots: readonly TimeSlot[]
  ): ClassCandidate {
    return {
      bookId: book.id,
      teacherId: teacher.id,
      studentIds,
      timeSlots
    };
  }
}
