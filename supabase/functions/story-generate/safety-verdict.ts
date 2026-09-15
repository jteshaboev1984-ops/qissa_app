import type { SafetyEvaluation } from './contracts.ts'

const hasAnyFlag = (evaluation: SafetyEvaluation): boolean =>
  Object.values(evaluation.flags).some((value) => value === true)

export const safetyEvaluationConsistencyErrors = (evaluation: SafetyEvaluation): string[] => {
  const errors: string[] = []
  const flagged = hasAnyFlag(evaluation)

  if (!flagged) {
    if (evaluation.approved !== true) errors.push('unflagged_verdict_not_approved')
    if (evaluation.risk_level !== 'low') errors.push('unflagged_verdict_not_low_risk')
    if (evaluation.required_action !== 'publish') errors.push('unflagged_verdict_not_publish')
  } else {
    if (evaluation.approved !== false) errors.push('flagged_verdict_approved')
    if (evaluation.required_action === 'publish') errors.push('flagged_verdict_publish')
  }

  return errors
}

export const isSafetyEvaluationConsistent = (evaluation: SafetyEvaluation): boolean =>
  safetyEvaluationConsistencyErrors(evaluation).length === 0
