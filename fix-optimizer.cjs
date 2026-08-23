const fs = require('fs');
let content = fs.readFileSync('src/domain/services/scheduling-engine/pipeline/optimizer.ts', 'utf8');

content = content.replace("const prunedCandidate: ClassCandidate = {\n      ...candidate,\n      studentIds: currentStudentIds\n    };",
`const prunedCandidate: ClassCandidate = currentStudentIds.length === candidate.studentIds.length
      ? candidate
      : {
          ...candidate,
          studentIds: currentStudentIds
        };`);

fs.writeFileSync('src/domain/services/scheduling-engine/pipeline/optimizer.ts', content);
