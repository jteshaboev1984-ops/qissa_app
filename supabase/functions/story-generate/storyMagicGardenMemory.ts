import type { CandidatePatch, NormalizedStoryContext } from './contracts.ts'

type MagicLanguage = 'ru' | 'uz'
type BranchId = 'choice-a' | 'choice-b'

type ChoiceMemory = {
  effectSummary: string
  resolutionText: string
  tomorrowSeed: string
  statePatch: CandidatePatch
}

const magicLanguage = (context: NormalizedStoryContext): MagicLanguage | null => {
  if (context.stylePackId !== 'magic_garden') return null
  if (context.ageGroup !== '5-7' || context.storyMood !== 'bedtime') return null
  return context.language === 'ru' || context.language === 'uz' ? context.language : null
}

const text = {
  'choice-a': {
    ru: {
      effect: 'У лунных цветов появились голубые капли, которые показали дорогу к тихой беседке.',
      resolution: '{{HERO}} полил землю у корней, и лунные цветы раскрылись один за другим. Вода не шумела, а будто передавала по цветнику маленькую добрую весть. На лепестковой дорожке появились голубые капли, и друзья поняли: сказка продолжится по этому следу.',
      seed: 'Голубые капли останутся на дорожке и приведут друзей к семечку спокойного сна.',
      artifact: 'голубые капли на лепестковой дорожке',
      friend: 'улитка Мирай',
    },
    uz: {
      effect: 'Oy gullarida ko‘k tomchilar paydo bo‘lib, sokin ayvon tomon yo‘l ko‘rsatdi.',
      resolution: '{{HERO}} suvni gullarning ildizi yoniga quydi, oy gullari esa birin-ketin ochila boshladi. Suv shovqin qilmadi, go‘yo gulzor bo‘ylab kichik mehrli xabar uzatdi. Gulbargli yo‘lakda ko‘k tomchilar paydo bo‘ldi, do‘stlar esa hikoya shu izdan davom etishini tushundi.',
      seed: 'Ko‘k tomchilar yo‘lakda qoladi va do‘stlarni sokin uyqu urug‘i tomon boshlab boradi.',
      artifact: 'gulbargli yo‘lakdagi ko‘k tomchilar',
      friend: 'shilliqqurt Miroy',
    },
  },
  'choice-b': {
    ru: {
      effect: 'Светлячки превратили потерянный узор в тихую вечернюю карту.',
      resolution: '{{HERO}} поставил чашу рядом с лунными цветами, и светлячки поднялись над дорожкой мягкой цепочкой. Цветы повернулись к свету, лепестки вспомнили свой узор, а Лило услышала в мерцании первые ноты тихой садовой песни.',
      seed: 'Светлая цепочка останется у фонтана и приведёт друзей к колыбельной светлячков.',
      artifact: 'светлая цепочка у фонтана',
      friend: 'птица Лило',
    },
    uz: {
      effect: 'Yorug‘qo‘ng‘izlar yo‘qolgan naqshni sokin kechki xaritaga aylantirdi.',
      resolution: '{{HERO}} kosani oy gullari yoniga qo‘ydi, yorug‘qo‘ng‘izlar esa yo‘lak ustida mayin zanjir bo‘lib ko‘tarildi. Gullar nur tomonga burildi, gulbarglar o‘z naqshini esladi, Lilo esa miltillash ichidan bog‘ning sokin allasidagi birinchi notalarni eshitdi.',
      seed: 'Yorug‘ zanjir favvora yonida qoladi va do‘stlarni yorug‘qo‘ng‘izlar allasi tomon boshlab boradi.',
      artifact: 'favvora yonidagi yorug‘ zanjir',
      friend: 'Lilo qushi',
    },
  },
} as const

const patch = (
  choiceId: BranchId,
  language: MagicLanguage,
): CandidatePatch => ({
  last_event: choiceId,
  new_friend: text[choiceId][language].friend,
  hero_trait: 'calm_and_caring',
  open_arc: `continue-magic_garden-${choiceId}`,
  relationship_updates: [{
    key: choiceId === 'choice-a' ? 'snail_miroy' : 'bird_lilo',
    value: 'trust_started_through_gentle_help',
  }],
  canon_updates: [
    { key: 'last_choice', value: choiceId },
    { key: 'remembered_artifact', value: text[choiceId][language].artifact },
  ],
})

export const magicGardenChoiceMemory = (
  context: NormalizedStoryContext,
  choiceId: string,
): ChoiceMemory | null => {
  const language = magicLanguage(context)
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
