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
  ): readonly ClassCandidate[] {
    const candidates: ClassCandidate[] = [];
    const studentsByBook = this.groupStudentsByBook(context.activeStudents, context.activeBooks);

    for (const book of context.activeBooks) {
      const studentIds = studentsByBook.get(book.id) || [];
      
      if (studentIds.length === 0) {
        continue;
      }

      const studentChunks: string[][] = [];
      for (let i = 0; i < studentIds.length; i += config.maximumCapacity) {
        studentChunks.push(studentIds.slice(i, i + config.maximumCapacity));
      }

      const eligibleTeachers = this.findEligibleTeachers(book, context.activeTeachers);

      for (const chunk of studentChunks) {
        for (const teacher of eligibleTeachers) {
          for (const slot of timeSlots) {
            if (!this.isTeacherAvailable(teacher, slot)) {
              continue;
            }

            if (!this.areStudentsAvailable(chunk, slot, context.activeStudents)) {
              continue;
            }

            if (this.slotConflictsWithExistingClasses(chunk, teacher, slot, context)) {
              continue;
            }

            candidates.push(this.generateCandidate(book, teacher, chunk, slot));
          }
        }
      }
    }

    return candidates;
  }

  private groupStudentsByBook(students: readonly Student[], books: readonly Book[]): Map<string, string[]> {
    const map = new Map<string, string[]>();
    for (const book of books) {
      map.set(book.id, []);
    }
    for (const student of students) {
      const list = map.get(student.currentBookId);
      if (list) {
        list.push(student.id);
      }
    }
    return map;
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
