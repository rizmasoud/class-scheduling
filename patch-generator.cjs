const fs = require('fs');
const file = 'src/domain/services/scheduling-engine/pipeline/candidate-generator.ts';

const content = `import { ClassCandidate } from '../models/class-candidate';
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
        for (const slot of timeSlots) {
          if (!this.isTeacherAvailable(teacher, slot)) continue;

          const availableStudents = bookStudents.filter(s => 
            this.areStudentsAvailable([s.id], slot, context.activeStudents) &&
            !this.slotConflictsWithExistingClasses([s.id], teacher, slot, context)
          );

          if (availableStudents.length === 0) continue;

          // Generate candidates for chunks
          for (let i = 0; i < availableStudents.length; i += config.maximumCapacity) {
            const chunk = availableStudents.slice(i, i + config.maximumCapacity);
            const chunkIds = chunk.map(s => s.id);
            
            candidates.push(this.generateCandidate(book, teacher, chunkIds, slot));
            chunkIds.forEach(id => studentHasCandidate.add(id));

            // Generate single-student fallback candidates
            if (chunk.length > 1) {
              for (const s of chunk) {
                candidates.push(this.generateCandidate(book, teacher, [s.id], slot));
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

  private areStudentsAvailable(studentIds: readonly string[], slot: TimeSlot, allStudents: readonly Student[]): boolean {
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
    return true;
  }

  private slotConflictsWithExistingClasses(
    studentIds: readonly string[], 
    teacher: Teacher, 
    slot: TimeSlot, 
    context: SchedulingContext
  ): boolean {
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
    slot: TimeSlot
  ): ClassCandidate {
    return {
      bookId: book.id,
      teacherId: teacher.id,
      studentIds,
      timeSlot: slot
    };
  }
}
`;

fs.writeFileSync(file, content);
console.log('Patched candidate-generator.ts');
