import {
  isRecord,
  positiveValues,
  type CandidateChoice,
  type CandidatePatch,
  type CandidateVocabulary,
  type NormalizedStoryContext,
  type PositiveValue,
  type StoryCandidate,
} from './contracts.ts'
import { hasSingleLanguageMismatch } from './language.ts'
import { branchingPreviewNeedsRewrite, choiceMenuScaffoldingNeedsRewrite, genericHeroAliasNeedsRewrite, russianHeroTokenNeedsRewrite, scanRuleBasedSafetyValues, technicalPreviewLanguageNeedsRewrite, textRepeatsStructuredChoiceMenu, uzbekYoungChildValuesNeedRewrite, visibleSafetyLanguageNeedsRewrite } from './safety.ts'

export type StoryBlueprintChoice = {
  choice_id: string
  text: string
  effect_summary: string
  resolution_goal: string
  tomorrow_seed: string
  choice_icon: string
  state_patch: CandidatePatch
  value_alignment: PositiveValue[]
}

export type StoryBlueprint = {
  plan_version: 'split-v1'
  central_goal: string
  setting_anchor: string
  continuity_callbacks: string[]
  beats: string[]
  decision_point: string
  choices: StoryBlueprintChoice[]
  state_patch: CandidatePatch
  next_episode_preview: string
}

export type StoryNarration = {
  title: string
  story_text: string
  choice_resolutions: Array<{
    choice_id: string
    resolution_text: string
  }>
  vocabulary: CandidateVocabulary[]
}

const positiveValueEnum = [
  'respect_for_elders',
  'kindness',
  'care_for_nature',
  'care_for_animals',
  'friendship',
  'honesty',
  'gratitude',
  'curiosity',
  'mutual_help',
  'calm_conflict_resolution',
  'human_dignity',
] as const

const recordEntrySchema = {
  type: 'object',
  additionalProperties: false,
  required: ['key', 'value'],
  properties: {
    key: { type: 'string' },
    value: { type: 'string' },
  },
} as const

const patchSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['last_event', 'new_friend', 'hero_trait', 'open_arc', 'relationship_updates', 'canon_updates'],
  properties: {
    last_event: { type: 'string' },
    new_friend: { type: ['string', 'null'] },
    hero_trait: { type: ['string', 'null'] },
    open_arc: { type: ['string', 'null'] },
    relationship_updates: { type: 'array', items: recordEntrySchema },
    canon_updates: { type: 'array', items: recordEntrySchema },
  },
} as const

export const storyBlueprintSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'plan_version',
    'central_goal',
    'setting_anchor',
    'continuity_callbacks',
    'beats',
    'decision_point',
    'choices',
    'state_patch',
    'next_episode_preview',
  ],
  properties: {
    plan_version: { type: 'string', enum: ['split-v1'] },
    central_goal: { type: 'string' },
    setting_anchor: { type: 'string' },
    continuity_callbacks: { type: 'array', items: { type: 'string' } },
    beats: { type: 'array', items: { type: 'string' } },
    decision_point: { type: 'string' },
    choices: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'choice_id',
          'text',
          'effect_summary',
          'resolution_goal',
          'tomorrow_seed',
          'choice_icon',
          'state_patch',
          'value_alignment',
        ],
        properties: {
          choice_id: { type: 'string' },
          text: { type: 'string' },
          effect_summary: { type: 'string' },
          resolution_goal: { type: 'string' },
          tomorrow_seed: { type: 'string' },
          choice_icon: { type: 'string' },
          state_patch: patchSchema,
          value_alignment: { type: 'array', items: { type: 'string', enum: positiveValueEnum } },
        },
      },
    },
    state_patch: patchSchema,
    next_episode_preview: { type: 'string' },
  },
} as const

export const storyNarrationSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'story_text', 'choice_resolutions', 'vocabulary'],
  properties: {
    title: { type: 'string' },
    story_text: { type: 'string' },
    choice_resolutions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['choice_id', 'resolution_text'],
        properties: {
          choice_id: { type: 'string' },
          resolution_text: { type: 'string' },
        },
      },
    },
    vocabulary: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['word', 'translation', 'example'],
        properties: {
          word: { type: 'string' },
          translation: { type: 'string' },
          example: { type: 'string' },
        },
      },
    },
  },
} as const

const languageNames: Record<NormalizedStoryContext['language'], string> = {
  ru: 'Russian',
  uz: 'Uzbek',
  kz: 'Kazakh',
}

const newFriendPatchValueIsValid = (value: unknown): boolean => {
  if (value === null) return true
  if (typeof value !== 'string') return false
  const normalized = value.trim()
  if (!normalized || normalized.length > 48) return false
  if (/[;,/|]/u.test(normalized)) return false
  return !/\s(?:va|and|и|және)\s/iu.test(normalized)
}

const patchIsValid = (patch: unknown): patch is CandidatePatch =>
  isRecord(patch) &&
  typeof patch.last_event === 'string' &&
  newFriendPatchValueIsValid(patch.new_friend) &&
  (patch.hero_trait === null || typeof patch.hero_trait === 'string') &&
  (patch.open_arc === null || typeof patch.open_arc === 'string') &&
  Array.isArray(patch.relationship_updates) &&
  patch.relationship_updates.every((entry) => isRecord(entry) && typeof entry.key === 'string' && typeof entry.value === 'string') &&
  Array.isArray(patch.canon_updates) &&
  patch.canon_updates.every((entry) => isRecord(entry) && typeof entry.key === 'string' && typeof entry.value === 'string')

