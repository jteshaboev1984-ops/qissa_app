import type { CandidatePatch, NormalizedStoryContext } from './contracts.ts'

type SpaceLanguage = 'ru' | 'uz'
type BranchId = 'choice-a' | 'choice-b'

type ChoiceMemory = {
  effectSummary: string
  resolutionText: string
  tomorrowSeed: string
  statePatch: CandidatePatch
}

const spaceLanguage = (context: NormalizedStoryContext): SpaceLanguage | null => {
  if (context.stylePackId !== 'stars_and_space') return null
  if (context.ageGroup !== '5-7' || context.storyMood !== 'bedtime') return null
  return context.language === 'ru' || context.language === 'uz' ? context.language : null
}

const text = {
  'choice-a': {
    ru: {
      effect: 'Золотой маяк снова нашёл лунную почту и оставил на окне три тёплых отблеска.',
      resolution: '{{HERO}} повернул световые кольца, и над станцией поднялся мягкий золотой луч. Капсула увидела его, ответила тремя маленькими огоньками и медленно повернула к стыковочному окну.',
      seed: 'Три золотых отблеска останутся на окне и помогут продолжить путь лунной почты.',
      artifact: 'три золотых отблеска маяка',
      friend: 'робот Пико',
    },
    uz: {
      effect: 'Oltin mayoq oy pochtasini yana topdi va oynada uchta iliq shu’la qoldirdi.',
      resolution: '{{HERO}} yorug‘lik halqalarini burdi, bekat ustida mayin oltin nur ko‘tarildi. Kapsula uni ko‘rib, uchta kichik chiroq bilan javob berdi va stykovka oynasi tomon sekin burildi.',
      seed: 'Uchta oltin shu’la oynada qoladi va oy pochtasining yo‘lini davom ettirishga yordam beradi.',
      artifact: 'mayoqning uchta oltin shu’lasi',
      friend: 'robot Piko',
    },
  },
  'choice-b': {
    ru: {
      effect: 'Новая линия созвездия стала тихой картой для серебряной капсулы.',
      resolution: '{{HERO}} соединил спокойные звёзды в фигуру птицы. Серебряная капсула увидела этот рисунок и пошла за ним, обходя тёмное облако звёздной пыли.',
      seed: 'Звёздная птица останется в атласе и покажет продолжение дороги домой.',
      artifact: 'созвездие «Дорога домой»',
      friend: 'робот Пико',
    },
    uz: {
      effect: 'Yangi yulduz turkumi kumush kapsula uchun sokin xaritaga aylandi.',
      resolution: '{{HERO}} sokin yulduzlarni qush shakliga birlashtirdi. Kumush kapsula bu rasmni ko‘rib, yulduz changining qorong‘i bulutini aylanib o‘tdi.',
      seed: 'Yulduz qushi atlasda qoladi va uyga qaytish yo‘lining davomini ko‘rsatadi.',
      artifact: '«Uyga yo‘l» yulduz turkumi',
      friend: 'robot Piko',
    },
  },
} as const

const patch = (
  choiceId: BranchId,
  language: SpaceLanguage,
): CandidatePatch => ({
  last_event: choiceId,
  new_friend: text[choiceId][language].friend,
  hero_trait: 'patient_and_curious',
  open_arc: `continue-stars_and_space-${choiceId}`,
  relationship_updates: [{
    key: 'robot_piko',
    value: 'trust_started_through_shared_navigation',
  }],
  canon_updates: [
    { key: 'last_choice', value: choiceId },
    { key: 'remembered_artifact', value: text[choiceId][language].artifact },
  ],
})

export const spaceBedtimeChoiceMemory = (
  context: NormalizedStoryContext,
  choiceId: string,
): ChoiceMemory | null => {
  const language = spaceLanguage(context)
  if (!language) return null
  if (choiceId !== 'choice-a' && choiceId !== 'choice-b') return null

  const copy = text[choiceId][language]
  return {
    effectSummary: copy.effect,
    resolutionText: copy.resolution,
    tomorrowSeed: copy.seed,
    statePatch: patch(choiceId, language),
  }
}
