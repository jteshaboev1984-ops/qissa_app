import { stylePacks } from '../data/stylePacks'
import type { Episode, EpisodeChoice, Language, OnboardingSelections, SeriesState, VocabularyItem } from '../types/qissa'
import { runEpisodeSafetyCheck } from './safetyAgent'

const heroByType: Record<OnboardingSelections['heroType'], Record<Language, string>> = {
  girl_hero: { ru: 'девочка Алия', uz: 'qizaloq Aliya', kz: 'Алия есімді қыз' },
  boy_hero: { ru: 'мальчик Тимур', uz: 'o‘g‘il bola Timur', kz: 'Тимур есімді ұл' },
  animal: { ru: 'маленький снежный барс', uz: 'kichik qor barsi', kz: 'кішкентай қар барысы' },
  magical_hero: { ru: 'добрый звёздный проводник', uz: 'mehribon yulduz yo‘lboshchi', kz: 'мейірімді жұлдыз жетекші' },
  custom: { ru: 'юный герой', uz: 'kichik qahramon', kz: 'жас кейіпкер' },
}

function vocabularyFor(language: Language): VocabularyItem[] {
  if (language === 'ru') {
    return [
      {
        word: 'фонарик',
        translation: 'flashlight',
        example: 'Фонарик мягко осветил тропинку.',
        sourceLanguage: 'ru',
        targetLanguage: 'en',
      },
      {
        word: 'бережно',
        translation: 'carefully',
        example: 'Герой бережно помог ростку.',
        sourceLanguage: 'ru',
        targetLanguage: 'en',
      },
      {
        word: 'дружба',
        translation: 'friendship',
        example: 'Дружба сделала путь легче.',
        sourceLanguage: 'ru',
        targetLanguage: 'en',
      },
    ]
  }

  return []
}

function buildChoices(language: Language, mood: OnboardingSelections['storyMood']): EpisodeChoice[] {
  if (language === 'ru') {
    return mood === 'bedtime'
      ? [
          { choice_id: 'light_path', text: 'Зажечь фонарики вдоль тропинки', effect_summary: 'Путь станет уютнее для всех.', state_patch: { hero_trait: 'заботливость', last_event: 'герой осветил тропу' }, value_alignment: ['care_for_nature', 'mutual_help'] },
          { choice_id: 'quiet_song', text: 'Спеть тихую песню лесным друзьям', effect_summary: 'Друзья успокоятся и пойдут рядом.', state_patch: { hero_trait: 'доброта', new_friend: 'сова Нура' }, value_alignment: ['kindness', 'friendship'] },
        ]
      : [
          { choice_id: 'share_map', text: 'Поделиться картой с командой', effect_summary: 'Дорога станет понятной для всех.', state_patch: { hero_trait: 'честность', last_event: 'герой помог команде с маршрутом' }, value_alignment: ['honesty', 'mutual_help'] },
          { choice_id: 'water_garden', text: 'Полить молодые деревья у тропы', effect_summary: 'Сад окрепнет и встретит гостей тенью.', state_patch: { hero_trait: 'бережность', last_event: 'герой поддержал сад' }, value_alignment: ['care_for_nature', 'gratitude'] },
        ]
  }

  return [
    { choice_id: 'help_path', text: language === 'uz' ? 'Yo‘lni hamma uchun chiroyli qilish' : 'Жолды бәріне жайлы ету', effect_summary: language === 'uz' ? 'Barchaga qulay bo‘ladi.' : 'Баршаға ыңғайлы болады.', state_patch: { hero_trait: 'kind' }, value_alignment: ['kindness'] },
    { choice_id: 'help_friend', text: language === 'uz' ? 'Do‘st bilan birga yurish' : 'Доспен бірге жүру', effect_summary: language === 'uz' ? 'Do‘stlik mustahkamlanadi.' : 'Достық нығаяды.', state_patch: { new_friend: 'friend' }, value_alignment: ['friendship'] },
  ]
}