const duplicateEntryKeys = (entries: CandidatePatch['canon_updates']): boolean => {
  const keys = entries.map((entry) => entry.key.trim().toLocaleLowerCase()).filter(Boolean)
  return new Set(keys).size !== keys.length
}

const textContainsHeroToken = (value: string): boolean => value.includes('{{HERO}}') || value.includes('QISSA_HERO')

const patchNaturalLanguageValues = (patch: unknown): string[] => {
  if (!isRecord(patch)) return []
  const values: string[] = []
  for (const field of ['last_event', 'new_friend', 'hero_trait', 'open_arc'] as const) {
    if (typeof patch[field] === 'string') values.push(patch[field] as string)
  }
  for (const field of ['relationship_updates', 'canon_updates'] as const) {
    const entries = patch[field]
    if (!Array.isArray(entries)) continue
    for (const entry of entries) {
      if (isRecord(entry) && typeof entry.value === 'string') values.push(entry.value)
    }
  }
  return values
}

const blueprintChildVisibleValues = (blueprint: StoryBlueprint): string[] => [
  blueprint.decision_point,
  blueprint.next_episode_preview,
  ...blueprint.choices.flatMap((choice) => [choice.text, choice.effect_summary, choice.tomorrow_seed]),
].filter((item): item is string => typeof item === 'string' && item.trim().length > 0)

const blueprintNaturalLanguageValues = (blueprint: StoryBlueprint): string[] => {
  const values: string[] = []
  for (const field of ['central_goal', 'setting_anchor', 'decision_point', 'next_episode_preview'] as const) {
    if (typeof blueprint[field] === 'string') values.push(blueprint[field])
  }
  if (Array.isArray(blueprint.continuity_callbacks)) values.push(...blueprint.continuity_callbacks.filter((item): item is string => typeof item === 'string'))
  if (Array.isArray(blueprint.beats)) values.push(...blueprint.beats.filter((item): item is string => typeof item === 'string'))
  values.push(...patchNaturalLanguageValues(blueprint.state_patch))
  if (Array.isArray(blueprint.choices)) {
    for (const choice of blueprint.choices) {
      if (!isRecord(choice)) continue
      for (const field of ['text', 'effect_summary', 'resolution_goal', 'tomorrow_seed'] as const) {
        if (typeof choice[field] === 'string') values.push(choice[field] as string)
      }
      values.push(...patchNaturalLanguageValues(choice.state_patch))
    }
  }
  return values
}

const stableMemoryKey = /^[a-z][a-z0-9_.-]{0,47}$/u

const memoryKeyHash = (value: string): string => {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36)
}

const canonicalNewMemoryKey = (rawKey: string, prefix: 'canon' | 'rel'): string => {
  const lowered = rawKey.trim().toLocaleLowerCase('en-US')
  if (stableMemoryKey.test(lowered)) return lowered

  const asciiSlug = lowered
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/gu, '')
    .replace(/[^a-z0-9]+/gu, '_')
    .replace(/^_+|_+$/gu, '')
  const prefixed = asciiSlug && /^[a-z]/u.test(asciiSlug) ? asciiSlug : `${prefix}_${asciiSlug}`.replace(/_+$/u, '')
  const candidate = prefixed || prefix
  if (asciiSlug && stableMemoryKey.test(candidate)) return candidate

  const suffix = memoryKeyHash(lowered || rawKey)
  const stem = candidate.replace(/[^a-z0-9_.-]/gu, '').slice(0, Math.max(1, 47 - suffix.length - 1)) || prefix
  const withHash = `${/^[a-z]/u.test(stem) ? stem : `${prefix}_${stem}`}_${suffix}`.slice(0, 48)
  return stableMemoryKey.test(withHash) ? withHash : `${prefix}_${suffix}`.slice(0, 48)
}

type MemoryUpdateEntry = { key: string; value: string }

const canonicalizeMemoryEntries = (
  entries: MemoryUpdateEntry[],
  existingKeys: Set<string>,
  prefix: 'canon' | 'rel',
): { entries: MemoryUpdateEntry[]; normalizedCount: number } => {
  const byKey = new Map<string, MemoryUpdateEntry>()
  let normalizedCount = 0

  for (const entry of entries) {
    const key = existingKeys.has(entry.key) ? entry.key : canonicalNewMemoryKey(entry.key, prefix)
    if (key !== entry.key) normalizedCount += 1
    if (byKey.has(key)) normalizedCount += 1
    byKey.set(key, { ...entry, key })
  }

  return { entries: [...byKey.values()], normalizedCount }
}

const canonicalizePatchMemoryKeys = (
  context: NormalizedStoryContext,
  patch: CandidatePatch,
): { patch: CandidatePatch; normalizedCount: number } => {
  const existingCanon = new Set(Object.keys(context.canonState))
  const existingRelationships = new Set(Object.keys(context.relationshipState))
  const canon = canonicalizeMemoryEntries(patch.canon_updates, existingCanon, 'canon')
  const relationships = canonicalizeMemoryEntries(patch.relationship_updates, existingRelationships, 'rel')

  return {
    patch: {
      ...patch,
      canon_updates: canon.entries,
      relationship_updates: relationships.entries,
    },
    normalizedCount: canon.normalizedCount + relationships.normalizedCount,
  }
}

