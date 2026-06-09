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

function polishStoryText(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return trimmed

  const capitalized = trimmed.charAt(0).toLocaleUpperCase() + trimmed.slice(1)
  return /[.!?…]$/.test(capitalized) ? capitalized : `${capitalized}.`
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


type WorldTemplate = {
  intro: Record<Language, string>
  choiceA: Record<Language, { text: string; effect: string; resolution: string; seed: string; icon: string; friend?: string }>
  choiceB: Record<Language, { text: string; effect: string; resolution: string; seed: string; icon: string; friend?: string }>
  episodeTwo: Record<Language, { a: string; b: string; fallback: string }>
}

const worldTemplates: Record<OnboardingSelections['stylePackId'], WorldTemplate> = {
  cozy_forest: { intro: { ru: 'Вечером в лесу мерцали фонарики, шуршали листья и мягко светились светлячки.', uz: 'Kechqurun o‘rmonda chiroqlar miltilladi, barglar shivirladi.', kz: 'Кешке орманда шамдар жылтырап, жапырақтар сыбдырлады.' }, choiceA: { ru: { text: 'Зажечь фонарики вдоль лесной тропинки', effect: 'Тропинка станет понятной и спокойной для маленьких друзей.', resolution: 'Герой зажёг фонарики вдоль тропинки. Тёплый свет лёг на листья, и маленькие зверята спокойнее нашли путь к тёплому пеньку. Сова тихо кивнула с ветки, а светлячки мягко закружились рядом.', seed: 'У старого пенька остался один огонёк. В следующий раз он подскажет новое доброе место в лесу.', icon: '🏮', friend: 'сова Нура' }, uz: { text: 'O‘rmon yo‘liga mayin chiroqlar yoqish', effect: 'Kichik do‘stlar yo‘lni xotirjam topadi.', resolution: 'Qahramon yo‘l bo‘ylab chiroqlar yoqdi. Barglar ustiga iliq nur tushdi va kichik do‘stlar xotirjam yetib olishdi.', seed: 'Eski dumaloq to‘nkada bitta mayin chiroq qoldi. Keyingi safar u yangi yo‘lni ko‘rsatadi.', icon: '🏮' }, kz: { text: 'Орман соқпағына жұмсақ шамдар жағу', effect: 'Кішкентай достар жолды сенімді табады.', resolution: 'Кейіпкер соқпақ бойына шам жақты. Жапырақтарға жылы жарық түсіп, кішкентай достар жайлы жетті.', seed: 'Ескі томар қасында бір шам жанып қалды. Келесі жолы ол жаңа ізді көрсетеді.', icon: '🏮' } }, choiceB: { ru: { text: 'Спеть тихую песню лесным друзьям', effect: 'Спокойная песня соберёт друзей рядом.', resolution: 'Герой тихо запел, и лес стал спокойнее. Светлячки зависли над тропой, маленький ёжик подошёл ближе, а сова слушала с нижней ветки. Вечер стал особенно тёплым.', seed: 'Сова запомнила мелодию. В следующий раз она позовёт героя туда, где песня снова поможет.', icon: '🎵', friend: 'ёжик Топа' }, uz: { text: 'O‘rmon do‘stlariga sokin qo‘shiq aytish', effect: 'Mayin qo‘shiq do‘stlarni birlashtiradi.', resolution: 'Qahramon sokin qo‘shiq aytdi va o‘rmon tinchidi. Do‘stlar yaqinlashib, birga yo‘lni davom ettirishdi.', seed: 'Kichik boyqush kuyini eslab qoldi. Keyingi safar u qahramonni yangi joyga chorlaydi.', icon: '🎵' }, kz: { text: 'Орман достарына баяу ән айту', effect: 'Жұмсақ әуен достарды жақындатады.', resolution: 'Кейіпкер баяу ән айтты да, орман тынышталды. Достар жақындап, жолды бірге жалғастырды.', seed: 'Кішкентай үкі әуенді есте сақтады. Келесі жолы ол кейіпкерді жаңа орынға шақырады.', icon: '🎵' } }, episodeTwo: { ru: { a: 'Утром лесная тропинка ещё мягко светилась: фонарики всё ещё тихо светили.', b: 'Утром в лесу тихо звучала знакомая мелодия: вчерашняя песня всё ещё согревала друзей.', fallback: 'Утром лес встретил героя тёпло: у вчерашнего выбора остался тёплый след.' }, uz: { a: 'Ertalab o‘rmon yo‘li hali ham mayin yoritilgan edi: kechagi iz hali sezilib turardi.', b: 'Ertalab o‘rmonda tanish qo‘shiq mayin yangradi: kechagi iz hali sezilib turardi.', fallback: 'Ertalab o‘rmon qahramonni iliq kutib oldi: tanlovdan mayin iz qoldi.' }, kz: { a: 'Таңертең орман соқпағы әлі де жұмсақ жарықтанып тұрды: кешегі із әлі сезіліп тұрды.', b: 'Таңертең орманда таныс әуен жай естілді: кешегі із әлі сезіліп тұрды.', fallback: 'Таңертең орман кейіпкерді жылы қарсы алды: таңдаудан жылы із қалды.' } } },
  magic_garden: undefined as any,
  silk_road: undefined as any,
  stars_and_space: undefined as any,
  animal_world: undefined as any,
  sea_islands: undefined as any,
  castle_mystery: undefined as any,
  brave_adventure: undefined as any,
}

type SimpleWorldId = Exclude<OnboardingSelections['stylePackId'], 'cozy_forest'>
type SimpleWorldTuple = [string, string, string, string, string]

const simpleWorlds: SimpleWorldId[] = ['magic_garden','silk_road','stars_and_space','animal_world','sea_islands','castle_mystery','brave_adventure']

const simpleWorldRuTemplates: Record<SimpleWorldId, SimpleWorldTuple> = {
  magic_garden: ['в саду шелестели лепестки и светились цветы','Полить лунный цветник','Поставить светлячковую чашу','🌸','🫧'],
  silk_road: ['у караванной стоянки горели мягкие лампы','Зажечь караванный фонарь','Развернуть карту узоров','🏺','🗺️'],
  stars_and_space: ['над станцией плыли тихие звёзды','Настроить звёздный маяк','Сложить новую созвездную линию','⭐','🌙'],
  animal_world: ['на лугу слышались спокойные голоса животных','Наполнить поилку у поляны','Собрать мягкие листья для гнезда','🐾','🍃'],
  sea_islands: ['на тёплом берегу шептали тихие волны у маленького маяка','Зажечь маленький береговой фонарик','Положить светящуюся ракушку у воды','🐚','🌊'],
  castle_mystery: ['во дворе замка мягко звенели флажки и фонари','Зажечь лампу у галереи','Оставить добрую записку в зале','🏰','🕯️'],
  brave_adventure: ['на тропе приключений ветер шевелил ленточки-указатели','Поставить дорожный фонарь у поворота','Спеть бодрую походную песенку','🧭','🎶'],
}

for (const id of simpleWorlds) {
  if (worldTemplates[id]) continue
  // lightweight safe world-specific templates
  const [intro, a, b, ia, ib] = simpleWorldRuTemplates[id]
  worldTemplates[id]={
    intro:{ru:intro,uz:intro,kz:intro},
    choiceA:{ru:{text:a,effect:'Мир станет спокойнее и удобнее для всех.',resolution:`Герой выбрал путь «${a.toLowerCase()}». В мире стало мягче и спокойнее, а друзья сразу заметили добрую перемену.`,seed:'Небольшой знак остался до утра. В следующий раз он мягко подскажет продолжение истории.',icon:ia},uz:{text:a,effect:'Olam tinchroq va qulayroq bo‘ladi.',resolution:`Qahramon «${a}» yo‘lini tanladi. Olam iliqroq bo‘lib, do‘stlar buni darhol sezishdi.`,seed:'Tonggacha kichik belgi qoldi. Keyingi safar u hikoyani muloyim davom ettiradi.',icon:ia},kz:{text:a,effect:'Әлем жайлырақ әрі тыныш бола түседі.',resolution:`Кейіпкер «${a}» жолын таңдады. Әлем жұмсарып, достар жақсы өзгерісті бірден байқады.`,seed:'Таңға дейін кішкентай белгі қалды. Келесі жолы ол оқиғаны жаймен жалғастырады.',icon:ia}},
    choiceB:{ru:{text:b,effect:'Друзья объединятся и поддержат друг друга.',resolution:`Герой выбрал путь «${b.toLowerCase()}». Мир ответил спокойствием: стало уютнее, а рядом появилось больше взаимной поддержки.`,seed:'К утру остался мягкий след выбора. В следующий раз герой увидит его продолжение.',icon:ib},uz:{text:b,effect:'Do‘stlar bir-birini qo‘llab-quvvatlaydi.',resolution:`Qahramon «${b}» yo‘lini tanladi. Olam tinch javob berdi va atrof yanada iliq bo‘ldi.`,seed:'Tongda tanlovdan mayin iz qoladi. Keyingi safar qahramon davomni ko‘radi.',icon:ib},kz:{text:b,effect:'Достар бір-бірін қолдай түседі.',resolution:`Кейіпкер «${b}» жолын таңдады. Әлем тыныш жауап беріп, айнала бұрынғыдан жылырақ болды.`,seed:'Таңертең таңдаудан жұмсақ із қалады. Келесі жолы кейіпкер жалғасын көреді.',icon:ib}},
    episodeTwo:{ru:{a:`Утром ${intro}. На тропинке остался вчерашний мягкий знак.`,b:`Утром ${intro}. У выбранного пути остался мягкий утренний след.`,fallback:`Утром ${intro}. У выбора героя остался мягкий след.`},uz:{a:`Ertalab ${intro}. Kecha tanlangan yo‘ldan mayin iz qoldi.`,b:`Ertalab ${intro}. Ikkinchi yo‘ldan tonggacha mayin iz qoldi.`,fallback:`Ertalab ${intro}. Qahramon tanlovidan mayin iz qoldi.`},kz:{a:`Таңертең ${intro}. Кешегі жолдан жұмсақ із қалды.`,b:`Таңертең ${intro}. Екінші жолдан таңға дейін жұмсақ із қалды.`,fallback:`Таңертең ${intro}. Кейіпкер таңдауынан жұмсақ із қалды.`}}
  }
}

function episodeOneChoices(selections: OnboardingSelections): EpisodeChoice[] {
  const tpl = worldTemplates[selections.stylePackId]
  const a = tpl.choiceA[selections.language]
  const b = tpl.choiceB[selections.language]
  return [
    { choice_id: 'path_a', text: a.text, effect_summary: a.effect, resolution_text: a.resolution, tomorrow_seed: a.seed, choice_icon: a.icon, state_patch: { hero_trait: selections.language === 'ru' ? 'заботливость' : 'kind', new_friend: a.friend, open_arc: 'world path a' }, value_alignment: ['kindness', 'mutual_help'] },
    { choice_id: 'path_b', text: b.text, effect_summary: b.effect, resolution_text: b.resolution, tomorrow_seed: b.seed, choice_icon: b.icon, state_patch: { hero_trait: selections.language === 'ru' ? 'доброта' : 'kind', new_friend: b.friend, open_arc: 'world path b' }, value_alignment: ['friendship', 'care_for_nature'] },
  ]
}
function createEpisodeOne(selections: OnboardingSelections, seriesState?: SeriesState): Episode {
  const stylePack = stylePacks.find((pack) => pack.id === selections.stylePackId) ?? stylePacks[0]
  const heroName = selections.heroType === 'custom' && selections.customHeroName ? selections.customHeroName : heroByType[selections.heroType][selections.language]

  return {
    episode_id: `ep-1-${selections.stylePackId}-${selections.storyMood}`,
    series_id: seriesState?.id ?? `series-${selections.stylePackId}-${selections.language}`,
    title: ({ cozy_forest: { ru: 'Фонарики на лесной тропинке', uz: 'O‘rmon yo‘lidagi chiroqlar', kz: 'Орман соқпағындағы шамдар' }, magic_garden: { ru: 'Лепестковая дорожка', uz: 'Gulbargli yo‘lakcha', kz: 'Жапырақты жолақ' }, silk_road: { ru: 'Фонарь у каравана', uz: 'Karvon yonidagi chiroq', kz: 'Керуен жанындағы шам' }, stars_and_space: { ru: 'Свет звёздного маяка', uz: 'Yulduz mayog‘i nuri', kz: 'Жұлдыз шамшырағының жарығы' }, animal_world: { ru: 'Тёплая поляна друзей', uz: 'Do‘stlar yaylovidagi iliq oqshom', kz: 'Достар алаңқайындағы жылы кеш' }, sea_islands: { ru: 'Огонёк у маяка', uz: 'Mayoq yonidagi mayin chiroq', kz: 'Шамшырақ жанындағы жарық' }, castle_mystery: { ru: 'Лампа в тихой галерее', uz: 'Sokin yo‘lakdagi chiroq', kz: 'Тыныш дәліздегі шам' }, brave_adventure: { ru: 'Знак у поворота', uz: 'Burilishdagi belgi', kz: 'Бұрылыстағы белгі' } } as Record<OnboardingSelections['stylePackId'], Record<Language, string>>)[selections.stylePackId][selections.language],
    story_text: polishStoryText((worldTemplates[selections.stylePackId] ?? worldTemplates.cozy_forest).intro[selections.language]),
    mode: selections.storyMode,
    mood: selections.storyMood,
    stylePackId: stylePack.id,
    choices: episodeOneChoices(selections),
    state_patch: { last_event: selections.language === 'ru' ? 'герой остановился перед добрым выбором' : 'gentle choice moment opened', open_arc: selections.language === 'ru' ? 'Путь добрых дел в новом мире' : 'kind path arc' },
    vocabulary: vocabularyFor(selections.language),
      nextEpisodePreview: selections.language === 'ru'
        ? `${heroName} оставит в мире маленький след. Следующая серия начнётся с него.`
        : selections.language === 'uz'
          ? `${heroName} olamda kichik iz qoldiradi. Keyingi qism shu izdan boshlanadi.`
          : `${heroName} әлемде кішкентай із қалдырады. Келесі бөлім сол ізден басталады.`,
    safety_self_check: { approved: true, risk_level: 'low', flags: { discrimination: false, humiliation: false, religious_push: false, political_push: false, gender_stereotype: false, nationality_stereotype: false, conditional_love: false, bedtime_overstimulation: false, adult_theme: false, excessive_fear: false }, required_action: 'publish' },
  }
}

function createEpisodeTwo(selections: OnboardingSelections, seriesState: SeriesState): Episode {
  const lastChoice = seriesState.choiceHistory[seriesState.choiceHistory.length - 1]
  const friend = seriesState.recurringCharacters[seriesState.recurringCharacters.length - 1]

  const tpl = worldTemplates[selections.stylePackId]
  const idx = seriesState.choiceHistory.length - 1
  const rememberedText = selections.language === 'ru'
    ? (lastChoice.choice_id === 'path_a' ? tpl.episodeTwo.ru.a : lastChoice.choice_id === 'path_b' ? tpl.episodeTwo.ru.b : tpl.episodeTwo.ru.fallback)
    : selections.language === 'uz'
      ? (lastChoice.choice_id === 'path_a' ? tpl.episodeTwo.uz.a : lastChoice.choice_id === 'path_b' ? tpl.episodeTwo.uz.b : tpl.episodeTwo.uz.fallback)
      : (lastChoice.choice_id === 'path_a' ? tpl.episodeTwo.kz.a : lastChoice.choice_id === 'path_b' ? tpl.episodeTwo.kz.b : tpl.episodeTwo.kz.fallback)

  return {
    episode_id: `ep-2-${selections.stylePackId}-${seriesState.choiceHistory.length}`,
    series_id: seriesState.id,
    title: ({ cozy_forest: { ru: 'Огонёк у старого пенька', uz: 'Eski to‘nka yonidagi chiroq', kz: 'Ескі томар жанындағы шам' }, magic_garden: { ru: 'След у лунного цветка', uz: 'Oy guli yonidagi iz', kz: 'Ай гүлі жанындағы із' }, silk_road: { ru: 'Узор на карте каравана', uz: 'Karvon xaritasidagi naqsh', kz: 'Керуен картасындағы өрнек' }, stars_and_space: { ru: 'Луч над звёздной станцией', uz: 'Yulduz bekati ustidagi nur', kz: 'Жұлдыз бекеті үстіндегі сәуле' }, animal_world: { ru: 'Утро у поилки', uz: 'Suvdon yonidagi tong', kz: 'Суат жанындағы таң' }, sea_islands: { ru: 'Ракушка у тёплой воды', uz: 'Iliq suv yonidagi chig‘anoq', kz: 'Жылы су жанындағы қабыршақ' }, castle_mystery: { ru: 'Записка у старой двери', uz: 'Eski eshik yonidagi xat', kz: 'Ескі есік жанындағы хат' }, brave_adventure: { ru: 'След на тропе приключений', uz: 'Sarguzasht yo‘lidagi iz', kz: 'Шытырман жолындағы із' } } as Record<OnboardingSelections['stylePackId'], Record<Language, string>>)[selections.stylePackId][selections.language],
    story_text: rememberedText,
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
