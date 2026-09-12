import { ISchedulingRule } from '../i-scheduling-rule';
import { ClassCandidate } from '../../models/class-candidate';
import { SchedulingContext } from '../../models/scheduling-context';
import { SchedulingEngineConfig } from '../../config/scheduling-engine.config';
import { RuleResult, RuleSeverity } from '../../models/rule-result';

export class BalancedDistributionRule implements ISchedulingRule {
  readonly name = 'BalancedDistributionRule';

  evaluate(
    candidate: ClassCandidate,
    context: SchedulingContext,
    config: SchedulingEngineConfig
  ): RuleResult {
    // Known Limitation: this score reflects only already-persisted context.activeClasses workload,
    // not candidates accepted earlier in the same optimization run.
    const teacherWeeklyLoad = (teacherId: string) => {
      return context.activeClasses
        .filter(c => c.teacherId === teacherId)
        .reduce((sum, c) => sum + (c.schedules?.length ?? 0), 0);
    };

    const eligibleTeachers = context.activeTeachers.filter(t => 
      t.skills?.some(skill => skill.bookId === candidate.bookId)
    );

    if (eligibleTeachers.length === 0) {
      return { valid: true, score: 0, severity: RuleSeverity.Information, reasons: [] };
    }

    const loads = eligibleTeachers.map(t => teacherWeeklyLoad(t.id));
    const minLoad = Math.min(...loads);
    const maxLoad = Math.max(...loads);

    const thisLoad = teacherWeeklyLoad(candidate.teacherId);
    const range = maxLoad - minLoad;
    let score = range > 0 ? 1 - ((thisLoad - minLoad) / range) : 1;
    score = Math.max(0, Math.min(1, score));

    const finalScore = score * config.ruleWeights.balancedDistributionWeight;

    const reasons = score < 0.3 
      ? [`Teacher is heavily loaded compared to peers (load: ${thisLoad}, max: ${maxLoad})`] 
      : [];

    return {
      valid: true,
      score: finalScore,
      severity: RuleSeverity.Information,
      reasons
    };
  }
}