export const normalizeStoryBlueprintMemoryKeys = (
  context: NormalizedStoryContext,
  blueprint: StoryBlueprint,
): { blueprint: StoryBlueprint; normalizedCount: number } => {
  const topLevel = canonicalizePatchMemoryKeys(context, blueprint.state_patch)
  let normalizedCount = topLevel.normalizedCount
  const choices = blueprint.choices.map((choice) => {
    const normalized = canonicalizePatchMemoryKeys(context, choice.state_patch)
    normalizedCount += normalized.normalizedCount
    return { ...choice, state_patch: normalized.patch }
  })
  return {
    blueprint: { ...blueprint, state_patch: topLevel.patch, choices },
    normalizedCount,
  }
}

export const normalizeStoryBlueprintHeroReferences = (
  blueprint: StoryBlueprint,
): { blueprint: StoryBlueprint; normalizedCount: number } => {
  let normalizedCount = 0
  const choices = blueprint.choices.map((choice) => {
    if (textContainsHeroToken(choice.resolution_goal) || !textContainsHeroToken(choice.effect_summary)) return choice
    normalizedCount += 1
    return {
      ...choice,
      // effect_summary already owns the selected hero action. Reuse that immutable branch
      // fact to anchor a result-centered resolution_goal without inventing a new action.
      resolution_goal: `${choice.effect_summary} ${choice.resolution_goal}`.trim(),
    }
  })
  return { blueprint: { ...blueprint, choices }, normalizedCount }
}

const patchHasStableMemoryKeys = (context: NormalizedStoryContext, patch: CandidatePatch): boolean => {
  const existingCanon = new Set(Object.keys(context.canonState))
  const existingRelationships = new Set(Object.keys(context.relationshipState))
  return patch.canon_updates.every((entry) => existingCanon.has(entry.key) || stableMemoryKey.test(entry.key)) &&
    patch.relationship_updates.every((entry) => existingRelationships.has(entry.key) || stableMemoryKey.test(entry.key))
}

export const enforceStoryBlueprintContextContract = (
  context: NormalizedStoryContext,
  blueprint: StoryBlueprint,
): StoryBlueprint => context.episodeIndex === 2
  ? { ...blueprint, choices: [], decision_point: '', next_episode_preview: '' }
  : blueprint

const blueprintDecisionPointRepairErrors = new Set([
  'blueprint_choice_menu_meta_phrasing',
  'blueprint_choice_menu_repeats_cards',
])

export const repairBlueprintDecisionPoint = (
  context: Pick<NormalizedStoryContext, 'episodeIndex' | 'language'>,
  blueprint: StoryBlueprint,
  errors: string[],
): { blueprint: StoryBlueprint; repaired: boolean } => {
  if (context.episodeIndex !== 1 || errors.length === 0 || errors.some((error) => !blueprintDecisionPointRepairErrors.has(error))) {
    return { blueprint, repaired: false }
  }

  const neutralDecisionPoint: Record<NormalizedStoryContext['language'], string> = {
    ru: 'Что {{HERO}} сделает дальше?',
    uz: '{{HERO}} endi nima qiladi?',
    kz: '{{HERO}} енді не істейді?',
  }
  return {
    blueprint: { ...blueprint, decision_point: neutralDecisionPoint[context.language] },
    repaired: true,
  }
}

// Return fixed category identifiers only; never expose generated blueprint prose.
export const blueprintRuleSafetyCategories = (context: NormalizedStoryContext, blueprint: StoryBlueprint): string[] =>
  Object.entries(scanRuleBasedSafetyValues(context, blueprintNaturalLanguageValues(blueprint)))
    .filter(([, matched]) => matched)
    .map(([category]) => category)

