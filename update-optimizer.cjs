const fs = require('fs');

let content = fs.readFileSync('src/domain/services/scheduling-engine/pipeline/optimizer.ts', 'utf8');

const newCode = `import { SchedulingContext } from '../models/scheduling-context';
import { ClassCandidate } from '../models/class-candidate';
import { TimeSlot } from '../models/time-slot';
import { RuleEngine } from '../rules/rule-engine';
import { SchedulingEngineConfig } from '../../config/scheduling-engine.config';

export interface EvaluatedCandidate {
  readonly candidate: ClassCandidate;
  readonly totalScore: number;
  readonly reasons: readonly string[];
}

export class Optimizer {
  constructor(private readonly ruleEngine?: RuleEngine) {}

  optimize(
    evaluatedCandidates: readonly EvaluatedCandidate[],
    context: SchedulingContext,
    config?: SchedulingEngineConfig
  ): { accepted: readonly ClassCandidate[], rejectionReasons: Map<string, Set<string>> } {
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
      const pruningResult = this.pruneCandidate(evaluated.candidate, accepted, context, config);
      if (pruningResult.prunedCandidate) {
        accepted.push(pruningResult.prunedCandidate);
      }
      if (pruningResult.removedStudents.length > 0 && pruningResult.conflictReason) {
        recordReason(pruningResult.removedStudents, pruningResult.conflictReason);
      }
    }

    return { accepted, rejectionReasons };
  }

  private pruneCandidate(
    candidate: ClassCandidate,
    accepted: readonly ClassCandidate[],
    context: SchedulingContext,
    config?: SchedulingEngineConfig
  ): { prunedCandidate: ClassCandidate | null, conflictReason: string | null, removedStudents: string[] } {
    // 1. Check teacher capacity
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
          currentSessions += acc.timeSlots.length;
        }
      }
      
      if (currentSessions + candidate.timeSlots.length > teacher.preference.maxWeeklySessions) {
        return { prunedCandidate: null, conflictReason: 'TEACHER_CAPACITY_REACHED', removedStudents: [...candidate.studentIds] };
      }
    }

    // 2. Check for time overlap
    let currentStudentIds = [...candidate.studentIds];
    const removedStudents = new Set<string>();

    for (const acc of accepted) {
      let hasOverlap = false;
      for (const s1 of candidate.timeSlots) {
        for (const s2 of acc.timeSlots) {
          if (this.slotsOverlap(s1, s2)) {
            hasOverlap = true;
            break;
          }
        }
        if (hasOverlap) break;
      }
      
      if (hasOverlap) {
        if (candidate.teacherId === acc.teacherId) {
          return { prunedCandidate: null, conflictReason: 'OPTIMIZER_CONFLICT', removedStudents: [...candidate.studentIds] };
        }
        
        // Remove shared students
        const overlappingStudents = currentStudentIds.filter(id => acc.studentIds.includes(id));
        for (const id of overlappingStudents) {
          removedStudents.add(id);
        }
        currentStudentIds = currentStudentIds.filter(id => !acc.studentIds.includes(id));
      }
    }

    if (currentStudentIds.length === 0) {
      return { prunedCandidate: null, conflictReason: 'OPTIMIZER_CONFLICT', removedStudents: Array.from(removedStudents) };
    }

    const prunedCandidate: ClassCandidate = {
      ...candidate,
      studentIds: currentStudentIds
    };

    if (currentStudentIds.length < candidate.studentIds.length) {
      // Re-evaluate pruned candidate
      if (this.ruleEngine && config) {
        const evalResult = this.ruleEngine.evaluate(prunedCandidate, context, config);
        if (!evalResult.valid) {
          return { prunedCandidate: null, conflictReason: 'OPTIMIZER_CONFLICT', removedStudents: [...candidate.studentIds] };
        }
      } else if (config) {
         if (currentStudentIds.length < config.minimumCapacity) {
            return { prunedCandidate: null, conflictReason: 'OPTIMIZER_CONFLICT', removedStudents: [...candidate.studentIds] };
         }
      }
    }

    return { prunedCandidate, conflictReason: removedStudents.size > 0 ? 'OPTIMIZER_CONFLICT' : null, removedStudents: Array.from(removedStudents) };
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
`;

fs.writeFileSync('src/domain/services/scheduling-engine/pipeline/optimizer.ts', newCode);
