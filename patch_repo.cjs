const fs = require('fs');
let path = 'src/infrastructure/repositories/proposal.repository.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /import { proposalClassSchedules } from '@\/core\/database\/schema\/proposal-class-schedules.schema';/,
  `import { proposalClassSchedules } from '@/core/database/schema/proposal-class-schedules.schema';\nimport { proposalUnscheduledStudents } from '@/core/database/schema/proposal-unscheduled-students.schema';`
);

// findById
code = code.replace(
  `    return ProposalMapper.toDomain(raw, classesWithSchedules);`,
  `    const pUnscheduled = await this.db.select().from(proposalUnscheduledStudents).where(eq(proposalUnscheduledStudents.proposalId, id as string));\n    return ProposalMapper.toDomain(raw, classesWithSchedules, pUnscheduled);`
);

// findMany
code = code.replace(
  `    const pSchedules = await this.db.select().from(proposalClassSchedules);`,
  `    const pSchedules = await this.db.select().from(proposalClassSchedules);\n    const pUnscheduled = await this.db.select().from(proposalUnscheduledStudents);`
);

code = code.replace(
  /return ProposalMapper\.toDomain\(prop, propClasses\);/g,
  `return ProposalMapper.toDomain(prop, propClasses, pUnscheduled.filter(u => u.proposalId === prop.id));`
);

// save - handle unscheduled students
code = code.replace(
  /      const classesWithSchedules = pClasses\.map\(c => \(\{\n        \.\.\.c,\n        schedules: pSchedules\.filter\(s => s\.proposalClassId === c\.id\)\n      \}\)\);\n      return ProposalMapper\.toDomain\(result, classesWithSchedules\);/,
  `      // 3. Save unscheduled students if provided
      if (proposal.unscheduledStudents) {
        await tx.delete(proposalUnscheduledStudents).where(eq(proposalUnscheduledStudents.proposalId, proposal.id as string));
        for (const unsch of proposal.unscheduledStudents) {
          await tx.insert(proposalUnscheduledStudents).values(ProposalMapper.toPersistenceProposalUnscheduledStudent(unsch, proposal.id as string));
        }
      } else {
        await tx.delete(proposalUnscheduledStudents).where(eq(proposalUnscheduledStudents.proposalId, proposal.id as string));
      }

      const classesWithSchedules = pClasses.map(c => ({
        ...c,
        schedules: pSchedules.filter(s => s.proposalClassId === c.id)
      }));
      const pUnscheduled = await tx.select().from(proposalUnscheduledStudents).where(eq(proposalUnscheduledStudents.proposalId, proposal.id as string));
      return ProposalMapper.toDomain(result, classesWithSchedules, pUnscheduled);`
);

fs.writeFileSync(path, code);
console.log('patched proposal.repository.ts');
