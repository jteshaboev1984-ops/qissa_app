import {
  buildFinalEpisode,
  emptySafetyFlags,
  type CandidateChoice,
  type CandidatePatch,
  type Language,
  type NormalizedStoryContext,
  type StoryCandidate,
} from './contracts.ts'
import { fallbackChoiceMemory, fallbackContinuationMemory } from './storyCoreBranches.ts'
import { referenceEpisodeOneStory } from './storyCoreReference.ts'
import { getWorldNarrative, type WorldBranchNarrative } from './storyWorldNarratives.ts'
import { addWorldClosing } from './storyWorldClosings.ts'

type Localized = Record<Language, string>
type WorldFallback = {
  titleOne: Localized
  titleTwo: Localized
  opening: Localized
  choiceA: Localized
  choiceB: Localized
  icons: [string, string]
}

const localized = (ru: string, uz: string, kz: string): Localized => ({ ru, uz, kz })

const worlds: Record<NormalizedStoryContext['stylePackId'], WorldFallback> = {
  cozy_forest: {
    titleOne: localized('Фонарики на лесной тропинке', 'O‘rmon yo‘lidagi chiroqlar', 'Орман соқпағындағы шамдар'),
    titleTwo: localized('Лес помнит добрый выбор', 'O‘rmon mehribon tanlovni eslaydi', 'Орман мейірімді таңдауды есте сақтайды'),
    opening: localized(
      'Вечером в уютном лесу мерцали светлячки. У тропинки друзья нашли два спокойных способа помочь лесным жителям.',
      'Kechqurun shinam o‘rmonda yaltirab turgan qo‘ng‘izlar miltilladi. Yo‘l bo‘yida do‘stlar o‘rmon ahliga yordam berishning ikki sokin yo‘lini topdi.',
      'Кешке жайлы орманда жарқырауықтар жылтырады. Соқпақ жанында достар орман тұрғындарына көмектесудің екі тыныш жолын тапты.',
    ),
    choiceA: localized('Зажечь фонарики вдоль тропинки', 'Yo‘l bo‘ylab chiroqlar yoqish', 'Соқпақ бойына шам жағу'),
    choiceB: localized('Спеть тихую песню лесным друзьям', 'O‘rmon do‘stlariga sokin qo‘shiq aytish', 'Орман достарына баяу ән айту'),
    icons: ['🏮', '🎵'],
  },
  magic_garden: {
    titleOne: localized('Лепестковая дорожка', 'Gulbargli yo‘lak', 'Гүл жапырақты жол'),
    titleTwo: localized('Сад помнит добрый выбор', 'Bog‘ mehribon tanlovni eslaydi', 'Бақ мейірімді таңдауды есте сақтайды'),
    opening: localized(
      'В Волшебном саду вечер лёг на лепестковые дорожки. У фонтана лунные цветы ждали спокойной и бережной помощи.',
      'Sehrli bog‘da oqshom gulbargli yo‘laklarga tushdi. Favvora yonidagi oy gullari sokin va ehtiyotkor yordamni kutardi.',
      'Сиқырлы бақта кеш гүл жапырақты жолдарға жайылды. Субұрқақ жанындағы ай гүлдері тыныш әрі ұқыпты көмекті күтті.',
    ),
    choiceA: localized('Полить лунный цветник', 'Oy gullariga suv quyish', 'Ай гүлдерін суару'),
    choiceB: localized('Поставить светлячковую чашу', 'Yorug‘lik kosasini qo‘yish', 'Жарық тостағанын қою'),
    icons: ['🌸', '✨'],
  },
  brave_adventure: {
    titleOne: localized('Знак у поворота', 'Burilishdagi belgi', 'Бұрылыстағы белгі'),
    titleTwo: localized('Карта помнит выбранный путь', 'Xarita tanlangan yo‘lni eslaydi', 'Карта таңдалған жолды есте сақтайды'),
    opening: localized(
      'На доброй тропе приключений ветер шевелил цветные указатели. За мостиком лежала карта, которая помогала идти без спешки.',
      'Mehribon sarguzasht yo‘lida shamol rangli belgilarni tebratdi. Ko‘prik ortida shoshilmasdan yurishga yordam beradigan xarita yotardi.',
      'Мейірімді шытырман жолда жел түрлі түсті белгілерді тербетті. Көпірдің ар жағында асықпай жүруге көмектесетін карта жатты.',
    ),
    choiceA: localized('Поставить фонарь у поворота', 'Burilish yoniga chiroq qo‘yish', 'Бұрылысқа шам қою'),
    choiceB: localized('Позвать друзей идти вместе', 'Do‘stlarni birga yurishga chaqirish', 'Достарды бірге жүруге шақыру'),
    icons: ['🧭', '🤝'],
  },
  stars_and_space: {
    titleOne: localized('Свет звёздного маяка', 'Yulduz mayog‘ining nuri', 'Жұлдыз шамшырағының жарығы'),
    titleTwo: localized('Звёздная карта помнит выбор', 'Yulduz xaritasi tanlovni eslaydi', 'Жұлдыз картасы таңдауды есте сақтайды'),
    opening: localized(
      'Над звёздной станцией тихо плыли планеты. Маленький добрый робот держал карту и предлагал два спокойных пути исследования.',
      'Yulduzli bekat ustida sayyoralar sokin suzdi. Kichik mehribon robot xaritani ushlab, tadqiqotning ikki sokin yo‘lini ko‘rsatdi.',
      'Жұлдыз станциясының үстінде ғаламшарлар тыныш жүзіп жүрді. Кішкентай мейірімді робот картаны ұстап, зерттеудің екі тыныш жолын көрсетті.',
    ),
    choiceA: localized('Настроить звёздный маяк', 'Yulduz mayog‘ini sozlash', 'Жұлдыз шамшырағын баптау'),
    choiceB: localized('Сложить новую созвездную линию', 'Yangi yulduz turkumini chizish', 'Жаңа шоқжұлдыз сызығын құру'),
    icons: ['🔭', '⭐'],
  },
  silk_road: {
    titleOne: localized('Фонарь у каравана', 'Karvon yonidagi chiroq', 'Керуен жанындағы шам'),
    titleTwo: localized('Узор помнит добрый выбор', 'Naqsh mehribon tanlovni eslaydi', 'Өрнек мейірімді таңдауды есте сақтайды'),
    opening: localized(
      'У караванной стоянки пахло тёплым хлебом и свежим чаем. Мастера готовили добрый дорожный знак и просили помочь.',
      'Karvon bekatida issiq non va yangi choy hidi taraldi. Hunarmandlar mehribon yo‘l belgisini tayyorlab, yordam so‘radi.',
      'Керуен аялдамасында жылы нан мен жаңа шайдың иісі тарады. Шеберлер мейірімді жол белгісін дайындап, көмек сұрады.',
    ),
    choiceA: localized('Зажечь караванный фонарь', 'Karvon chirog‘ini yoqish', 'Керуен шамын жағу'),
    choiceB: localized('Развернуть карту узоров', 'Naqshli xaritani ochish', 'Өрнекті картаны ашу'),
    icons: ['🏮', '🗺️'],
  },
  animal_world: {
    titleOne: localized('Тёплая поляна друзей', 'Do‘stlarning iliq maydoni', 'Достардың жылы алаңы'),
    titleTwo: localized('Поляна помнит заботу', 'Maydon g‘amxo‘rlikni eslaydi', 'Алаң қамқорлықты есте сақтайды'),
    opening: localized(
      'На тёплой поляне собрались снежный барс, маленький орёл и черепаха. Они хотели вместе сделать свой дом ещё уютнее.',
      'Iliq maydonda qor barsi, kichik burgut va toshbaqa yig‘ildi. Ular uylarini yanada shinam qilishni istardi.',
      'Жылы алаңда қар барысы, кішкентай бүркіт пен тасбақа жиналды. Олар үйлерін одан әрі жайлы еткісі келді.',
    ),
    choiceA: localized('Наполнить поилку чистой водой', 'Suv idishini toza suv bilan to‘ldirish', 'Суатты таза сумен толтыру'),
    choiceB: localized('Собрать мягкие листья для гнезда', 'In uchun yumshoq barglar yig‘ish', 'Ұяға жұмсақ жапырақ жинау'),
    icons: ['💧', '🍂'],
  },
  castle_mystery: {
    titleOne: localized('Лампа в тихой галерее', 'Sokin galereyadagi chiroq', 'Тыныш галереядағы шам'),
    titleTwo: localized('Галерея помнит добрый выбор', 'Galereya mehribon tanlovni eslaydi', 'Галерея мейірімді таңдауды есте сақтайды'),
    opening: localized(
      'В светлом замке тихо звенели флажки. У старой двери лежали голубой ключ и добрая записка без пугающих загадок.',
      'Yorug‘ qal’ada bayroqchalar mayin jarangladi. Eski eshik yonida ko‘k kalit va mehribon xat yotardi.',
      'Жарық қамалда жалаушалар баяу сыңғырлады. Ескі есіктің жанында көк кілт пен жылы хат жатты.',
    ),
    choiceA: localized('Зажечь лампу у галереи', 'Galereya yonidagi chiroqni yoqish', 'Галерея жанындағы шамды жағу'),
    choiceB: localized('Прочитать добрую записку вместе', 'Mehribon xatni birga o‘qish', 'Жылы хатты бірге оқу'),
    icons: ['🕯️', '💌'],
  },
  sea_islands: {
    titleOne: localized('Огонёк у маяка', 'Mayak yonidagi chiroq', 'Шамшырақ жанындағы жарық'),
    titleTwo: localized('Ракушка помнит добрый выбор', 'Chig‘anoq mehribon tanlovni eslaydi', 'Қабыршақ мейірімді таңдауды есте сақтайды'),
    opening: localized(
      'На тёплом берегу маленький маяк дышал мягким светом. Волны принесли ракушку с двумя добрыми подсказками.',
      'Iliq qirg‘oqda kichik mayak mayin nur sochdi. To‘lqinlar ikki mehribon ishorali chig‘anoqni olib keldi.',
      'Жылы жағалауда кішкентай шамшырақ жұмсақ жарық шашты. Толқындар екі мейірімді ишарасы бар қабыршақты әкелді.',
    ),
    choiceA: localized('Зажечь береговой фонарик', 'Qirg‘oq chirog‘ini yoqish', 'Жағалау шамын жағу'),
    choiceB: localized('Собрать ракушки для друзей', 'Do‘stlar uchun chig‘anoqlar yig‘ish', 'Достарға қабыршақ жинау'),
    icons: ['🏝️', '🐚'],
  },
}

