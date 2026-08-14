const fs = require('fs');
let path = 'src/domain/services/scheduling-engine/pipeline/proposal-assembler.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `import { SchedulingProposal, ProposalClass, ProposalClassSchedule, WeekDay } from '@/domain/models';`,
  `import { SchedulingProposal, ProposalClass, ProposalClassSchedule, WeekDay, ProposalUnscheduledStudent } from '@/domain/models';`
);

code = code.replace(
  `  context: SchedulingContext;
  generateProposalClassId: () => string;
  generateProposalClassScheduleId: () => string;
}`,
  `  context: SchedulingContext;
  unscheduledStudents: readonly ProposalUnscheduledStudent[];
  generateProposalClassId: () => string;
  generateProposalClassScheduleId: () => string;
}`
);

code = code.replace(
  `    return {
      id: input.proposalId,
      generatedAt: input.generatedAt,
      status: 'Draft',
      notes: null,
      classes
    };`,
  `    return {
      id: input.proposalId,
      generatedAt: input.generatedAt,
      status: 'Draft',
      notes: null,
      classes,
      unscheduledStudents: input.unscheduledStudents ? [...input.unscheduledStudents] : []
    };`
);


fs.writeFileSync(path, code);
console.log('patched proposal-assembler.ts');
