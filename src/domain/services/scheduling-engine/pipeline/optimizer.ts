import { SchedulingContext } from '../models/scheduling-context';
import { ClassCandidate } from '../models/class-candidate';
import { TimeSlot } from '../models/time-slot';

export interface EvaluatedCandidate {
  readonly candidate: ClassCandidate;
  readonly totalScore: number;
  readonly reasons: readonly string[];
}

export class Optimizer {
  optimize(evaluatedCandidates: readonly EvaluatedCandidate[], context: SchedulingContext): { accepted: readonly ClassCandidate[], rejectionReasons: Map<string, Set<string>> } {
    const sorted = [...evaluatedCandidates].sort((a, b) => b.totalScore - a.totalScore);
    const accepted: ClassCandidate[] = [];
    const rejectionReasons = new Map<string, Set<string>>();
    
    const recordReason = (studentIds: readonly string[], reason: string) => {
      for (const id of studentIds) {
        if (!rejectionReasons.has(id)) {
          rejectionReasons.set(id, new Set());
        }
        rejectionReasons.get(id)!.add(reason);
      }
    };

    for (const evaluated of sorted) {
      const conflictReason = this.getConflictReason(evaluated.candidate, accepted, context);
      if (!conflictReason) {
        accepted.push(evaluated.candidate);
      } else {
        recordReason(evaluated.candidate.studentIds, conflictReason);
      }
    }

    return { accepted, rejectionReasons };
  }

  private getConflictReason(candidate: ClassCandidate, accepted: readonly ClassCandidate[], context: SchedulingContext): string | null {
    const teacher = context.activeTeachers.find(t => t.id === candidate.teacherId);
    if (teacher?.preference?.maxWeeklySessions != null) {
      let currentSessions = 0;
      for (const activeClass of context.activeClasses) {
        if (activeClass.teacherId === teacher.id && activeClass.schedules) {
          currentSessions += activeClass.schedules.length;
        }
      }
      for (const acc of accepted) {
        if (acc.teacherId === teacher.id) {
          currentSessions += 1;
        }
      }
      if (currentSessions >= teacher.preference.maxWeeklySessions) {
        return 'TEACHER_CAPACITY_REACHED';
      }
    }
    for (const acc of accepted) {
      const sharedStudents = candidate.studentIds.some(id => acc.studentIds.includes(id));
      if (sharedStudents) {
        return 'OPTIMIZER_CONFLICT';
      }

      if (this.slotsOverlap(candidate.timeSlot, acc.timeSlot)) {
        if (candidate.teacherId === acc.teacherId) {
          return 'OPTIMIZER_CONFLICT';
        }
      }
    }
    return null;
  }

  private slotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
    if (slot1.weekDay !== slot2.weekDay) {
      return null;
    }

    const s1 = this.parseTime(slot1.startTime);
    const e1 = this.parseTime(slot1.endTime);
    const s2 = this.parseTime(slot2.startTime);
    const e2 = this.parseTime(slot2.endTime);

    return Math.max(s1, s2) < Math.min(e1, e2);
  }

  private parseTime(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + (m || 0);
  }
}
