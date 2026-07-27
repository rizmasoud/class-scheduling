import { ISchedulingRule } from '../i-scheduling-rule';
import { ClassCandidate } from '../../models/class-candidate';
import { SchedulingContext } from '../../models/scheduling-context';
import { SchedulingEngineConfig } from '../../config/scheduling-engine.config';
import { RuleResult, RuleSeverity } from '../../models/rule-result';

export class CapacityLimitRule implements ISchedulingRule {
  readonly name = 'CapacityLimitRule';

  evaluate(
    candidate: ClassCandidate,
    context: SchedulingContext,
    config: SchedulingEngineConfig
  ): RuleResult {
    return {
      valid: true,
      score: 0,
      severity: RuleSeverity.Information,
      reasons: []
    };
  }
}