export const validateStoryBlueprint = (context: NormalizedStoryContext, blueprint: unknown): string[] => {
  if (!isRecord(blueprint)) return ['blueprint_not_object']
  const value = blueprint as unknown as StoryBlueprint
  const errors: string[] = []

  const naturalLanguageBlueprint = blueprintNaturalLanguageValues(value)
  if (genericHeroAliasNeedsRewrite(context, naturalLanguageBlueprint)) errors.push('blueprint_generic_hero_alias_requires_rewrite')
  if (context.language === 'ru' && russianHeroTokenNeedsRewrite(naturalLanguageBlueprint.join(' '), context.heroType)) errors.push('blueprint_russian_hero_requires_rewrite')
  if (hasSingleLanguageMismatch(context.language, naturalLanguageBlueprint, context.recurringCharacters)) errors.push('blueprint_language_mismatch')
  if (blueprintRuleSafetyCategories(context, value).length > 0) errors.push('blueprint_rule_safety')
  const childVisibleBlueprint = blueprintChildVisibleValues(value)
  if (visibleSafetyLanguageNeedsRewrite(context.language, childVisibleBlueprint.join(' '))) errors.push('blueprint_visible_safety_language')
  if (uzbekYoungChildValuesNeedRewrite(context, childVisibleBlueprint)) errors.push('blueprint_uzbek_child_language_requires_rewrite')
  if (context.episodeIndex === 1 && typeof value.next_episode_preview === 'string' && technicalPreviewLanguageNeedsRewrite(context.language, value.next_episode_preview)) errors.push('blueprint_technical_preview_language')
  if (context.episodeIndex === 1 && typeof value.next_episode_preview === 'string' && branchingPreviewNeedsRewrite(context.language, value.next_episode_preview)) errors.push('blueprint_branching_preview_language')

  if (value.plan_version !== 'split-v1') errors.push('invalid_blueprint_version')
  if (typeof value.central_goal !== 'string' || value.central_goal.trim().length < 8) errors.push('invalid_central_goal')
  if (typeof value.setting_anchor !== 'string' || value.setting_anchor.trim().length < 3) errors.push('invalid_setting_anchor')
  if (!Array.isArray(value.continuity_callbacks) || value.continuity_callbacks.length > 5 || value.continuity_callbacks.some((item) => typeof item !== 'string')) {
    errors.push('invalid_continuity_callbacks')
  }
  if (!Array.isArray(value.beats) || value.beats.length < 4 || value.beats.length > 8 || value.beats.some((item) => typeof item !== 'string' || item.trim().length < 6)) {
    errors.push('invalid_blueprint_beats')
  }
  // Exact repeated internal plot steps cannot create a new causal result. Keep this deliberately
  // narrow: punctuation/case/space normalization only, no lexical overlap or prose heuristics.
  // Refrains belong in Narrator prose and are NOT checked here. No E2 regression.
  if (context.episodeIndex === 1 && Array.isArray(value.beats) && value.beats.every((beat) => typeof beat === 'string')) {
    const normalizedBeats = value.beats.map((beat) => beat.normalize('NFKC')
      .toLocaleLowerCase('en-US').replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/gu, ' ').trim())
    if (new Set(normalizedBeats).size !== normalizedBeats.length) errors.push('blueprint_duplicate_beat')
  }
  if (typeof value.decision_point !== 'string') errors.push('invalid_decision_point')
  else if (context.episodeIndex === 1) {
    if (choiceMenuScaffoldingNeedsRewrite(context.language, value.decision_point)) errors.push('blueprint_choice_menu_meta_phrasing')
    if (textRepeatsStructuredChoiceMenu(value.decision_point, value.choices)) errors.push('blueprint_choice_menu_repeats_cards')
  }
  if (!patchIsValid(value.state_patch)) errors.push('invalid_blueprint_state_patch')
  else {
    // last_event may describe a supporting-character-only event. Identity safety is enforced
    // across all blueprint natural-language values above; require {{HERO}} only when a field
    // contractually describes the protagonist rather than inventing hero participation here.
    if (typeof value.state_patch.new_friend === 'string' && (textContainsHeroToken(value.state_patch.new_friend) || genericHeroAliasNeedsRewrite(context, ['{{HERO}}', value.state_patch.new_friend]))) errors.push('blueprint_new_friend_is_hero')
    if (value.state_patch.canon_updates.length > 8) errors.push('blueprint_state_too_large')
    if (duplicateEntryKeys(value.state_patch.canon_updates)) errors.push('duplicate_blueprint_canon_keys')
    if (!patchHasStableMemoryKeys(context, value.state_patch)) errors.push('unstable_blueprint_memory_key')
  }

  const expectedChoiceCount = context.episodeIndex === 1 ? 2 : 0
  if (!Array.isArray(value.choices) || value.choices.length !== expectedChoiceCount) {
    errors.push('invalid_blueprint_choice_count')
  } else {
    const ids = new Set<string>()
    for (const choice of value.choices) {
      if (!isRecord(choice)) { errors.push('invalid_blueprint_choice'); continue }
      const typed = choice as unknown as StoryBlueprintChoice
      if (typeof typed.choice_id !== 'string' || !typed.choice_id.trim() || ids.has(typed.choice_id)) errors.push('invalid_blueprint_choice_id')
      else ids.add(typed.choice_id)
      if (typeof typed.text !== 'string' || typed.text.trim().length < 4) errors.push('invalid_blueprint_choice_text')
      if (typeof typed.effect_summary !== 'string' || typed.effect_summary.trim().length < 8) errors.push('invalid_blueprint_effect_summary')
      if (typeof typed.resolution_goal !== 'string' || typed.resolution_goal.trim().length < 5) errors.push('invalid_blueprint_resolution_goal')
      if (typeof typed.tomorrow_seed !== 'string' || typed.tomorrow_seed.length < 8) errors.push('invalid_blueprint_tomorrow_seed')
      if (typeof typed.choice_icon !== 'string' || !typed.choice_icon.trim() || typed.choice_icon.length > 8) errors.push('invalid_blueprint_choice_icon')
      if (!patchIsValid(typed.state_patch)) errors.push('invalid_blueprint_choice_patch')
      else {
        if (typed.state_patch.canon_updates.length > 4) errors.push('blueprint_choice_state_too_large')
        if (duplicateEntryKeys(typed.state_patch.canon_updates)) errors.push('duplicate_blueprint_choice_canon_keys')
        if (!patchHasStableMemoryKeys(context, typed.state_patch)) errors.push('unstable_blueprint_choice_memory_key')
      }
      if (!Array.isArray(typed.value_alignment) || typed.value_alignment.length === 0 || typed.value_alignment.some((item) => !positiveValues.has(item as PositiveValue))) {
        errors.push('invalid_blueprint_value_alignment')
      }
      if (textContainsHeroToken(typed.text)) errors.push('blueprint_choice_text_contains_hero_token')
      if (!textContainsHeroToken(typed.effect_summary)) errors.push('blueprint_choice_effect_missing_hero_token')
      if (!textContainsHeroToken(typed.resolution_goal)) errors.push('blueprint_choice_resolution_goal_missing_hero_token')
      if (patchIsValid(typed.state_patch)) {
        if (typeof typed.state_patch.new_friend === 'string' && (textContainsHeroToken(typed.state_patch.new_friend) || genericHeroAliasNeedsRewrite(context, ['{{HERO}}', typed.state_patch.new_friend]))) errors.push('blueprint_choice_new_friend_is_hero')
      }
    }
  }

  if (context.storyMode === 'series' && context.isFinalSeriesSession && context.episodeIndex === 2 && patchIsValid(value.state_patch) && value.state_patch.open_arc !== null) {
    errors.push('final_series_arc_not_closed')
  }

  if (context.episodeIndex === 1) {
    if (!value.decision_point?.trim()) errors.push('missing_blueprint_decision_point')
    if (context.storyMode === 'series') {
      if (typeof value.next_episode_preview !== 'string' || !value.next_episode_preview.trim()) errors.push('missing_blueprint_preview')
    } else if (typeof value.next_episode_preview === 'string' && value.next_episode_preview.trim()) {
      errors.push('unexpected_blueprint_preview')
    }
  } else {
    if (value.decision_point?.trim()) errors.push('continuation_blueprint_has_decision_point')
    if (value.next_episode_preview?.trim()) errors.push('continuation_blueprint_has_preview')
  }

  return [...new Set(errors)]
}

