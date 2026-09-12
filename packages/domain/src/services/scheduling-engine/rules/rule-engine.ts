import { ClassCandidate } from '../models/class-candidate';
import { SchedulingContext } from '../models/scheduling-context';
import { SchedulingEngineConfig } from '../config/scheduling-engine.config';
import { ISchedulingRule } from './i-scheduling-rule';
import { EvaluationResult } from '../models/evaluation-result';

export class RuleEngine {
  constructor(private readonly rules: readonly ISchedulingRule[]) {}

  evaluate(
    candidate: ClassCandidate,
    context: SchedulingContext,
    config: SchedulingEngineConfig
  ): EvaluationResult {
    let totalScore = 0;
    const reasons: string[] = [];

    for (const rule of this.rules) {
      const result = rule.evaluate(candidate, context, config);

      if (!result.valid) {
        return {
          valid: false,
          totalScore: 0,
          reasons: [...reasons, ...result.reasons],
          failedRule: rule.name
        };
      }

      totalScore += result.score;
      reasons.push(...result.reasons);
    }

    return {
      valid: true,
      totalScore,
      reasons
    };
  }
}
