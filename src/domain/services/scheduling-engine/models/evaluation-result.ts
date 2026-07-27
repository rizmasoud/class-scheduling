export interface EvaluationResult {
  readonly valid: boolean;
  readonly totalScore: number;
  readonly reasons: readonly string[];
  readonly failedRule?: string;
}