export function createStoryEpisode(selections: OnboardingSelections, seriesState?: SeriesState): Episode {
  const stylePack = stylePacks.find((pack) => pack.id === selections.stylePackId) ?? stylePacks[0]
  const heroName = selections.heroType === 'custom' && selections.customHeroName
    ? selections.customHeroName
    : heroByType[selections.heroType][selections.language]

  const episodeBase: Episode = {
    episode_id: `ep-1-${selections.stylePackId}-${selections.storyMood}`,
    series_id: seriesState?.id ?? `series-${selections.stylePackId}-${selections.language}`,
    title: selections.language === 'ru'
      ? `Тёплый вечер в мире «${stylePack.title.ru}»`
      : selections.language === 'uz' ? `${stylePack.title.uz}: birinchi hikoya` : `${stylePack.title.kz}: алғашқы оқиға`,
    story_text: selections.language === 'ru'
      ? `${heroName} вошёл в мир «${stylePack.title.ru}», где воздух пах тёплым чаем и травами. На узкой тропинке друзья заметили, что маленьким зверятам трудно пройти в сумерках. Герой остановился, прислушался к сердцу и решил сделать вечер добрее. Пока над деревьями зажигались первые звёзды, каждый шаг напоминал: спокойствие, забота и дружба помогают находить путь.`
      : selections.language === 'uz'
        ? `${heroName} ${stylePack.title.uz} dunyosiga kirdi. Kechqurun yo‘lda do‘stlarga yordam kerak bo‘ldi. Qahramon mehr bilan yo‘lni tinch va qulay qildi.`
        : `${heroName} ${stylePack.title.kz} әлеміне келді. Кешкі жолда достарға көмек керек болды. Кейіпкер мейіріммен жолды тыныш әрі жайлы етті.`,
    mode: selections.storyMode,
    mood: selections.storyMood,
    stylePackId: stylePack.id,
    choices: buildChoices(selections.language, selections.storyMood),
    state_patch: {
      last_event: selections.language === 'ru' ? 'герой сделал добрый выбор в первом эпизоде' : 'first gentle choice made',
      open_arc: selections.language === 'ru' ? 'Путь добрых дел в новом мире' : 'kind path arc',
    },
    vocabulary: vocabularyFor(selections.language),
    nextEpisodePreview: selections.language === 'ru'
      ? `В следующей серии ${heroName} узнает, как его сегодняшний выбор изменил настроение всего маршрута.`
      : selections.language === 'uz'
        ? `Keyingi qismda bugungi tanlovning ta’siri ko‘rinadi.`
        : 'Келесі бөлімде бүгінгі таңдаудың әсері көрінеді.',
    safety_self_check: {
      approved: true,
      risk_level: 'low',
      flags: { discrimination: false, humiliation: false, religious_push: false, political_push: false, gender_stereotype: false, nationality_stereotype: false, conditional_love: false, bedtime_overstimulation: false, adult_theme: false, excessive_fear: false },
      required_action: 'publish',
    },
  }

  const safety = runEpisodeSafetyCheck(episodeBase)
  if (safety.approved) {
    return { ...episodeBase, safety_self_check: safety }
  }

  return {
    ...episodeBase,
    title: selections.language === 'ru' ? 'Тихий добрый вечер' : episodeBase.title,
    story_text: selections.language === 'ru'
      ? `${heroName} встретил друзей у тёплого фонаря. Вместе они выбрали спокойный путь, помогли друг другу и завершили вечер с улыбкой.`
      : selections.language === 'uz'
        ? `${heroName} do‘stlari bilan tinch yo‘l tanladi va kecha iliq kayfiyatda yakunlandi.`
        : `${heroName} достарымен тыныш жолды таңдап, кешті жылы көңілмен аяқтады.`,
    safety_self_check: {
      approved: true,
      risk_level: 'low',
      flags: {
        discrimination: false,
        humiliation: false,
        religious_push: false,
        political_push: false,
        gender_stereotype: false,
        nationality_stereotype: false,
        conditional_love: false,
        bedtime_overstimulation: false,
        adult_theme: false,
        excessive_fear: false,
      },
      required_action: 'publish',
    },
  }
}
