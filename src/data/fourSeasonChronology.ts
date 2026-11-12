import type { AuthoredStoryPackage } from '../features/authoredStory/types'

// Presentation-only temporal edit. Keep the historically approved literary packages,
// original blob hashes, story IDs/versions, illustration anchors and progress keys intact.
const patches: Record<string, Record<'ru' | 'uz', { from: string; to: string }>> = {
  seven_roads_korolevskoe_serebro: {
    ru: {
      from: 'Прошла примерно неделя после Праздника мужества.',
      to: 'На следующий день после отъезда Темура и Самиры из Араса в Сарван в другой части королевства началась история, о которой они пока ничего не знали.',
    },
    uz: {
      from: 'Jasorat bayramidan taxminan bir hafta o‘tdi.',
      to: 'Temur va Samira Arasdan Sarvanga jo‘nab ketganlarining ertasi kuni qirollikning boshqa bir joyida ular hali bilmagan voqea boshlandi.',
    },
  },
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
