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

const patchIsValid = (patch: unknown): patch is CandidatePatch =>
  isRecord(patch) &&
  typeof patch.last_event === 'string' &&
  (patch.new_friend === null || typeof patch.new_friend === 'string') &&
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

export const validateStoryBlueprint = (context: NormalizedStoryContext, blueprint: unknown): string[] => {
  if (!isRecord(blueprint)) return ['blueprint_not_object']
  const value = blueprint as unknown as StoryBlueprint
  const errors: string[] = []

  if (value.plan_version !== 'split-v1') errors.push('invalid_blueprint_version')
  if (typeof value.central_goal !== 'string' || value.central_goal.trim().length < 8) errors.push('invalid_central_goal')
  if (typeof value.setting_anchor !== 'string' || value.setting_anchor.trim().length < 3) errors.push('invalid_setting_anchor')
  if (!Array.isArray(value.continuity_callbacks) || value.continuity_callbacks.length > 5 || value.continuity_callbacks.some((item) => typeof item !== 'string')) {
    errors.push('invalid_continuity_callbacks')
  }
  if (!Array.isArray(value.beats) || value.beats.length < 4 || value.beats.length > 8 || value.beats.some((item) => typeof item !== 'string' || item.trim().length < 6)) {
    errors.push('invalid_blueprint_beats')
  }
  if (typeof value.decision_point !== 'string') errors.push('invalid_decision_point')
  if (!patchIsValid(value.state_patch)) errors.push('invalid_blueprint_state_patch')
  else {
    if (value.state_patch.canon_updates.length > 8) errors.push('blueprint_state_too_large')
    if (duplicateEntryKeys(value.state_patch.canon_updates)) errors.push('duplicate_blueprint_canon_keys')
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
      if (typeof typed.effect_summary !== 'string' || typed.effect_summary.trim().length < 5) errors.push('invalid_blueprint_effect_summary')
      if (typeof typed.resolution_goal !== 'string' || typed.resolution_goal.trim().length < 5) errors.push('invalid_blueprint_resolution_goal')
      if (typeof typed.tomorrow_seed !== 'string') errors.push('invalid_blueprint_tomorrow_seed')
      if (typeof typed.choice_icon !== 'string' || typed.choice_icon.length > 8) errors.push('invalid_blueprint_choice_icon')
      if (!patchIsValid(typed.state_patch)) errors.push('invalid_blueprint_choice_patch')
      else {
        if (typed.state_patch.canon_updates.length > 4) errors.push('blueprint_choice_state_too_large')
        if (duplicateEntryKeys(typed.state_patch.canon_updates)) errors.push('duplicate_blueprint_choice_canon_keys')
      }
      if (!Array.isArray(typed.value_alignment) || typed.value_alignment.some((item) => !positiveValues.has(item as PositiveValue))) {
        errors.push('invalid_blueprint_value_alignment')
      }
      if (
        textContainsHeroToken(typed.text) ||
        textContainsHeroToken(typed.effect_summary) ||
        textContainsHeroToken(typed.resolution_goal) ||
        textContainsHeroToken(typed.tomorrow_seed)
      ) errors.push('blueprint_choice_contains_hero_token')
    }
  }

  if (context.episodeIndex === 1) {
    if (!value.decision_point?.trim()) errors.push('missing_blueprint_decision_point')
    if (typeof value.next_episode_preview !== 'string' || !value.next_episode_preview.trim()) errors.push('missing_blueprint_preview')
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
  const system = [
    'You are QISSA Story Architect. Plan a children bedtime story; do not write finished prose.',
    'Return only data matching the supplied JSON schema.',
    'The architecture is the source of truth for canon, branch consequences and memory. The Narrator will be forbidden from changing these facts.',
    'Use exactly one central goal, question or gentle problem. Avoid a second unrelated problem.',
    'Treat compact memory as authoritative. Never invent a past event that is absent from memory and never import consequences from an unselected branch.',
    'Prefer updating an existing canon key when a persistent fact changes. Create a new canon key only for a genuinely durable fact that may matter in later sessions.',
    'Keep state compact. Top-level state contains only durable facts true before the child choice. Choice state contains only the consequence of that specific branch.',
    'Never encode speculation, moral judgment, child identity labels, sensitive personal data, punishment or permanent negative traits in state.',
    'Both choices must be safe, understandable, meaningfully different hero actions. Neither choice may be a trick or a morally bad option.',
    'For Episode 1, plan 5-7 causal beats ending at one explicit decision point. Do not resolve either branch before the decision.',
    'For Episode 2, continue after the already-confirmed resolution bridge, use 4-7 causal beats, solve the original story goal and end with a calm bedtime coda. Return zero choices.',
    'Keep the plan concise. It is internal production state, not child-facing prose.',
    'Choice display text must be in the requested story language. Do not use the {{HERO}} token in architect output; phrase choices without the hero name.',
    'Avoid politics, religious persuasion, stereotypes, humiliation, conditional love, adult themes, graphic violence and unresolved frightening danger.',
  ].join(' ')

  const user = JSON.stringify({
    task: context.episodeIndex === 1 ? 'Plan bedtime session segment 1 and its two branch consequences.' : 'Plan bedtime session segment 2 after the confirmed choice consequence.',
    requested_language: languageNames[context.language],
    age_group: context.ageGroup,
    style_pack: context.stylePackId,
    story_mode: context.storyMode,
    story_mood: context.storyMood,
    segment: context.episodeIndex,
    memory: memoryPayload(context),
    output_contract: {
      plan_version: 'split-v1',
      top_level_canon_updates: 'normally 2-6, maximum 8',
      branch_canon_updates: 'normally 1-3, maximum 4',
      episode_1_choices: context.episodeIndex === 1 ? 2 : 0,
      continuity_callbacks: '0-3 relevant remembered facts or relationships, maximum 5',
    },
  })

  return { system, user }
}

