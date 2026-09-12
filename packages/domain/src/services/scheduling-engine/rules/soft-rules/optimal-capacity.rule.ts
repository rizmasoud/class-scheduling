import { ISchedulingRule } from '../i-scheduling-rule';
import { ClassCandidate } from '../../models/class-candidate';
import { SchedulingContext } from '../../models/scheduling-context';
import { SchedulingEngineConfig } from '../../config/scheduling-engine.config';
import { RuleResult, RuleSeverity } from '../../models/rule-result';

export class OptimalCapacityRule implements ISchedulingRule {
  readonly name = 'OptimalCapacityRule';

  evaluate(
    candidate: ClassCandidate,
    context: SchedulingContext,
    config: SchedulingEngineConfig
  ): RuleResult {
    const groupSize = candidate.studentIds.length;
    const distance = Math.abs(groupSize - config.preferredCapacity);
    const maxPossibleDistance = Math.max(
      config.preferredCapacity - config.minimumCapacity,
      config.maximumCapacity - config.preferredCapacity
    );

    let score = maxPossibleDistance > 0 ? 1 - (distance / maxPossibleDistance) : 1;
    score = Math.max(0, Math.min(1, score)); // clamp

    const finalScore = score * config.ruleWeights.optimalCapacityWeight;

    const reasons = score < 0.3 
      ? [`Group size (${groupSize}) deviates significantly from the preferred capacity (${config.preferredCapacity})`] 
      : [];

    return {
      valid: true,
      score: finalScore,
      severity: RuleSeverity.Information,
      reasons
    };
  }
}
