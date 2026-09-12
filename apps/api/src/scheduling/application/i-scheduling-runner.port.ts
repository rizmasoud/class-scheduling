import { SchedulingContext, SchedulingProposal, SchedulingEngineConfig } from '@class-scheduling/domain';

export const ISchedulingRunner = Symbol('ISchedulingRunner');

export interface SchedulingRunnerInput {
  proposalId: string;
  termId: string;
  context: SchedulingContext;
  config: SchedulingEngineConfig;
}

export interface ISchedulingRunner {
  run(input: SchedulingRunnerInput): Promise<SchedulingProposal>;
}
