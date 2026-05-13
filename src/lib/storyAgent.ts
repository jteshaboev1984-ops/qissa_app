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
          {
            choice_id: 'light_path',
            text: 'Зажечь фонарики вдоль тропинки',
            effect_summary: 'Свет поможет друзьям спокойно найти дорогу.',
            resolution_text: 'Герой бережно зажёг первый фонарик. Потом второй. Потом третий. Тёплый свет лёг на траву, и тропинка стала похожа на золотую ниточку. Светлячки заметили фонарики и тоже поднялись над листьями. Маленький ёжик нашёл дорогу к своему домику, а сова Нура тихо кивнула с ветки. Лес стал спокойнее, будто сам сказал спасибо за добрый свет.',
            tomorrow_seed: 'Когда все добрались домой, один маленький фонарик остался светиться у поворота. В следующий раз герой узнает, куда ведёт его тёплый свет.',
            state_patch: { hero_trait: 'заботливость', last_event: 'герой осветил тропу', open_arc: 'Светлая тропа добрых дел' },
            value_alignment: ['care_for_nature', 'mutual_help'],
          },
          {
            choice_id: 'quiet_song',
            text: 'Спеть тихую песню лесным друзьям',
            effect_summary: 'Друзья услышат спокойный голос и пойдут рядом.',
            resolution_text: 'Герой тихо запел. Песня была такой мягкой, что даже листья перестали шуршать. Зверята услышали знакомый голос и подошли ближе. Ручей зазвенел тише, трава закачалась медленнее, а сова Нура опустилась на нижнюю ветку и стала слушать вместе со всеми. Лес не стал громче — он стал добрее.',
            tomorrow_seed: 'Перед сном сова Нура запомнила эту песню. В следующий раз она покажет герою место, где спокойный голос особенно нужен.',
            state_patch: { hero_trait: 'доброта', new_friend: 'сова Нура', open_arc: 'Лесная дружба и забота' },
            value_alignment: ['kindness', 'friendship'],
          },
        ]
      : [
          {
            choice_id: 'share_map',
            text: 'Поделиться картой с командой',
            effect_summary: 'Дорога станет понятной для всех.',
            resolution_text: 'Герой разложил карту на гладком камне, и друзья увидели не просто линии, а путь, который можно пройти вместе. Каждый выбрал маленькую задачу: кто-то смотрел за поворотами, кто-то считал шаги, кто-то запоминал знаки у дороги. Карта больше не была тайной одного героя — она стала общей историей команды.',
            tomorrow_seed: 'На краю карты появился новый мягкий знак. В следующий раз команда узнает, куда ведёт этот общий путь.',
            state_patch: { hero_trait: 'честность', last_event: 'герой помог команде с маршрутом', open_arc: 'Команда смелых помощников' },
            value_alignment: ['honesty', 'mutual_help'],
          },
          {
            choice_id: 'water_garden',
            text: 'Полить молодые деревья у тропы',
            effect_summary: 'Сад окрепнет и встретит гостей тенью.',
            resolution_text: 'Герой набрал воды в маленький кувшин и полил самые юные деревья у тропы. Сначала листья только дрогнули, потом поднялись выше, будто потянулись к добрым рукам. Тень стала мягче, воздух — прохладнее, а друзья почувствовали, что сад тоже умеет отвечать заботой.',
            tomorrow_seed: 'Утром на одном листе останется прозрачная капля. В следующий раз герой увидит, что она отражает.',
            state_patch: { hero_trait: 'бережность', last_event: 'герой поддержал сад', open_arc: 'Сад растёт вместе с героями' },
            value_alignment: ['care_for_nature', 'gratitude'],
          },
        ]
  }

  return [
    {
      choice_id: 'help_path',
      text: language === 'uz' ? 'Yo‘l bo‘ylab mayin chiroqlar yoqish' : 'Жол бойына жұмсақ шамдар жағу',
      effect_summary: language === 'uz' ? 'Yo‘l yanada tinch va qulay bo‘ladi.' : 'Жол тыныш әрі жайлы бола түседі.',
      resolution_text: language === 'uz'
        ? 'Qahramon birinchi chiroqni ehtiyotkorlik bilan yoqdi, keyin ikkinchisini, keyin uchinchisini. Mayin nur yo‘lga tushdi. Kichik do‘stlar yonma-yon xotirjam yurishdi, atrof esa iliq va sokin bo‘lib qoldi.'
        : 'Кейіпкер бірінші шамды, кейін екіншісін, содан соң үшіншісін жайлап жақты. Жұмсақ жарық жолға төгілді. Кішкентай достар қатарласа сенімді жүрді, ал айнала жылы әрі тыныш бола түсті.',
      tomorrow_seed: language === 'uz'
        ? 'Hamma uyiga yetgach, bitta chiroq burilishda yonib qoldi. Keyingi safar qahramon shu nur qayerga eltishini biladi.'
        : 'Барлығы үйлеріне жеткен соң, бір шам бұрылыста жанып қалды. Келесі жолы кейіпкер оның қайда апаратынын біледі.',
      state_patch: { hero_trait: 'kind', open_arc: 'kind path arc' },
      value_alignment: ['kindness'],
    },
    {
      choice_id: 'help_friend',
      text: language === 'uz' ? 'Do‘stlar uchun sokin qo‘shiq aytish' : 'Достарға баяу ән айтып беру',
      effect_summary: language === 'uz' ? 'Do‘stlar xotirjam bo‘lib, bir-biriga yaqinlashadi.' : 'Достар тынышталып, бір-біріне жақындай түседі.',
      resolution_text: language === 'uz'
        ? 'Qahramon sokin qo‘shiq aytdi. Qo‘shiq daraxtlar orasidan muloyim o‘tdi, do‘stlar esa bir-biriga yaqinlashdi. Yo‘l shovqinsiz, kecha esa mehrli bo‘lib qoldi.'
        : 'Кейіпкер баяу ән айтты. Ән ағаш арасымен жұмсақ тарады, достар бір-біріне жақындай түсті. Жол тынышталып, кеш мейірлене түсті.',
      tomorrow_seed: language === 'uz'
        ? 'Uyqu oldidan bir kichik qushcha shu qo‘shiqni eslab qoldi. Keyingi safar u qahramonni yangi yo‘lga chaqiradi.'
        : 'Ұйқы алдында кішкентай құс осы әнді есте сақтап қалды. Келесі жолы ол кейіпкерді жаңа жолға шақырады.',
      state_patch: { new_friend: language === 'uz' ? 'kichik qushcha' : 'кішкентай құс', open_arc: 'friendship arc' },
      value_alignment: ['friendship'],
    },
  ]
}

