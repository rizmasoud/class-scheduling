import { ClassCandidate } from '../models/class-candidate';
import { TimeSlot } from '../models/time-slot';

export interface EvaluatedCandidate {
  readonly candidate: ClassCandidate;
  readonly totalScore: number;
  readonly reasons: readonly string[];
}

export class Optimizer {
  optimize(evaluatedCandidates: readonly EvaluatedCandidate[]): readonly ClassCandidate[] {
    const sorted = [...evaluatedCandidates].sort((a, b) => b.totalScore - a.totalScore);
    const accepted: ClassCandidate[] = [];

    for (const evaluated of sorted) {
      if (!this.hasConflict(evaluated.candidate, accepted)) {
        accepted.push(evaluated.candidate);
      }
    }

    return accepted;
  }

  private hasConflict(candidate: ClassCandidate, accepted: readonly ClassCandidate[]): boolean {
    for (const acc of accepted) {
      if (this.slotsOverlap(candidate.timeSlot, acc.timeSlot)) {
        if (candidate.teacherId === acc.teacherId) {
          return true;
        }

        const sharedStudents = candidate.studentIds.some(id => acc.studentIds.includes(id));
        if (sharedStudents) {
          return true;
        }
      }
    }
    return false;
  }

  private slotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
    if (slot1.weekDay !== slot2.weekDay) {
      return false;
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
