// Local deterministic mock Story Agent implementation (no network/model calls).
// NOTE: Return payload shape intentionally mirrors future backend/edge function contract outputs.
import { stylePacks } from '../data/stylePacks'
import type { StoryGenerationInput, StoryGenerationOutput } from '../contracts/agentContracts'
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
      { word: 'фонарик', translation: 'flashlight', example: 'Фонарик мягко осветил тропинку.', sourceLanguage: 'ru', targetLanguage: 'en' },
      { word: 'бережно', translation: 'carefully', example: 'Герой бережно помог ростку.', sourceLanguage: 'ru', targetLanguage: 'en' },
      { word: 'дружба', translation: 'friendship', example: 'Дружба сделала путь легче.', sourceLanguage: 'ru', targetLanguage: 'en' },
    ]
  }

  return []
}

function episodeOneChoices(language: Language, mood: OnboardingSelections['storyMood']): EpisodeChoice[] {
  if (language === 'ru') {
    return mood === 'bedtime'
      ? [
          { choice_id: 'light_path', text: 'Зажечь фонарики вдоль тропинки', effect_summary: 'Путь станет уютнее для всех.', resolution_text: 'Фонарики мягко засияли вдоль тропинки. Маленьким зверятам стало спокойнее идти рядом.', state_patch: { hero_trait: 'заботливость', last_event: 'герой осветил тропу', open_arc: 'Светлая тропа добрых дел' }, value_alignment: ['care_for_nature', 'mutual_help'] },
          { choice_id: 'quiet_song', text: 'Спеть тихую песню лесным друзьям', effect_summary: 'Друзья успокоятся и пойдут рядом.', resolution_text: 'Тихая песня прошла между деревьями, и лесные друзья успокоились. Вечер стал добрее.', state_patch: { hero_trait: 'доброта', new_friend: 'сова Нура', open_arc: 'Лесная дружба и забота' }, value_alignment: ['kindness', 'friendship'] },
        ]
      : [
          { choice_id: 'share_map', text: 'Поделиться картой с командой', effect_summary: 'Дорога станет понятной для всех.', state_patch: { hero_trait: 'честность', last_event: 'герой помог команде с маршрутом', open_arc: 'Команда смелых помощников' }, value_alignment: ['honesty', 'mutual_help'] },
          { choice_id: 'water_garden', text: 'Полить молодые деревья у тропы', effect_summary: 'Сад окрепнет и встретит гостей тенью.', state_patch: { hero_trait: 'бережность', last_event: 'герой поддержал сад', open_arc: 'Сад растёт вместе с героями' }, value_alignment: ['care_for_nature', 'gratitude'] },
        ]
  }

  return [
    { choice_id: 'help_path', text: language === 'uz' ? 'Yo‘l bo‘ylab mayin chiroqlar yoqish' : 'Жол бойына жұмсақ шамдар жағу', effect_summary: language === 'uz' ? 'Yo‘l yanada tinch va qulay bo‘ladi.' : 'Жол тыныш әрі жайлы бола түседі.', resolution_text: language === 'uz' ? 'Mayin chiroqlar yo‘l bo‘ylab yondi. Kichik do‘stlar yonma-yon xotirjam yurishdi.' : 'Жұмсақ шамдар жол бойына жарқырай жанды. Кішкентай достар қатарласа сенімді жүрді.', state_patch: { hero_trait: 'kind', open_arc: 'kind path arc' }, value_alignment: ['kindness'] },
    { choice_id: 'help_friend', text: language === 'uz' ? 'Do‘stlar uchun sokin qo‘shiq aytish' : 'Достарға баяу ән айтып беру', effect_summary: language === 'uz' ? 'Do‘stlar xotirjam bo‘lib, bir-biriga yaqinlashadi.' : 'Достар тынышталып, бір-біріне жақындай түседі.', resolution_text: language === 'uz' ? 'Sokin qo‘shiq daraxtlar orasidan mayin taraldi. Do‘stlar bir-biriga yaqinroq bo‘lib, kecha iliqlashdi.' : 'Баяу ән ағаш арасымен жұмсақ тарады. Достар бір-біріне жақындап, кеш мейірлене түсті.', state_patch: { new_friend: 'friend', open_arc: 'friendship arc' }, value_alignment: ['friendship'] },
  ]
}