const memoryPayload = (context: NormalizedStoryContext) => ({
  canon_state: context.canonState,
  relationship_state: context.relationshipState,
  recurring_characters: context.recurringCharacters,
  active_arc: context.activeArc,
  last_episode_summary: context.lastEpisodeSummary,
  latest_confirmed_choices: context.choiceHistory.slice(-3),
})

export const buildArchitectPrompts = (context: NormalizedStoryContext) => {
  const latestChoice = context.choiceHistory[context.choiceHistory.length - 1] ?? null
  const system = [
    'You are QISSA Story Architect. Plan a children bedtime story; do not write finished prose.',
    'Return only data matching the supplied JSON schema.',
    'The architecture is the source of truth for canon, branch consequences and memory. The Narrator will be forbidden from changing these facts.',
    'The protagonist identity token is literal {{HERO}}. Whenever any non-choice-display blueprint text refers to the protagonist, use {{HERO}} rather than a generic role label. Never call the protagonist qizaloq, o\'g\'il bola, девочка, мальчик, қыз or ұл, and never create a second unnamed child using that same generic label.',
    'Use exactly one central goal, question or gentle problem. Avoid a second unrelated problem.',
    context.stylePackId === 'cozy_forest'
      ? 'For cozy_forest, make living forest characters drive the story. Prefer friendly animals, birds, insects or other clearly living forest residents with a small desire, relationship, funny misunderstanding, discovery or need for help. Streams, stones, leaves, weather and paths may support the scene, but should not become the main protagonist or a maintenance task by themselves. Avoid plots centered on clearing water, repairing a path, moving debris or fixing nature unless that action directly serves a living character goal. After setup, make most causal beats about a living character acting, speaking, reacting, joking, trying, helping or changing a relationship. Do not spend consecutive beats on the trajectory, target, positioning or repeated mechanics of one leaf, stone, path or other prop. For ages 5-7 bedtime, a warm, non-threatening mystery, playful discovery or social goal is acceptable; do not default to a shy singer and group chorus without a distinctive causal problem. Do not center the plot on finding the way home, washed-away signs, choosing a route in darkness, being lost, separation, pursuit, injury, rescue from danger, or weather damage.'
      : 'Make the central story problem emotionally legible to a child through a character desire, relationship, discovery or playful goal rather than an abstract process.',
    'Treat compact memory as authoritative. Never invent a past event that is absent from memory and never import consequences from an unselected branch.',
    'Existing recurring-character names are canonical identity labels. Preserve them exactly as supplied by memory even if the requested language changed since an earlier session. Never translate, transliterate or rename an existing recurring character. The selected language governs only names and nicknames of newly introduced supporting characters and new place labels.',
    'Prefer updating an existing canon key when a persistent fact changes. Create a new canon key only for a genuinely durable fact that may matter in later sessions.',
    'Keep state compact. Top-level state contains only durable facts true before the child choice. Choice state contains only the consequence of that specific branch.',
    'state_patch.new_friend is singular. It may contain exactly one newly introduced recurring character name or null. Never join multiple characters with commas, va, и, and, және or another list separator. If several characters appear, choose at most one character that truly needs to recur and represent other relationships through relationship_updates.',
    'Never encode speculation, moral judgment, child identity labels, sensitive personal data, punishment or permanent negative traits in state.',
    context.episodeIndex === 1
      ? 'Both choices must be safe, understandable, meaningfully different hero actions. Neither choice may be a trick or a morally bad option.'
      : 'Episode 2 has no child decision menu. Return choices as an empty array, decision_point as an empty string, and next_episode_preview as an empty string. Do not introduce a new living character, named helper or group of helpers that is absent from compact memory; continue with the already-established cast only.',
    'For Episode 1, plan 5-7 causal beats ending at one explicit decision point. Every beat before that decision must be branch-neutral: do not resolve, rehearse, start carrying out, partially carry out, or show the visible payoff of either branch before the child chooses.',
    'Each Episode 1 resolution_goal is the immediate same-evening consequence shown right after the child chooses. Do not defer that selected action or its payoff to tomorrow, morning or the next day. tomorrow_seed is reserved only as a possible hook for a future bedtime session after tonight Episode 2 is fully complete; it is never an instruction for technical Episode 2.',
    'When Episode 1 starts a later bedtime session in an existing series, use remembered canon, relationships and prior consequences as continuity callbacks, then introduce one fresh child-scale goal for tonight. Do not replay or reopen a problem that the previous bedtime session already solved.',
    'A serialized QISSA story has at most 10 bedtime sessions. Sessions 1-6 may establish or develop one gentle long-running arc while still resolving each night local goal. Sessions 7-8 must increasingly pay off existing clues and relationships and must not introduce a new major unresolved arc. Session 9 is penultimate: resolve secondary threads and position the existing central arc for its finale without adding sequel bait. Session 10 is the finale: resolve the current goal plus every meaningful unresolved thread carried in active_arc or compact canon, close the active arc, and end without a cliffhanger, future quest, mystery tease or promise of session 11.',
    'In final session Episode 2, state_patch.open_arc must be null to mark the serialized arc closed. The ending may leave the world emotionally open for imagination, but it must not leave a pending plot obligation.',
    'For Episode 2, the confirmed resolution_text in memory has ALREADY been shown to the child before this segment starts. Continue strictly from the changed state after that bridge. The first planned beat must be new: a reaction, consequence, exchange or next action caused by the bridge result. Never restage, expand, paraphrase or replay an action, object placement, joke, reaction or payoff already visible in resolution_text. Continue immediately in the same bedtime session and same evening unless the established scene itself uses another same-session time. Never jump to tomorrow, morning or the next day. The latest confirmed choice tomorrow_seed belongs to a future bedtime session and must not become an Episode 2 opening beat. Use 4-7 causal beats, solve the original story goal and end with a calm bedtime coda. Return zero choices.',
    'Keep the plan concise. It is internal production state, not child-facing prose.',
    'All natural-language blueprint values, including effect summaries, state values, arc text and preview text, must be in the requested story language. Memory keys are machine identifiers and are the only exception.',
    context.ageGroup === '5-7'
      ? 'For ages 5-7, build the plan around concrete everyday words and situations a young child can immediately picture. Avoid literary, abstract, technical, procedural or adult vocabulary when a simpler child-level word exists.'
      : 'Match concepts and vocabulary to the requested age.',
    context.language === 'uz' && context.ageGroup === '5-7'
      ? 'For Uzbek ages 5-7, prefer common natural Uzbek words, short direct phrases and child-familiar speech. Any NEW ordinary supporting-character name or nickname must use Uzbek Latin spelling, sound natural when read aloud in Uzbek children stories, and be easy for a 5-7-year-old to hear and remember. Avoid unexplained imported-sounding names. Avoid bookish, formal, bureaucratic, scientific or translation-like wording merely to sound poetic. Prefer xursand and rahmat over formal abstract wording. When equally accurate, prefer uyaldi over xijolat bo\'ldi, a direct concrete action over dadilroq or qulay payt, and shu kunni eslatdi over an abstract esdalikdek tuyuldi sentence. Avoid words such as ritm, pauza, sincap, mox, paporotnik, kapyushon, spiral, tantanali, chorraha, naqadar, minnatdorlik, mamnun, sukunat and hissa when a simple child-level phrase can say the same thing.'
      : 'Use native age-appropriate phrasing in the requested language.',
    'New canon and relationship keys must be stable lowercase ASCII semantic identifiers using letters, digits, underscore, dot or hyphen. Reuse an existing memory key exactly when updating an existing fact instead of creating a synonym.',
    context.episodeIndex === 1
      ? 'Choice display text must be in the requested story language. Do not use {{HERO}} inside choice.text; phrase that display label as an action. In effect_summary, resolution_goal, state_patch values and any other blueprint text that refers to the protagonist, use the literal {{HERO}} token and never a generic child role label.'
      : 'Do not create, describe, compare or preview any new child choice in Episode 2. The already-confirmed choice is memory, not a new decision point.',
    context.storyMode === 'series' && context.episodeIndex === 1
      ? 'next_episode_preview is child-facing story copy and must be branch-neutral: it has to remain true after either choice. Never mention confirmation, selection mechanics, an episode, segment, pipeline, story branch, or both alternatives joined by or/yoki/немесе. Write one natural in-world sentence about the same story continuing after the immediate chosen action.'
      : 'For one-time stories and Episode 2, next_episode_preview must be exactly an empty string. Do not promise another segment or repeat the selected choice.',
    'Avoid politics, religious persuasion, stereotypes, humiliation, conditional love, adult themes, graphic violence and unresolved frightening danger.',
  ].join(' ')

  const user = JSON.stringify({
    task: context.storyMode === 'one_time'
      ? 'Plan one self-contained bedtime story with one gentle decision and its two safe branch consequences.'
      : context.isFinalSeriesSession
        ? context.episodeIndex === 1
          ? 'Plan final bedtime series session 10, segment 1. Use prior canon as payoff material, begin the final child-scale goal, and offer two safe actions that both lead toward a fully closed ending in segment 2.'
          : 'Plan final bedtime series session 10, segment 2. Resolve tonight central goal and all meaningful unresolved serialized threads, close active_arc with null, and end with a calm definitive coda and no sequel hook.'
        : context.episodeIndex === 1
          ? context.hasSeriesMemory
            ? `Plan bedtime series session ${context.sessionIndex}, segment 1, using prior canon as continuity while starting one fresh story goal and two branch consequences.`
            : 'Plan bedtime series session 1, segment 1 and its two branch consequences.'
          : `Plan bedtime series session ${context.sessionIndex}, segment 2 after the confirmed choice consequence.`,
    requested_language: languageNames[context.language],
    age_group: context.ageGroup,
    hero: {
      type: context.heroType,
      identity_token: '{{HERO}}',
      note: 'Plan actions physically and socially appropriate for this hero type without inferring gender stereotypes or inventing child identity facts. Use identity_token whenever blueprint prose refers to this protagonist.',
    },
    style_pack: context.stylePackId,
    story_mode: context.storyMode,
    story_mood: context.storyMood,
    series_session_index: context.sessionIndex,
    series_session_limit: 10,
    series_sessions_remaining_after_tonight: context.seriesSessionsRemaining,
    final_series_session: context.isFinalSeriesSession,
    segment: context.episodeIndex,
    confirmed_choice_bridge: context.episodeIndex === 2 && latestChoice ? {
      choice_text: latestChoice.choice_text,
      effect_summary: latestChoice.effect_summary,
      resolution_text: latestChoice.resolution_text,
      instruction: 'This bridge already happened before segment 2. Start after its consequence; do not replay it.',
    } : null,
    memory: memoryPayload(context),
    output_contract: {
      plan_version: 'split-v1',
      top_level_canon_updates: 'normally 2-6, maximum 8',
      branch_canon_updates: 'normally 1-3, maximum 4',
      episode_1_choices: context.episodeIndex === 1 ? 2 : 0,
      choices: context.episodeIndex === 1 ? 'exactly 2' : 'exactly 0',
      decision_point: context.episodeIndex === 1 ? 'one non-empty child decision point' : 'empty string',
      next_episode_preview: context.storyMode === 'series' && context.episodeIndex === 1 ? 'one branch-neutral in-world sentence' : 'empty string',
      continuity_callbacks: '0-3 relevant remembered facts or relationships, maximum 5',
    },
  })

  return { system, user }
}

