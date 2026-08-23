const fs = require('fs');
let content = fs.readFileSync('src/domain/services/scheduling-engine/__tests__/scheduling-engine.test.ts', 'utf8');

content = content.replace(/const proposal = engine.generateProposal\(\{ context, config \}\);/g, `const proposal = engine.generateProposal({
      proposalId: 'prop-1',
      generatedAt: 'now',
      activeBooks: context.activeBooks,
      activeTeachers: context.activeTeachers,
      activeStudents: context.activeStudents,
      activeClasses: context.activeClasses,
      config,
      generateProposalClassId: () => 'cls-1',
      generateProposalClassScheduleId: () => 'sch-1'
    });`);

fs.writeFileSync('src/domain/services/scheduling-engine/__tests__/scheduling-engine.test.ts', content);