function createEpisodeOne(selections: OnboardingSelections, seriesState?: SeriesState): Episode {
  const stylePack = stylePacks.find((pack) => pack.id === selections.stylePackId) ?? stylePacks[0]
  const heroName = selections.heroType === 'custom' && selections.customHeroName ? selections.customHeroName : heroByType[selections.heroType][selections.language]

  return {
    episode_id: `ep-1-${selections.stylePackId}-${selections.storyMood}`,
    series_id: seriesState?.id ?? `series-${selections.stylePackId}-${selections.language}`,
    title: selections.language === 'ru' ? `Тёплый вечер в мире «${stylePack.title.ru}»` : selections.language === 'uz' ? `${stylePack.title.uz}: birinchi hikoya` : `${stylePack.title.kz}: алғашқы оқиға`,
    story_text: selections.language === 'ru'
      ? `${heroName} вошёл в мир «${stylePack.title.ru}», где воздух пах тёплым чаем и травами. На узкой тропинке друзья заметили, что маленьким зверятам трудно пройти в сумерках. Герой остановился, прислушался к сердцу и решил сделать вечер добрее.`
      : selections.language === 'uz'
        ? `${heroName} ${stylePack.title.uz} dunyosiga kirdi. Kechqurun yo‘lda do‘stlarga yordam kerak bo‘ldi. Qahramon mehr bilan yo‘lni tinch va qulay qildi.`
        : `${heroName} ${stylePack.title.kz} әлеміне келді. Кешкі жолда достарға көмек керек болды. Кейіпкер мейіріммен жолды тыныш әрі жайлы етті.`,
    mode: selections.storyMode,
    mood: selections.storyMood,
    stylePackId: stylePack.id,
    choices: episodeOneChoices(selections.language, selections.storyMood),
    state_patch: { last_event: selections.language === 'ru' ? 'герой сделал добрый выбор в первом эпизоде' : 'first gentle choice made', open_arc: selections.language === 'ru' ? 'Путь добрых дел в новом мире' : 'kind path arc' },
    vocabulary: vocabularyFor(selections.language),
    nextEpisodePreview: selections.storyMode === 'series'
      ? selections.language === 'ru'
        ? `В следующей серии ${heroName} увидит, как выбор изменил историю.`
        : selections.language === 'uz'
          ? `Keyingi qismda bugungi tanlovning ta’siri ko‘rinadi.`
          : 'Келесі бөлімде бүгінгі таңдаудың әсері көрінеді.'
      : selections.language === 'ru'
        ? 'Это отдельная история с тёплым завершением.'
        : selections.language === 'uz'
          ? 'Bu alohida ertak iliq yakun bilan tugaydi.'
          : 'Бұл жеке ертегі жылы аяқталады.',
    safety_self_check: { approved: true, risk_level: 'low', flags: { discrimination: false, humiliation: false, religious_push: false, political_push: false, gender_stereotype: false, nationality_stereotype: false, conditional_love: false, bedtime_overstimulation: false, adult_theme: false, excessive_fear: false }, required_action: 'publish' },
  }
}

