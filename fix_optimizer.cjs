const fs = require('fs');
let path = 'src/domain/services/scheduling-engine/pipeline/optimizer.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `  optimize(evaluatedCandidates: readonly EvaluatedCandidate[], context: SchedulingContext): readonly ClassCandidate[] {
    const sorted = [...evaluatedCandidates].sort((a, b) => b.totalScore - a.totalScore);
    const accepted: ClassCandidate[] = [];

    for (const evaluated of sorted) {
      if (!this.hasConflict(evaluated.candidate, accepted, context)) {
        accepted.push(evaluated.candidate);
      }
    }

    return accepted;
  }`,
  `  optimize(evaluatedCandidates: readonly EvaluatedCandidate[], context: SchedulingContext): { accepted: readonly ClassCandidate[], rejectionReasons: Map<string, Set<string>> } {
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
  }`
);

fs.writeFileSync(path, code);
console.log('fixed optimizer.ts');
