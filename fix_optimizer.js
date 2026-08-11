const fs = require('fs');
let code = fs.readFileSync('src/domain/services/scheduling-engine/pipeline/optimizer.ts', 'utf8');

const replacement = `
  private hasConflict(candidate: ClassCandidate, accepted: readonly ClassCandidate[]): boolean {
    for (const acc of accepted) {
      const sharedStudents = candidate.studentIds.some(id => acc.studentIds.includes(id));
      if (sharedStudents) {
        return true;
      }
      if (this.slotsOverlap(candidate.timeSlot, acc.timeSlot)) {
        if (candidate.teacherId === acc.teacherId) {
          return true;
        }
      }
    }
    return false;
  }
`;

code = code.replace(/  private hasConflict\([\s\S]*?  }/, replacement.trim());
fs.writeFileSync('src/domain/services/scheduling-engine/pipeline/optimizer.ts', code);