const patch = (event: string, arc: string): CandidatePatch => ({
  last_event: event,
  new_friend: null,
  hero_trait: 'kind_and_attentive',
  open_arc: arc,
  relationship_updates: [{ key: 'friends', value: 'trust_increased' }],
  canon_updates: [{ key: 'last_choice', value: event }],
})

const qualityChoicePatch = (
  context: NormalizedStoryContext,
  choiceId: string,
  branch: WorldBranchNarrative,
): CandidatePatch => ({
  last_event: choiceId,
  new_friend: branch.friend,
  hero_trait: 'kind_and_attentive',
  open_arc: `continue-${context.stylePackId}-${choiceId}`,
  relationship_updates: [{ key: branch.friendId, value: 'trust_started_through_choice' }],
  canon_updates: [
    { key: 'last_choice', value: choiceId },
    { key: 'remembered_artifact', value: branch.artifact },
  ],
})

const qualityContinuationPatch = (
  choiceId: string,
  branch: WorldBranchNarrative,
): CandidatePatch => ({
  last_event: `continued_${choiceId}`,
  new_friend: branch.friend,
  hero_trait: 'kind_and_attentive',
  open_arc: null,
  relationship_updates: [{ key: branch.friendId, value: 'trust_strengthened_by_remembered_choice' }],
  canon_updates: [
    { key: 'remembered_choice', value: choiceId },
    { key: 'remembered_artifact', value: branch.artifact },
  ],
})

