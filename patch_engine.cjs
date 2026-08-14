const fs = require('fs');
let path = 'src/domain/services/scheduling-engine/scheduling-engine.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  `import { SchedulingProposal, Teacher, Student, Book, Class } from '@/domain/models';`,
  `import { SchedulingProposal, Teacher, Student, Book, Class, ProposalUnscheduledStudent } from '@/domain/models';`
);

code = code.replace(
  `    const candidates = this.candidateGenerator.generate(context, timeSlots, input.config);`,
  `    const { candidates, rejectionReasons: generatorRejections } = this.candidateGenerator.generate(context, timeSlots, input.config);`
);

code = code.replace(
  `    const optimizedCandidates = this.optimizer.optimize(evaluatedCandidates, context);`,
  `    const { accepted: optimizedCandidates, rejectionReasons: optimizerRejections } = this.optimizer.optimize(evaluatedCandidates, context);`
);

code = code.replace(
  `    const assemblerCandidates: AssemblerCandidate[] = optimizedCandidates.map(cand => {
      const evalCand = evaluatedMap.get(cand)!;
      return {
        candidate: cand,
        score: evalCand.totalScore,
        reasons: evalCand.reasons
      };
    });`,
  `    const assemblerCandidates: AssemblerCandidate[] = optimizedCandidates.map(cand => {
      const evalCand = evaluatedMap.get(cand)!;
      return {
        candidate: cand,
        score: evalCand.totalScore,
        reasons: evalCand.reasons
      };
    });

    const acceptedStudentIds = new Set<string>();
    for (const cand of optimizedCandidates) {
      for (const studentId of cand.studentIds) {
        acceptedStudentIds.add(studentId);
      }
    }

    const unscheduledStudents: ProposalUnscheduledStudent[] = [];
    for (const student of context.activeStudents) {
      if (!acceptedStudentIds.has(student.id)) {
        const reasons = new Set<string>();
        
        if (generatorRejections.has(student.id)) {
          generatorRejections.get(student.id)!.forEach(r => reasons.add(r));
        }
        
        if (optimizerRejections.has(student.id)) {
          optimizerRejections.get(student.id)!.forEach(r => reasons.add(r));
        }

        unscheduledStudents.push({
          studentId: student.id,
          reasons: Array.from(reasons)
        });
      }
    }`
);

code = code.replace(
  `      candidates: assemblerCandidates,
      context,`,
  `      candidates: assemblerCandidates,
      context,
      unscheduledStudents,`
);


fs.writeFileSync(path, code);
console.log('patched scheduling-engine.ts');