function createEpisodeOne(selections: OnboardingSelections, seriesState?: SeriesState): Episode {
  const stylePack = stylePacks.find((pack) => pack.id === selections.stylePackId) ?? stylePacks[0]
  const heroName = selections.heroType === 'custom' && selections.customHeroName ? selections.customHeroName : heroByType[selections.heroType][selections.language]

  return {
    episode_id: `ep-1-${selections.stylePackId}-${selections.storyMood}`,
    series_id: seriesState?.id ?? `series-${selections.stylePackId}-${selections.language}`,
    title: selections.language === 'ru' ? `Тёплый вечер в мире «${stylePack.title.ru}»` : selections.language === 'uz' ? `${stylePack.title.uz}: iliq oqshom` : `${stylePack.title.kz}: жылы кеш`,
    story_text: selections.language === 'ru'
      ? `${heroName} вошёл в мир «${stylePack.title.ru}», где воздух пах тёплым чаем и травами. Тропинка была узкой, а вечер медленно становился мягче и темнее. Друзья заметили, что маленьким зверятам трудно найти дорогу домой в сумерках. Герой остановился, прислушался к сердцу и понял: лес ждёт не спешки, а доброго решения. Можно было помочь миру двумя спокойными способами.`
      : selections.language === 'uz'
        ? `${heroName} ${stylePack.title.uz} dunyosiga kirdi. Kech kirib, yo‘l sekin sokinlashdi. Kichik do‘stlarga uyga borish qiyinlashdi. Qahramon to‘xtab, mehr bilan yordam berishning ikki tinch yo‘lini ko‘rdi.`
        : `${heroName} ${stylePack.title.kz} әлеміне келді. Кеш түсіп, жол баяу тыныштала бастады. Кішкентай достарға үйлеріне жету қиындады. Кейіпкер тоқтап, мейіріммен көмектесудің екі тыныш жолын көрді.`,
    mode: selections.storyMode,
    mood: selections.storyMood,
    stylePackId: stylePack.id,
    choices: episodeOneChoices(selections.language, selections.storyMood),
    state_patch: { last_event: selections.language === 'ru' ? 'герой остановился перед добрым выбором' : 'gentle choice moment opened', open_arc: selections.language === 'ru' ? 'Путь добрых дел в новом мире' : 'kind path arc' },
    vocabulary: vocabularyFor(selections.language),
    nextEpisodePreview: selections.language === 'ru'
      ? `История запомнит выбор ${heroName}. В следующий раз мир начнётся с этого места.`
      : selections.language === 'uz'
        ? `Hikoya tanlovni eslab qoladi. Keyingi safar olam shu joydan boshlanadi.`
        : 'Оқиға таңдауды есте сақтайды. Келесі жолы әлем осы жерден басталады.',
    safety_self_check: { approved: true, risk_level: 'low', flags: { discrimination: false, humiliation: false, religious_push: false, political_push: false, gender_stereotype: false, nationality_stereotype: false, conditional_love: false, bedtime_overstimulation: false, adult_theme: false, excessive_fear: false }, required_action: 'publish' },
  }
}

