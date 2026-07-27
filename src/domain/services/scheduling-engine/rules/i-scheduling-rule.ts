import { ClassCandidate } from '../models/class-candidate';
import { SchedulingContext } from '../models/scheduling-context';
import { RuleResult } from '../models/rule-result';
import { SchedulingEngineConfig } from '../config/scheduling-engine.config';

export interface ISchedulingRule {
  readonly name: string;
  evaluate(
    candidate: ClassCandidate,
    context: SchedulingContext,
    config: SchedulingEngineConfig
  ): RuleResult;
}