const hardStoryWordRange = (context: NormalizedStoryContext): [number, number] => {
  if (context.ageGroup === '5-7' && context.storyMode === 'series' && context.storyMood === 'bedtime') {
    return context.episodeIndex === 1 ? [320, 470] : [355, 520]
  }
  if (context.ageGroup === '3-4') return [80, 260]
  if (context.ageGroup === '5-7') return [120, 390]
  return [170, 540]
}

export const buildNarratorPrompts = (
  context: NormalizedStoryContext,
  blueprint: StoryBlueprint,
  retryReason = '',
) => {
  const latestChoice = context.choiceHistory[context.choiceHistory.length - 1] ?? null
  const [minimumWords, maximumWords] = hardStoryWordRange(context)
  const target = context.ageGroup === '5-7' && context.storyMode === 'series' && context.storyMood === 'bedtime'
    ? context.episodeIndex === 1 ? '380-420' : '430-490'
    : `${Math.min(maximumWords - 10, minimumWords + 40)}-${Math.max(minimumWords + 40, maximumWords - 20)}`
  const paragraphBudget = context.ageGroup === '5-7' && context.storyMode === 'series' && context.storyMood === 'bedtime'
    ? context.episodeIndex === 1
      ? { target_paragraphs: '8-10', average_words_per_paragraph: '40-55', final_choice_setup_words: '35-50' }
      : { target_paragraphs: '6-7', average_words_per_paragraph: '60-70', final_coda_words: '50-90' }
    : null

  const system = [
    'You are QISSA Narrator. Turn an immutable Story Architect blueprint into child-facing prose.',
    'Return only data matching the supplied JSON schema.',
    'The blueprint owns plot, choices, canon, relationships and branch consequences. Never change, replace or add a durable fact outside that blueprint.',
    'Character identity is immutable. Keep every supporting-character name exactly as written in the blueprint; never translate, transliterate or rename it while narrating.',
    'If a newly introduced supporting character has a name or nickname in the blueprint, make that identity clear at the first child-visible use. Do not suddenly switch from a species label to an unexplained nickname.',
    'You may add ephemeral sensory detail, dialogue, reactions and gentle humor only when they do not create new persistent lore.',
    'Write only in the requested language and for the requested age. Never switch languages inside dialogue, signs, inscriptions, narration, choice resolutions or examples.',
    context.ageGroup === '5-7'
      ? 'Use concrete child-level vocabulary. Prefer familiar words a 5-7-year-old can understand from context, mostly short sentences, and clear verbs. Do not choose rare literary synonyms, abstract nouns or adult-sounding wording just for beauty.'
      : 'Keep vocabulary appropriate for the requested age.',
    context.language === 'uz' && context.ageGroup === '5-7'
      ? 'Write warm natural Uzbek for a young Uzbek-speaking child in Latin script. Prefer common spoken-and-read vocabulary and simple sentence structure; avoid Russian calques, formal written Uzbek and uncommon poetic words. Do not use ritm, pauza, sincap, mox, paporotnik, kapyushon, spiral, tantanali, chorraha, naqadar, minnatdorlik, mamnun, sukunat or hissa when simpler child-level wording is available. Prefer xursand, rahmat, jim, bir oz to‘xtadi and other concrete everyday phrasing. When equally accurate, prefer uyaldi over xijolat bo‘ldi, show courage through a concrete action instead of dadilroq, and say shu kunni eslatdi instead of abstract esdalikdek tuyuldi wording.'
      : 'Write naturally in the requested language.',
    context.stylePackId === 'cozy_forest'
      ? 'Keep the forest alive without a cast quota: {{HERO}} and one active companion can carry the plot; an incidental unnamed animal should appear only when its action changes the central situation. Let characters act, react, joke or discover something consequential. Nature can be beautiful and responsive scenery, but do not make a stream, stone pile, path, leaf game mechanic or weather pattern the main child-facing subject when a living-character story can carry the same value. Do not spend consecutive paragraphs explaining how the same prop rolls, moves, is positioned, clears a route or reaches a target; move back to character interaction and feeling through visible action.'
      : 'Let characters, action and relationships carry the child-facing story.',
    'Use the literal token {{HERO}} for the hero name. Never invent a real child name.',
    'For Russian, use {{HERO}} only in grammatically invariant positions, preferably nominative subject or direct address. Never put it after a preposition and never attach gendered past-tense agreement directly to the token.',
    'For Episode 1, end story_text at the blueprint decision point before either branch happens. End with one neutral decision cue or question. Never restate, list, paraphrase, preview, rehearse, begin performing, partially perform, or show the payoff of either choice action inside story_text; the two actions and every branch-specific consequence belong only after the child chooses. Every pre-choice beat must remain true whichever choice is selected.',
    'For Episode 2, the exact confirmed_choice_bridge.resolution_text has already been displayed before this prose begins. Start strictly after its visible result. The opening paragraph must contain a genuinely new reaction, consequence, exchange or next action caused by that result. Do not copy, paraphrase, enlarge, slow down, restage, or replay any physical action, object placement, joke, reaction or payoff already shown in the bridge, even from a different camera angle. Stay in the same bedtime session; do not jump to tomorrow, morning or the next day. Treat any tomorrow_seed in memory as a deferred future-session hook, not as Episode 2 material. Resolve the same central goal and finish calmly without a cliffhanger. Episode 2 has no child decision: do not ask {{HERO}} or the child to choose, decide, pick, place, rank or answer a new question; do not make characters wait for {{HERO}} to decide; and do not leave an unresolved either-or, where/which/how choice in the prose. The characters must complete the remaining action inside the narration before the bedtime coda. Use only the already-established living cast from the immutable blueprint and memory; do not add a new animal, bird, insect, named helper, nickname, unnamed second child or plural helper group, and do not replace one established character with a generic group.',
    'If this is final series session 10, make the prose feel like a true finale: pay off remembered clues and relationships that matter, settle the active serialized arc, avoid sequel bait, and finish with emotional closure. Do not invent a new unresolved question in the final paragraphs.',
    'Follow the blueprint beat order. Every one or two short paragraphs should contain action, dialogue, discovery, reaction, attempt, humor or cause-and-effect. Use distinct causal beats; do not repeat inspection, planning, caution or agreement as separate beats when the situation has not changed.',
    'Do not turn bedtime prose into a safety checklist or adult supervision lesson. One concrete cautious action is enough when needed; then move the story forward.',
    'For ages 5-7 bedtime series, treat paragraph_budget as a quantitative drafting plan. Do not compress several blueprint beats into a few very short paragraphs; hit the requested total through meaningful beat development, not filler. For Episode 1, do not finish story_text below 340 words: develop each Architect beat with concrete action, dialogue or reaction before the final decision cue.',
    'Avoid padding, repeated clues, repeated explanation, decorative filler and unrelated events.',
    'For each Episode 1 choice, write exactly one resolution_text matching its resolution_goal and state consequence. The resolution happens immediately after the choice in the same evening; never say tomorrow, morning, next day, ertaga, ertalab, keyingi kuni, завтра, утром, ертең or таңертең in resolution_text. Aim for 30-45 words and stay below 320 characters.',
    'For Russian, return 2-3 gentle Russian-to-English vocabulary items grounded in the story. For Uzbek or Kazakh return an empty vocabulary array.',
  ].join(' ')

  const user = JSON.stringify({
    task: context.episodeIndex === 1 ? 'Narrate segment 1 from the immutable blueprint.' : 'Narrate segment 2 from the immutable blueprint.',
    requested_language: languageNames[context.language],
    age_group: context.ageGroup,
    hero: {
      type: context.heroType,
      note: 'Plan actions physically and socially appropriate for this hero type without inferring gender stereotypes or inventing child identity facts.',
    },
    style_pack: context.stylePackId,
    series_session_index: context.sessionIndex,
    final_series_session: context.isFinalSeriesSession,
    hard_story_word_range: { minimum: minimumWords, maximum: maximumWords },
    target_story_words: target,
    paragraph_budget: paragraphBudget,
    confirmed_choice_bridge: context.episodeIndex === 2 && latestChoice ? {
      choice_text: latestChoice.choice_text,
      effect_summary: latestChoice.effect_summary,
      resolution_text: latestChoice.resolution_text,
      instruction: 'Already consumed before this narration begins. Continue after it; never replay it.',
    } : null,
    counting_scope: 'Whitespace-separated words in story_text only.',
    immutable_blueprint: blueprint,
    retry_feedback: retryReason,
  })

  return { system, user }
}

