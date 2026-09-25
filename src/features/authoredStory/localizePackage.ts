import type {
  AuthoredStoryChoice,
  AuthoredStoryDecision,
  AuthoredStoryPackage,
  AuthoredStoryPart,
} from './types'

export interface AuthoredStoryLocalizedChoiceText {
  choice_id: string
  text: string
  effect_summary: string
  resolution_text: string
  last_event: string
}

export interface AuthoredStoryLocalizedDecisionText {
  decision_id: string
  prompt: string
  choices: AuthoredStoryLocalizedChoiceText[]
}

export interface AuthoredStoryLocalizedPartText {
  part_id: string
  title: string
  story_text: string
  post_choice_text: string
  image_anchor_texts: Record<string, string>
  decision: AuthoredStoryLocalizedDecisionText | null
}

export interface AuthoredStoryLocalizationOverlay {
  story_id: string
  story_version: string
  language: AuthoredStoryPackage['language']
  title: string
  parts: AuthoredStoryLocalizedPartText[]
}

const requireLocalizedPart = (
  overlay: AuthoredStoryLocalizationOverlay,
  partId: string,
): AuthoredStoryLocalizedPartText => {
  const localized = overlay.parts.find((part) => part.part_id === partId)
  if (!localized) throw new Error(`Missing localized authored story part: ${partId}`)
  return localized
}

const requireLocalizedChoice = (
  decision: AuthoredStoryLocalizedDecisionText,
  choiceId: string,
): AuthoredStoryLocalizedChoiceText => {
  const localized = decision.choices.find((choice) => choice.choice_id === choiceId)
  if (!localized) throw new Error(`Missing localized authored story choice: ${choiceId}`)
  return localized
}

const localizeChoice = (
  choice: AuthoredStoryChoice,
  decisionText: AuthoredStoryLocalizedDecisionText,
): AuthoredStoryChoice => {
  const localized = requireLocalizedChoice(decisionText, choice.choice_id)

  return {
    ...choice,
    text: localized.text,
    effect_summary: localized.effect_summary,
    resolution_text: localized.resolution_text,
    state_patch: {
      ...choice.state_patch,
      last_event: localized.last_event,
    },
  }
}

const localizeDecision = (
  decision: AuthoredStoryDecision | null,
  localized: AuthoredStoryLocalizedDecisionText | null,
): AuthoredStoryDecision | null => {
  if (!decision) {
    if (localized) throw new Error(`Unexpected localized decision: ${localized.decision_id}`)
    return null
  }

  if (!localized || localized.decision_id !== decision.decision_id) {
    throw new Error(`Missing localized authored story decision: ${decision.decision_id}`)
  }

  const choices = decision.choices.map((choice) => localizeChoice(choice, localized)) as [
    AuthoredStoryChoice,
    AuthoredStoryChoice,
  ]

  return {
    ...decision,
    prompt: localized.prompt,
    choices,
  }
}

const localizePart = (
  part: AuthoredStoryPart,
  overlay: AuthoredStoryLocalizationOverlay,
): AuthoredStoryPart => {
  const localized = requireLocalizedPart(overlay, part.part_id)

  const imageSlots = part.image_slots.map((slot) => {
    const afterText = localized.image_anchor_texts[slot.slot_id]
    if (!afterText?.trim()) {
      throw new Error(`Missing localized image anchor for ${slot.slot_id}`)
    }

    const phaseText =
      slot.phase === 'story_text' ? localized.story_text : localized.post_choice_text
    const occurrences = phaseText
      .split(/\n\n+/)
      .map((paragraph) => paragraph.trim())
      .filter((paragraph) => paragraph === afterText.trim()).length

    if (occurrences !== 1) {
      throw new Error(
        `${slot.slot_id}: localized image anchor must occur exactly once, got ${occurrences}`,
      )
    }

    return {
      ...slot,
      after_text: afterText,
    }
  })

  return {
    ...part,
    title: localized.title,
    story_text: localized.story_text,
    post_choice_text: localized.post_choice_text,
    image_slots: imageSlots,
    decision: localizeDecision(part.decision, localized.decision),
  }
}

export const localizeAuthoredStoryPackage = (
  base: AuthoredStoryPackage,
  overlay: AuthoredStoryLocalizationOverlay,
): AuthoredStoryPackage => {
  if (overlay.story_id !== base.story_id) {
    throw new Error(`Localization story_id mismatch: ${overlay.story_id}`)
  }
  if (overlay.story_version !== base.story_version) {
    throw new Error(`Localization story_version mismatch: ${overlay.story_version}`)
  }
  if (overlay.parts.length !== base.parts.length) {
    throw new Error(
      `Localization part count mismatch: expected ${base.parts.length}, got ${overlay.parts.length}`,
    )
  }

  const localized = {
    ...base,
    language: overlay.language,
    title: overlay.title,
    parts: base.parts.map((part) => localizePart(part, overlay)),
  }

  return localized
}
