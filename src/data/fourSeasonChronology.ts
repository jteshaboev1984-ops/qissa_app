import type { AuthoredStoryPackage } from '../features/authoredStory/types'

// The original Royal Silver opening ("about one week after the Festival")
// remains unchanged. Only Two Towers needs a presentation-time timing clarification
// after the Eastern Caravan. Preserve approved literary packages, original blob
// hashes, story IDs/versions, illustration anchors and progress keys.
const patches: Record<string, Record<'ru' | 'uz', { from: string; to: string }>> = {
  seven_roads_dve_bashni: {
    ru: {
      from: 'К вечеру дорога поднялась на последний невысокий холм.',
      to: 'На третий день после отъезда из Араса дорога к вечеру поднялась на последний невысокий холм.',
    },
    uz: {
      from: 'Kechga yaqin yo‘l oxirgi past tepalikka ko‘tarildi.',
      to: 'Arasdan jo‘nab ketganlarining uchinchi kuni, kechga yaqin yo‘l oxirgi past tepalikka ko‘tarildi.',
    },
  },
}

export const applyFourSeasonChronology = (story: AuthoredStoryPackage): AuthoredStoryPackage => {
  if (story.language !== 'ru' && story.language !== 'uz') return story
  const patch = patches[story.story_id]?.[story.language]
  if (!patch) return story

  const first = story.parts[0]
  if (!first || first.story_text.split(patch.from).length !== 2) {
    throw new Error(`Four-season chronology anchor mismatch: ${story.story_id}/${story.language}`)
  }
  if (first.image_slots.some((slot) => slot.after_text === patch.from)) {
    throw new Error(`Four-season chronology would disrupt an illustration: ${story.story_id}`)
  }
  return {
    ...story,
    parts: [{ ...first, story_text: first.story_text.replace(patch.from, patch.to) }, ...story.parts.slice(1)],
  }
}