function createEpisodeTwo(selections: OnboardingSelections, seriesState: SeriesState): Episode {
  const lastChoice = seriesState.choiceHistory[seriesState.choiceHistory.length - 1]
  const friend = seriesState.recurringCharacters[seriesState.recurringCharacters.length - 1]

  const storyTextRu = lastChoice.choice_id === 'light_path'
    ? `${seriesState.mainCharacter} снова вышел на тропинку, и знакомые фонарики мягко осветили путь. Рядом шли маленькие зверята, им было спокойно и тепло, а друзья бережно поддерживали тех, кто устал.`
    : lastChoice.choice_id === 'quiet_song'
      ? `${seriesState.mainCharacter} шагнул в утренний лес, и в воздухе ещё звучала тихая добрая мелодия. Лесные друзья улыбнулись, пошли ближе друг к другу и вместе помогли самым маленьким не отставать.`
      : friend
        ? `${seriesState.mainCharacter} снова вышел на тропинку, и рядом мягко приземлилась ${friend}. Дорога была спокойной, друзья держались вместе и заботливо помогали тем, кому нужен был отдых.`
        : `${seriesState.mainCharacter} вернулся на знакомую тропинку. В мире стало тише и уютнее: друзья шагали рядом, поддерживали друг друга и с благодарностью продолжали путь.`

  return {
    episode_id: `ep-2-${selections.stylePackId}-${seriesState.choiceHistory.length}`,
    series_id: seriesState.id,
    title: selections.language === 'ru' ? 'Продолжение: мир помнит выбор' : selections.language === 'uz' ? 'Davomi: dunyo tanlovni eslaydi' : 'Жалғасы: әлем таңдауды ұмытпады',
    story_text: selections.language === 'ru'
      ? storyTextRu
      : selections.language === 'uz'
        ? lastChoice.choice_id === 'help_path'
          ? `${seriesState.mainCharacter} yana yo‘lga chiqdi, mayin chiroqlar esa so‘qmoqni nurga to‘ldirdi. Kichik do‘stlar xotirjam yurib, bir-birini qo‘llab borishdi.`
          : lastChoice.choice_id === 'help_friend'
            ? `${seriesState.mainCharacter} o‘rmonga kirganda sokin qo‘shiq kayfiyati hanuz sezilib turardi. Do‘stlar yaqinlashib, birga yurib, ortda qolganlarga mehr bilan yordam berishdi.`
            : `${seriesState.mainCharacter} tanish yo‘ldan davom etdi. Atrof tinch va iliq edi, do‘stlar esa bir-biriga suyanib oldinga yurishdi.`
        : lastChoice.choice_id === 'help_path'
          ? `${seriesState.mainCharacter} жолға қайта шыққанда, жұмсақ шамдар соқпақты жарық қылды. Кішкентай достар сенімді жүріп, бір-біріне демеу болды.`
          : lastChoice.choice_id === 'help_friend'
            ? `${seriesState.mainCharacter} орманға кіргенде баяу әннің жылы лебі сезілді. Достар жақындай түсіп, бірге жүріп, артта қалғандарға қамқор болды.`
            : `${seriesState.mainCharacter} таныс соқпақпен алға жүрді. Айнала тыныш, ал достар бір-біріне сүйеніп, жолды бірге жалғастырды.`,
    mode: selections.storyMode,
    mood: selections.storyMood,
    stylePackId: selections.stylePackId,
    choices: [],
    state_patch: { last_event: lastChoice.effect_summary, open_arc: seriesState.activeArc },
    vocabulary: vocabularyFor(selections.language),
    nextEpisodePreview: selections.language === 'ru' ? 'Демо второй серии завершено.' : selections.language === 'uz' ? 'Ikkinchi demo qism shu yerda yakunlanadi.' : 'Екінші демо бөлім осы жерде аяқталады.',
    safety_self_check: { approved: true, risk_level: 'low', flags: { discrimination: false, humiliation: false, religious_push: false, political_push: false, gender_stereotype: false, nationality_stereotype: false, conditional_love: false, bedtime_overstimulation: false, adult_theme: false, excessive_fear: false }, required_action: 'publish' },
  }
}

// Prototype Story Agent contract: local-only deterministic generator.
// one_time stays self-contained; series episode 2 is a demo end-state without episode 3 promise.
export function createStoryEpisode(input: StoryGenerationInput): Episode {
  const { selections, seriesState } = input
  const hasHistory = Boolean(seriesState && seriesState.choiceHistory.length > 0)
  const draftEpisode = hasHistory ? createEpisodeTwo(selections, seriesState as SeriesState) : createEpisodeOne(selections, seriesState)
  const safety = runEpisodeSafetyCheck(draftEpisode)

  if (safety.approved) {
    const output: StoryGenerationOutput = { episode: { ...draftEpisode, safety_self_check: safety } }
    return output.episode
  }

  return {
    ...draftEpisode,
    title: selections.language === 'ru'
      ? 'Тихий добрый вечер'
      : selections.language === 'uz'
        ? 'Sokin mehrli oqshom'
        : 'Тыныш мейірімді кеш',
    story_text: selections.language === 'ru'
      ? 'Герои выбрали спокойный путь, помогли друг другу и завершили день с улыбкой.'
      : selections.language === 'uz'
        ? 'Qahramonlar sokin yo‘lni tanlab, bir-biriga yordam berdi va kunni iliq kayfiyatda yakunladi.'
        : 'Кейіпкерлер тыныш жолды таңдап, бір-біріне көмектесіп, күнді жылы көңілмен аяқтады.',
    safety_self_check: { approved: true, risk_level: 'low', flags: { discrimination: false, humiliation: false, religious_push: false, political_push: false, gender_stereotype: false, nationality_stereotype: false, conditional_love: false, bedtime_overstimulation: false, adult_theme: false, excessive_fear: false }, required_action: 'publish' },
  }
}