const branchForChoice = (
  narrative: ReturnType<typeof getWorldNarrative>,
  choiceId: string,
): WorldBranchNarrative | null => {
  if (!narrative) return null
  if (choiceId === 'choice-a' || choiceId === 'path_a') return narrative.branches.a
  if (choiceId === 'choice-b' || choiceId === 'path_b') return narrative.branches.b
  return null
}

export const buildSafeFallback = (context: NormalizedStoryContext) => {
  const world = worlds[context.stylePackId]
  const language = context.language
  const qualityNarrative = getWorldNarrative(context)

  if (context.isContinuation) {
    const latestChoice = context.choiceHistory[context.choiceHistory.length - 1]
    const qualityBranch = branchForChoice(qualityNarrative, latestChoice?.choice_id ?? '')
    const continuation = qualityBranch && latestChoice
      ? {
          title: qualityBranch.title,
          storyText: addWorldClosing(context, latestChoice.choice_id, qualityBranch.continuation),
          statePatch: qualityContinuationPatch(latestChoice.choice_id, qualityBranch),
        }
      : {
          title: world.titleTwo[language],
          ...fallbackContinuationMemory(context),
        }

    const candidate: StoryCandidate = {
      title: continuation.title,
      story_text: continuation.storyText,
      choices: [],
      state_patch: continuation.statePatch,
      vocabulary: [],
      nextEpisodePreview: '',
    }
    return buildFinalEpisode(context, candidate, {
      approved: true,
      risk_level: 'low',
      flags: emptySafetyFlags(),
      required_action: 'fallback',
    })
  }

  const makeChoice = (id: 'choice-a' | 'choice-b', text: string, icon: string): CandidateChoice => {
    const qualityBranch = id === 'choice-a' ? qualityNarrative?.branches.a : qualityNarrative?.branches.b
    if (qualityBranch) {
      return {
        choice_id: id,
        text,
        effect_summary: qualityBranch.effectSummary,
        resolution_text: qualityBranch.resolutionText,
        tomorrow_seed: qualityBranch.tomorrowSeed,
        choice_icon: icon,
        state_patch: qualityChoicePatch(context, id, qualityBranch),
        value_alignment: id === 'choice-a' ? ['kindness', 'mutual_help'] : ['friendship', 'curiosity'],
      }
    }

    const memory = fallbackChoiceMemory(context, id, text)
    return {
      choice_id: id,
      text,
      effect_summary: memory.effectSummary,
      resolution_text: memory.resolutionText,
      tomorrow_seed: memory.tomorrowSeed,
      choice_icon: icon,
      state_patch: memory.statePatch,
      value_alignment: id === 'choice-a' ? ['kindness', 'mutual_help'] : ['friendship', 'curiosity'],
    }
  }

  const vocabulary = language === 'ru'
    ? [
        { word: 'бережно', translation: 'carefully', example: '{{HERO}} бережно помог друзьям.' },
        { word: 'дружба', translation: 'friendship', example: 'Дружба сделала путь теплее.' },
      ]
    : []

  const genericOpening = `${world.opening[language]} {{HERO}} остановился, внимательно посмотрел вокруг и понял, что можно помочь спокойно и без спешки.`
  const candidate: StoryCandidate = {
    title: qualityNarrative?.episodeOneTitle ?? world.titleOne[language],
    story_text: qualityNarrative?.episodeOneStory ?? referenceEpisodeOneStory(context, genericOpening),
    choices: [
      makeChoice('choice-a', world.choiceA[language], world.icons[0]),
      makeChoice('choice-b', world.choiceB[language], world.icons[1]),
    ],
    state_patch: patch('episode_started', `continue-${context.stylePackId}`),
    vocabulary,
    nextEpisodePreview: context.storyMode === 'series'
      ? (qualityNarrative
          ? 'Наутро выбранный путь приведёт героя к новой встрече.'
          : language === 'ru'
            ? 'Завтра история вернётся к выбранному пути.'
            : language === 'uz'
              ? 'Ertaga hikoya tanlangan yo‘lga qaytadi.'
              : 'Ертең оқиға таңдалған жолға қайта оралады.')
      : '',
  }

  return buildFinalEpisode(context, candidate, {
    approved: true,
    risk_level: 'low',
    flags: emptySafetyFlags(),
    required_action: 'fallback',
  })
}
