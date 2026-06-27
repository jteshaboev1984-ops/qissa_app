import type { CandidatePatch, Language, NormalizedStoryContext } from './contracts.ts'

type GenericChoiceMemory = {
  effectSummary: string
  resolutionText: string
  tomorrowSeed: string
  statePatch: CandidatePatch
}

type GenericContinuationMemory = {
  storyText: string
  statePatch: CandidatePatch
}

const choiceCopy = (language: Language, choiceText: string) => {
  if (language === 'ru') {
    return {
      effectSummary: `После решения «${choiceText}» в сказочном мире появился новый добрый знак.`,
      resolutionText: `{{HERO}} выбрал путь «${choiceText}». Друзья вместе довели дело до конца, а рядом остался маленький знак этого вечера.`,
      tomorrowSeed: `К утру знак от выбора «${choiceText}» всё ещё будет на месте и подскажет героям, куда отправиться дальше.`,
    }
  }
  if (language === 'uz') {
    return {
      effectSummary: `«${choiceText}» yo‘lidan so‘ng ertak olamida yangi mehribon belgi paydo bo‘ldi.`,
      resolutionText: `{{HERO}} «${choiceText}» yo‘lini tanladi. Do‘stlar ishni birga tugatdi, oqshomdan esa kichik bir belgi qoldi.`,
      tomorrowSeed: `Tongda «${choiceText}» yo‘lidan qolgan belgi hali ham joyida bo‘ladi va qahramonlarga keyingi yo‘lni ko‘rsatadi.`,
    }
  }
  return {
    effectSummary: `«${choiceText}» жолынан кейін ертегі әлемінде жаңа мейірімді белгі пайда болды.`,
    resolutionText: `{{HERO}} «${choiceText}» жолын таңдады. Достар істі бірге аяқтап, кештен кішкентай белгі қалды.`,
    tomorrowSeed: `Таңертең «${choiceText}» жолынан қалған белгі орнында болып, кейіпкерлерге келесі жолды көрсетеді.`,
  }
}

const choicePatch = (
  context: NormalizedStoryContext,
  choiceId: string,
  choiceText: string,
  continuation: boolean,
): CandidatePatch => ({
  last_event: continuation ? `continued_${choiceId}` : choiceId,
  new_friend: null,
  hero_trait: 'kind_and_attentive',
  open_arc: continuation ? null : `continue-${context.stylePackId}-${choiceId}`,
  relationship_updates: [{
    key: 'friends',
    value: continuation ? 'shared_memory_strengthened_friendship' : 'shared_task_started_friendship',
  }],
  canon_updates: [
    { key: continuation ? 'remembered_choice' : 'last_choice', value: choiceId },
    { key: 'remembered_artifact', value: choiceText },
  ],
})

export const genericEditorialChoiceMemory = (
  context: NormalizedStoryContext,
  choiceId: string,
  choiceText: string,
): GenericChoiceMemory => ({
  ...choiceCopy(context.language, choiceText),
  statePatch: choicePatch(context, choiceId, choiceText, false),
})

export const genericEditorialContinuationMemory = (
  context: NormalizedStoryContext,
): GenericContinuationMemory => {
  const latestChoice = context.choiceHistory[context.choiceHistory.length - 1]
  const choiceId = latestChoice?.choice_id || 'continued_saved_path'
  const choiceText = latestChoice?.choice_text || ''
  const remembered = latestChoice?.tomorrow_seed || latestChoice?.effect_summary || ''

  const storyText = context.language === 'ru'
    ? `${remembered ? `${remembered} ` : ''}Утром {{HERO}} первым заметил знакомый знак. Он привёл друзей к незавершённому делу, и вместе они спокойно довели его до конца. Когда всё было готово, знак остался частью их общей истории.`
    : context.language === 'uz'
      ? `${remembered ? `${remembered} ` : ''}Tongda tanish belgini birinchi bo‘lib {{HERO}} ko‘rdi. U do‘stlarni tugallanmagan ishga boshlab bordi, ular esa uni birga xotirjam yakunladi. Belgi ularning umumiy hikoyasida qoldi.`
      : `${remembered ? `${remembered} ` : ''}Таңертең таныс белгіні бірінші болып {{HERO}} көрді. Ол достарды аяқталмаған іске бастап барды, олар оны бірге тыныш аяқтады. Белгі олардың ортақ ертегісінде қалды.`

  return {
    storyText: storyText.trim(),
    statePatch: choicePatch(context, choiceId, choiceText, true),
  }
}
