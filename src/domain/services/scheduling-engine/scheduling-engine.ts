import { SchedulingProposal, Teacher, Student, Book, Class, ProposalUnscheduledStudent } from '@/domain/models';
import { SchedulingContext } from './models/scheduling-context';
import { SchedulingEngineConfig } from './config/scheduling-engine.config';
import { TimeSlotGenerator } from './pipeline/time-slot-generator';
import { CandidateGenerator } from './pipeline/candidate-generator';
import { RuleEngine } from './rules/rule-engine';
import { Optimizer, EvaluatedCandidate } from './pipeline/optimizer';
import { ProposalAssembler, AssemblerCandidate } from './pipeline/proposal-assembler';
import { ClassCandidate } from './models/class-candidate';

export interface GenerateProposalInput {
  proposalId: string;
  generatedAt: string;
  activeTeachers: readonly Teacher[];
  activeStudents: readonly Student[];
  activeBooks: readonly Book[];
  activeClasses: readonly Class[];
  config: SchedulingEngineConfig;
  generateProposalClassId: () => string;
  generateProposalClassScheduleId: () => string;
}

export class SchedulingEngine {
  constructor(
    private readonly timeSlotGenerator: TimeSlotGenerator,
    private readonly candidateGenerator: CandidateGenerator,
    private readonly ruleEngine: RuleEngine,
    private readonly optimizer: Optimizer,
    private readonly proposalAssembler: ProposalAssembler
  ) {}

  generateProposal(input: GenerateProposalInput): SchedulingProposal {
    const context: SchedulingContext = {
      activeTeachers: input.activeTeachers,
      activeStudents: input.activeStudents,
      activeBooks: input.activeBooks,
      activeClasses: input.activeClasses
    };

    const timeSlots = this.timeSlotGenerator.generate(context, input.config);

    const { candidates, rejectionReasons: generatorRejections } = this.candidateGenerator.generate(context, timeSlots, input.config);

    const evaluatedCandidates: EvaluatedCandidate[] = [];
    const evaluatedMap = new Map<ClassCandidate, EvaluatedCandidate>();

    for (const cand of candidates) {
      const evaluation = this.ruleEngine.evaluate(cand, context, input.config);
      if (evaluation.valid) {
        const evalCand: EvaluatedCandidate = {
          candidate: cand,
          totalScore: evaluation.totalScore,
          reasons: evaluation.reasons
        };
        evaluatedCandidates.push(evalCand);
        evaluatedMap.set(cand, evalCand);
      }
    }

    const { accepted: optimizedCandidates, rejectionReasons: optimizerRejections } = this.optimizer.optimize(evaluatedCandidates, context);

    const assemblerCandidates: AssemblerCandidate[] = optimizedCandidates.map(cand => {
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
    }

    return this.proposalAssembler.assemble({
      proposalId: input.proposalId,
      generatedAt: input.generatedAt,
      candidates: assemblerCandidates,
      context,
      unscheduledStudents,
      generateProposalClassId: input.generateProposalClassId,
      generateProposalClassScheduleId: input.generateProposalClassScheduleId
    });
  }
}
