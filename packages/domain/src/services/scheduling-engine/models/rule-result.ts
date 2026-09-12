export enum RuleSeverity {
  Critical = 'Critical',
  Warning = 'Warning',
  Information = 'Information'
}

export interface RuleResult {
  readonly valid: boolean;
  readonly score: number;
  readonly severity: RuleSeverity;
  readonly reasons: readonly string[];
}