function createEpisodeTwo(selections: OnboardingSelections, seriesState: SeriesState): Episode {
  const lastChoice = seriesState.choiceHistory[seriesState.choiceHistory.length - 1]
  const friend = seriesState.recurringCharacters[seriesState.recurringCharacters.length - 1]

  const storyTextRu = lastChoice.choice_id === 'light_path'
    ? `${seriesState.mainCharacter} вернулся к тропинке на следующий вечер. Один маленький фонарик всё ещё светился у поворота, как будто ждал. Его тёплый свет показал новую дорожку между листьями. Сова Нура тихо позвала героя: там, за мягким светом, кому-то снова нужна была спокойная помощь.`
    : lastChoice.choice_id === 'quiet_song'
      ? `${seriesState.mainCharacter} вернулся в лес, и в воздухе ещё жила вчерашняя тихая песня. Сова Нура узнала мелодию и мягко взмахнула крылом. Там, где песня звучала тише всего, маленькие друзья собирались вместе и ждали доброго голоса.`
      : friend
        ? `${seriesState.mainCharacter} снова вышел на тропинку, и рядом мягко приземлилась ${friend}. Мир помнил вчерашний выбор: дорога стала спокойнее, а друзья держались ближе друг к другу.`
        : `${seriesState.mainCharacter} вернулся на знакомую тропинку. Мир помнил вчерашний выбор: вокруг стало тише и уютнее, а друзья с благодарностью продолжали путь.`

  return {
    episode_id: `ep-2-${selections.stylePackId}-${seriesState.choiceHistory.length}`,
    series_id: seriesState.id,
    title: selections.language === 'ru' ? 'Мир помнит выбор' : selections.language === 'uz' ? 'Olam tanlovni eslaydi' : 'Әлем таңдауды есте сақтайды',
    story_text: selections.language === 'ru'
      ? storyTextRu
      : selections.language === 'uz'
        ? lastChoice.choice_id === 'help_path'
          ? `${seriesState.mainCharacter} keyingi safar yo‘lga qaytdi. Burilishda bitta mayin chiroq hanuz yonib turardi. Shu nur yangi so‘qmoqni ko‘rsatdi, olam esa kechagi mehrli tanlovni eslab turgandek edi.`
          : lastChoice.choice_id === 'help_friend'
            ? `${seriesState.mainCharacter} yana o‘rmonga kirdi. Kechagi sokin qo‘shiq havoda mayin qolgan edi. Kichik qushcha uni eslab, qahramonni yangi yo‘lga chaqirdi.`
            : `${seriesState.mainCharacter} tanish yo‘ldan davom etdi. Atrof tinch va iliq edi, do‘stlar esa bir-biriga suyanib oldinga yurishdi.`
        : lastChoice.choice_id === 'help_path'
          ? `${seriesState.mainCharacter} келесі жолы жолға қайта келді. Бұрылыста бір жұмсақ шам әлі жанып тұрды. Сол жарық жаңа соқпақты көрсетті, ал әлем кешегі мейірімді таңдауды есте сақтағандай еді.`
          : lastChoice.choice_id === 'help_friend'
            ? `${seriesState.mainCharacter} орманға қайта кірді. Кешегі баяу әннің жылы лебі ауада қалған еді. Кішкентай құс оны есіне алып, кейіпкерді жаңа жолға шақырды.`
            : `${seriesState.mainCharacter} таныс соқпақпен алға жүрді. Айнала тыныш, ал достар бір-біріне сүйеніп, жолды бірге жалғастырды.`,
    mode: selections.storyMode,
    mood: selections.storyMood,
    stylePackId: selections.stylePackId,
    choices: [],
    state_patch: { last_event: lastChoice.effect_summary, open_arc: seriesState.activeArc },
    vocabulary: vocabularyFor(selections.language),
    nextEpisodePreview: selections.language === 'ru' ? 'Первая глава этой истории мягко завершилась.' : selections.language === 'uz' ? 'Bu hikoyaning birinchi bobi muloyim yakunlandi.' : 'Бұл оқиғаның алғашқы тарауы жылы аяқталды.',
    safety_self_check: { approved: true, risk_level: 'low', flags: { discrimination: false, humiliation: false, religious_push: false, political_push: false, gender_stereotype: false, nationality_stereotype: false, conditional_love: false, bedtime_overstimulation: false, adult_theme: false, excessive_fear: false }, required_action: 'publish' },
  }
}

// Prototype Story Agent contract: local-only deterministic generator.
// one_time stays self-contained; series episode 2 is the current first-chapter closure without Episode 3 promise.
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
