import { Injectable, Logger } from '@nestjs/common';
import { ISchedulingRunner, SchedulingRunnerInput } from '../application/i-scheduling-runner.port';
import { 
  SchedulingEngine, 
  SchedulingProposal,
  CandidateGenerator,
  Optimizer,
  ProposalAssembler,
  RuleEngine,
  TimeSlotGenerator,
  CapacityLimitRule,
  StudentDoubleBookingRule,
  TeacherTimeConflictRule,
  TeacherBookCompatibilityRule,
  BalancedDistributionRule,
  TeacherPreferenceRule,
  OptimalCapacityRule,
  TeacherExperienceRule,
} from '@class-scheduling/domain';
import { randomUUID } from 'crypto';

@Injectable()
export class SyncSchedulingRunner implements ISchedulingRunner {
  private readonly logger = new Logger(SyncSchedulingRunner.name);

  async run(input: SchedulingRunnerInput): Promise<SchedulingProposal> {
    this.logger.log(`Starting synchronous scheduling run for proposal ${input.proposalId} (term ${input.termId})`);
    const startTime = Date.now();
    
    const rules = [
      new CapacityLimitRule(),
      new StudentDoubleBookingRule(),
      new TeacherTimeConflictRule(),
      new TeacherBookCompatibilityRule(),
      new BalancedDistributionRule(),
      new TeacherPreferenceRule(),
      new OptimalCapacityRule(),
      new TeacherExperienceRule(),
    ];

    const ruleEngine = new RuleEngine(rules);
    const timeSlotGenerator = new TimeSlotGenerator();
    const candidateGenerator = new CandidateGenerator();
    const optimizer = new Optimizer(ruleEngine);
    const proposalAssembler = new ProposalAssembler();

    const engine = new SchedulingEngine(
      timeSlotGenerator,
      candidateGenerator,
      ruleEngine,
      optimizer,
      proposalAssembler
    );

    const proposal = engine.generateProposal({
      proposalId: input.proposalId,
      generatedAt: new Date().toISOString(),
      activeTeachers: input.context.activeTeachers,
      activeStudents: input.context.activeStudents,
      activeBooks: input.context.activeBooks,
      activeClasses: input.context.activeClasses ?? [],
      config: input.config,
      generateProposalClassId: () => randomUUID(),
      generateProposalClassScheduleId: () => randomUUID(),
    });
    
    const duration = Date.now() - startTime;
    this.logger.log(`Scheduling run completed in ${duration}ms. Generated ${proposal.classes?.length || 0} classes.`);

    return proposal;
  }
}

