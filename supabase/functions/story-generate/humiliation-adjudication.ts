export const humiliationAdjudicationCategories = [
  'none',
  'targeted_mockery',
  'demeaning_name',
  'public_shaming',
  'belittling',
  'coercive_shame',
  'other_clear_humiliation',
] as const

export type HumiliationAdjudicationCategory = typeof humiliationAdjudicationCategories[number]

export type HumiliationAdjudication = {
  humiliation: boolean
  category: HumiliationAdjudicationCategory
  evidence: string
}

const humiliationCategories = new Set<HumiliationAdjudicationCategory>([
  'targeted_mockery',
  'demeaning_name',
  'public_shaming',
  'belittling',
  'coercive_shame',
  'other_clear_humiliation',
])

export const humiliationAdjudicationOutputSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['humiliation', 'category', 'evidence'],
  properties: {
    humiliation: { type: 'boolean' },
    category: { type: 'string', enum: [...humiliationAdjudicationCategories] },
    evidence: { type: 'string', maxLength: 160 },
  },
}

export const humiliationAdjudicationConsistencyErrors = (
  adjudication: HumiliationAdjudication,
  childVisibleText: string,
): string[] => {
  const errors: string[] = []
  const humiliationCategory = humiliationCategories.has(adjudication.category)
  const evidence = adjudication.evidence.trim()

  if (adjudication.humiliation !== humiliationCategory) errors.push('humiliation_category_boolean_mismatch')

  if (humiliationCategory) {
    if (!evidence) errors.push('humiliation_evidence_missing')
    else if (!childVisibleText.includes(evidence)) errors.push('humiliation_evidence_not_in_story')
  } else if (evidence) {
    errors.push('nonhumiliation_must_not_invent_evidence')
  }

  return errors
}