export const narrationToCandidate = (
  context: NormalizedStoryContext,
  blueprint: StoryBlueprint,
  narration: StoryNarration,
): StoryCandidate => {
  if (narration.choice_resolutions.length !== blueprint.choices.length) throw new Error('narration_resolution_contract_mismatch')
  const resolutionById = new Map(narration.choice_resolutions.map((item) => [item.choice_id, item.resolution_text]))
  const expectedIds = new Set(blueprint.choices.map((choice) => choice.choice_id))
  if (resolutionById.size !== expectedIds.size || [...resolutionById.keys()].some((id) => !expectedIds.has(id))) {
    throw new Error('narration_resolution_contract_mismatch')
  }

  const choices: CandidateChoice[] = blueprint.choices.map((choice) => ({
    choice_id: choice.choice_id,
    text: choice.text,
    effect_summary: choice.effect_summary,
    resolution_text: resolutionById.get(choice.choice_id) ?? '',
    tomorrow_seed: choice.tomorrow_seed,
    choice_icon: choice.choice_icon,
    state_patch: choice.state_patch,
    value_alignment: choice.value_alignment,
  }))

  if (context.episodeIndex === 2 && narration.choice_resolutions.length !== 0) {
    throw new Error('continuation_narration_has_resolutions')
  }

  return {
    title: narration.title,
    story_text: narration.story_text,
    choices,
    state_patch: blueprint.state_patch,
    vocabulary: narration.vocabulary,
    nextEpisodePreview: blueprint.next_episode_preview,
  }
}
