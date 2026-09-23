import type {
  AuthoredStoryChoice,
  AuthoredStoryNarrativeBlock,
  AuthoredStoryPackage,
  AuthoredStoryPart,
  AuthoredStoryPhase,
  AuthoredStoryProgress,
} from './types'

const nowIso = () => new Date().toISOString()

const paragraphsOf = (text: string): string[] =>
  text
    .split(/\n\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

const currentPartFrom = (
  story: AuthoredStoryPackage,
  progress: AuthoredStoryProgress,
): AuthoredStoryPart => {
  const part = story.parts[progress.current_part_index]
  if (!part) throw new Error('Authored story progress points outside the story.')
  return part
}

export const createInitialAuthoredStoryProgress = (
  story: AuthoredStoryPackage,
): AuthoredStoryProgress => ({
  story_id: story.story_id,
  story_version: story.story_version,
  current_part_index: 0,
  selected_choices: {},
  shown_resolution_decisions: [],
  choice_history: [],
  memory: {
    lastEvent: '',
    canonState: {},
    relationshipState: {},
  },
  completed: false,
  updated_at: nowIso(),
})

export const getCurrentAuthoredStoryPart = currentPartFrom

export const getSelectedChoiceForPart = (
  part: AuthoredStoryPart,
  progress: AuthoredStoryProgress,
): AuthoredStoryChoice | null => {
  if (!part.decision) return null
  const choiceId = progress.selected_choices[part.decision.decision_id]
  if (!choiceId) return null
  return part.decision.choices.find((choice) => choice.choice_id === choiceId) ?? null
}

export const isCurrentResolutionShown = (
  part: AuthoredStoryPart,
  progress: AuthoredStoryProgress,
): boolean =>
  Boolean(
    part.decision &&
      progress.shown_resolution_decisions.includes(part.decision.decision_id),
  )

export const selectAuthoredStoryChoice = (
  story: AuthoredStoryPackage,
  progress: AuthoredStoryProgress,
  choiceId: string,
  selectedAt = nowIso(),
): AuthoredStoryProgress => {
  if (progress.completed) return progress
  const part = currentPartFrom(story, progress)
  const decision = part.decision
  if (!decision) throw new Error('Current authored story part has no decision.')

  const existing = progress.selected_choices[decision.decision_id]
  if (existing) {
    if (existing === choiceId) return progress
    throw new Error('The authored story choice is already locked.')
  }

  const choice = decision.choices.find((candidate) => candidate.choice_id === choiceId)
  if (!choice) throw new Error('Choice does not belong to the current authored story decision.')

  const nextCanon = {
    ...progress.memory.canonState,
    ...(choice.state_patch.canon_updates ?? {}),
    ...decision.merge_state,
  }

  const nextRelationships = {
    ...progress.memory.relationshipState,
    ...(choice.state_patch.relationship_updates ?? {}),
  }

  return {
    ...progress,
    selected_choices: {
      ...progress.selected_choices,
      [decision.decision_id]: choice.choice_id,
    },
    choice_history: [
      ...progress.choice_history,
      {
        decision_id: decision.decision_id,
        part_id: part.part_id,
        choice_id: choice.choice_id,
        choice_text: choice.text,
        effect_summary: choice.effect_summary,
        selected_at: selectedAt,
      },
    ],
    memory: {
      lastEvent: choice.state_patch.last_event?.trim() || choice.effect_summary,
      canonState: nextCanon,
      relationshipState: nextRelationships,
    },
    updated_at: selectedAt,
  }
}

export const markAuthoredStoryResolutionShown = (
  story: AuthoredStoryPackage,
  progress: AuthoredStoryProgress,
): AuthoredStoryProgress => {
  if (progress.completed) return progress
  const part = currentPartFrom(story, progress)
  const decision = part.decision
  if (!decision) return progress

  if (!progress.selected_choices[decision.decision_id]) {
    throw new Error('Cannot show a resolution before a choice is selected.')
  }

  if (progress.shown_resolution_decisions.includes(decision.decision_id)) return progress

  return {
    ...progress,
    shown_resolution_decisions: [
      ...progress.shown_resolution_decisions,
      decision.decision_id,
    ],
    updated_at: nowIso(),
  }
}

export const canAdvanceAuthoredStory = (
  story: AuthoredStoryPackage,
  progress: AuthoredStoryProgress,
): boolean => {
  if (progress.completed) return false
  const part = currentPartFrom(story, progress)
  if (!part.decision) return true

  const choiceId = progress.selected_choices[part.decision.decision_id]
  const resolutionShown = progress.shown_resolution_decisions.includes(
    part.decision.decision_id,
  )
  return Boolean(choiceId && resolutionShown)
}

export const advanceAuthoredStory = (
  story: AuthoredStoryPackage,
  progress: AuthoredStoryProgress,
): AuthoredStoryProgress => {
  if (!canAdvanceAuthoredStory(story, progress)) {
    throw new Error('Current authored story part is not ready to advance.')
  }

  const part = currentPartFrom(story, progress)
  if (part.is_final || progress.current_part_index >= story.parts.length - 1) {
    return {
      ...progress,
      completed: true,
      updated_at: nowIso(),
    }
  }

  return {
    ...progress,
    current_part_index: progress.current_part_index + 1,
    updated_at: nowIso(),
  }
}

export const buildAuthoredNarrativeBlocks = (
  part: AuthoredStoryPart,
  phase: AuthoredStoryPhase,
): AuthoredStoryNarrativeBlock[] => {
  const text = phase === 'story_text' ? part.story_text : part.post_choice_text
  const paragraphs = paragraphsOf(text)
  const slots = part.image_slots.filter((slot) => slot.phase === phase)
  const byAnchor = new Map(slots.map((slot) => [slot.after_text, slot]))

  const blocks: AuthoredStoryNarrativeBlock[] = []
  for (const paragraph of paragraphs) {
    blocks.push({ kind: 'text', text: paragraph })
    const slot = byAnchor.get(paragraph)
    if (slot) blocks.push({ kind: 'image', slot })
  }
  return blocks
}

export const validateAuthoredStoryPackage = (
  story: AuthoredStoryPackage,
): string[] => {
  const errors: string[] = []

  if (!story.story_id.trim()) errors.push('story_id is required')
  if (!story.story_version.trim()) errors.push('story_version is required')
  if (story.parts.length === 0) errors.push('at least one story part is required')

  const partIds = new Set<string>()
  const decisionIds = new Set<string>()
  const choiceIds = new Set<string>()
  const assetIds = new Set<string>()

  if (!story.cover_illustration.asset_id.trim()) {
    errors.push('cover asset_id is required')
  } else {
    assetIds.add(story.cover_illustration.asset_id)
  }

  story.parts.forEach((part, index) => {
    if (part.order !== index + 1) {
      errors.push(`${part.part_id}: order must be ${index + 1}`)
    }
    if (partIds.has(part.part_id)) errors.push(`duplicate part_id: ${part.part_id}`)
    partIds.add(part.part_id)

    const paragraphsByPhase: Record<AuthoredStoryPhase, string[]> = {
      story_text: paragraphsOf(part.story_text),
      post_choice_text: paragraphsOf(part.post_choice_text),
    }

    for (const slot of part.image_slots) {
      if (assetIds.has(slot.asset_id)) errors.push(`duplicate asset_id: ${slot.asset_id}`)
      assetIds.add(slot.asset_id)

      const count = paragraphsByPhase[slot.phase].filter(
        (paragraph) => paragraph === slot.after_text,
      ).length
      if (count !== 1) {
        errors.push(
          `${slot.slot_id}: expected exactly one anchor paragraph in ${slot.phase}, got ${count}`,
        )
      }
    }

    if (part.decision) {
      if (decisionIds.has(part.decision.decision_id)) {
        errors.push(`duplicate decision_id: ${part.decision.decision_id}`)
      }
      decisionIds.add(part.decision.decision_id)

      if (part.decision.choices.length !== 2) {
        errors.push(`${part.decision.decision_id}: exactly two choices are required`)
      }

      for (const choice of part.decision.choices) {
        if (choiceIds.has(choice.choice_id)) errors.push(`duplicate choice_id: ${choice.choice_id}`)
        choiceIds.add(choice.choice_id)

        if (!choice.resolution_text.trim()) {
          errors.push(`${choice.choice_id}: resolution_text is required`)
        }

        if (assetIds.has(choice.illustration.asset_id)) {
          errors.push(`duplicate asset_id: ${choice.illustration.asset_id}`)
        }
        assetIds.add(choice.illustration.asset_id)
      }
    }
  })

  const finalParts = story.parts.filter((part) => part.is_final)
  if (finalParts.length !== 1 || finalParts[0] !== story.parts.at(-1)) {
    errors.push('exactly the final part must have is_final=true')
  }

  if (story.illustration_plan.planned_asset_count !== assetIds.size) {
    errors.push(
      `illustration_plan.planned_asset_count=${story.illustration_plan.planned_asset_count} but found ${assetIds.size} assets`,
    )
  }

  return errors
}
