import { ISchedulingRule } from '../i-scheduling-rule';
import { ClassCandidate } from '../../models/class-candidate';
import { SchedulingContext } from '../../models/scheduling-context';
import { SchedulingEngineConfig } from '../../config/scheduling-engine.config';
import { RuleResult, RuleSeverity } from '../../models/rule-result';

export class TeacherExperienceRule implements ISchedulingRule {
  readonly name = 'TeacherExperienceRule';

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