const hardStoryWordRange = (context: NormalizedStoryContext): [number, number] => {
  if (context.ageGroup === '5-7' && context.storyMode === 'series' && context.storyMood === 'bedtime') {
    return context.episodeIndex === 1 ? [430, 560] : [340, 520]
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
  const [minimumWords, maximumWords] = hardStoryWordRange(context)
  const target = context.ageGroup === '5-7' && context.storyMode === 'series' && context.storyMood === 'bedtime'
    ? context.episodeIndex === 1 ? '470-520' : '390-470'
    : `${Math.min(maximumWords - 10, minimumWords + 40)}-${Math.max(minimumWords + 40, maximumWords - 20)}`

  const system = [
    'You are QISSA Narrator. Turn an immutable Story Architect blueprint into child-facing prose.',
    'Return only data matching the supplied JSON schema.',
    'The blueprint owns plot, choices, canon, relationships and branch consequences. Never change, replace or add a durable fact outside that blueprint.',
    'You may add ephemeral sensory detail, dialogue, reactions and gentle humor only when they do not create new persistent lore.',
    'Write only in the requested language and for the requested age.',
    'Use the literal token {{HERO}} for the hero name. Never invent a real child name.',
    'For Russian, use {{HERO}} only in grammatically invariant positions, preferably nominative subject or direct address. Never put it after a preposition and never attach gendered past-tense agreement directly to the token.',
    'For Episode 1, end story_text at the blueprint decision point before either branch happens. Do not print the two choices inside story_text.',
    'For Episode 2, begin after the confirmed choice resolution already happened. Do not replay that action. Resolve the same central goal and finish calmly without a cliffhanger.',
    'Follow the blueprint beat order. Every one or two short paragraphs should contain action, dialogue, discovery, reaction, attempt, humor or cause-and-effect.',
    'Avoid padding, repeated clues, repeated explanation, decorative filler and unrelated events.',
    'For each Episode 1 choice, write exactly one resolution_text matching its resolution_goal and state consequence. Aim for 30-45 words and stay below 320 characters.',
    'For Russian, return 2-3 gentle Russian-to-English vocabulary items grounded in the story. For Uzbek or Kazakh return an empty vocabulary array.',
  ].join(' ')

  const user = JSON.stringify({
    task: context.episodeIndex === 1 ? 'Narrate segment 1 from the immutable blueprint.' : 'Narrate segment 2 from the immutable blueprint.',
    requested_language: languageNames[context.language],
    age_group: context.ageGroup,
    style_pack: context.stylePackId,
    hard_story_word_range: { minimum: minimumWords, maximum: maximumWords },
    target_story_words: target,
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
