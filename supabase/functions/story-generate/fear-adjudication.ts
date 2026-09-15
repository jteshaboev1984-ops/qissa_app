export const fearAdjudicationCategories = [
  'none_or_mild',
  'sustained_panic',
  'threatening_pursuit',
  'abandonment_or_separation',
  'trapping',
  'serious_injury',
  'frightening_danger',
  'comparable_age_inappropriate_distress',
] as const

export type FearAdjudicationCategory = typeof fearAdjudicationCategories[number]

export type FearAdjudication = {
  excessive_fear: boolean
  category: FearAdjudicationCategory
  evidence: string
}

const severeFearCategories = new Set<FearAdjudicationCategory>([
  'sustained_panic',
  'threatening_pursuit',
  'abandonment_or_separation',
  'trapping',
  'serious_injury',
  'frightening_danger',
  'comparable_age_inappropriate_distress',
])

export const fearAdjudicationOutputSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['excessive_fear', 'category', 'evidence'],
  properties: {
    excessive_fear: { type: 'boolean' },
    category: { type: 'string', enum: [...fearAdjudicationCategories] },
    evidence: { type: 'string', maxLength: 160 },
  },
}

export const fearAdjudicationConsistencyErrors = (
  adjudication: FearAdjudication,
  childVisibleText: string,
): string[] => {
  const errors: string[] = []
  const severeCategory = severeFearCategories.has(adjudication.category)
  const evidence = adjudication.evidence.trim()

  if (adjudication.excessive_fear !== severeCategory) errors.push('fear_category_boolean_mismatch')

  if (severeCategory) {
    if (!evidence) errors.push('fear_evidence_missing')
    else if (!childVisibleText.includes(evidence)) errors.push('fear_evidence_not_in_story')
  } else if (evidence) {
    errors.push('nonsevere_fear_must_not_invent_evidence')
  }

  return errors
}
