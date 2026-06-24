type Language = 'ru' | 'uz' | 'kz'
type StoryMode = 'one_time' | 'series'
type StoryMood = 'bedtime' | 'kind_adventure'
type StylePackId =
  | 'cozy_forest'
  | 'magic_garden'
  | 'brave_adventure'
  | 'stars_and_space'
  | 'silk_road'
  | 'animal_world'
  | 'castle_mystery'
  | 'sea_islands'

type Localized = Record<Language, string>

type StoryRequest = {
  selections?: {
    ageGroup?: string
    language?: Language
    heroType?: string
    customHeroName?: string
    stylePackId?: StylePackId
    storyMode?: StoryMode
    storyMood?: StoryMood
  }
  seriesState?: {
    id?: string
    mainCharacter?: string
    choiceHistory?: Array<{
      choice_id?: string
      effect_summary?: string
      resolution_text?: string
      tomorrow_seed?: string
    }>
  }
}

type WorldConfig = {
  titleOne: Localized
  titleTwo: Localized
  opening: Localized
  choiceA: Localized
  choiceB: Localized
  iconA: string
  iconB: string
}

const localized = (ru: string, uz: string, kz: string): Localized => ({ ru, uz, kz })

const worlds: Record<StylePackId, WorldConfig> = {
  cozy_forest: {
    titleOne: localized('Фонарики на лесной тропинке', 'O‘rmon yo‘lidagi chiroqlar', 'Орман соқпағындағы шамдар'),
    titleTwo: localized('Огонёк у старого пенька', 'Eski to‘nka yonidagi chiroq', 'Ескі томар жанындағы шам'),
    opening: localized(
      'Вечером в лесу мерцали фонарики, шуршали листья и мягко светились светлячки.',
      'Kechqurun o‘rmonda chiroqlar miltilladi, barglar shivirladi va yaltirab turgan qo‘ng‘izlar yo‘lni yoritdi.',
      'Кешке орманда шамдар жылтырап, жапырақтар сыбдырлады, ал жарқырауықтар жолды жұмсақ жарықтандырды.',
    ),
    choiceA: localized('Зажечь фонарики вдоль тропинки', 'Yo‘l bo‘ylab chiroqlar yoqish', 'Соқпақ бойына шам жағу'),
    choiceB: localized('Спеть тихую песню лесным друзьям', 'O‘rmon do‘stlariga sokin qo‘shiq aytish', 'Орман достарына баяу ән айту'),
    iconA: '🏮', iconB: '🎵',
  },
  magic_garden: {
    titleOne: localized('Лепестковая дорожка', 'Gulbargli yo‘lak', 'Гүл жапырақты жол'),
    titleTwo: localized('След у лунного цветка', 'Oy guli yonidagi iz', 'Ай гүлінің жанындағы із'),
    opening: localized(
      'В Волшебном саду вечер лёг на лепестковые дорожки. У фонтана светились лунные цветы.',
      'Sehrli bog‘da oqshom gulbargli yo‘laklarga tushdi. Favvora yonida oy gullari mayin porladi.',
      'Сиқырлы бақта кеш гүл жапырақты жолдарға жайылды. Субұрқақ жанында ай гүлдері жұмсақ жарқырады.',
    ),
    choiceA: localized('Полить лунный цветник', 'Oy gullariga suv quyish', 'Ай гүлдерін суару'),
    choiceB: localized('Поставить светлячковую чашу', 'Yorug‘lik kosasini qo‘yish', 'Жарық тостағанын қою'),
    iconA: '🌸', iconB: '✨',
  },
  brave_adventure: {
    titleOne: localized('Знак у поворота', 'Burilishdagi belgi', 'Бұрылыстағы белгі'),
    titleTwo: localized('След за мостиком', 'Ko‘prik ortidagi iz', 'Көпірден кейінгі із'),
    opening: localized(
      'На тропе приключений ветер шевелил ленточки-указатели, а за мостиком мягко светилась карта.',
      'Sarguzasht yo‘lida shamol rangli belgilarni tebratdi, ko‘prik ortida esa xarita mayin porladi.',
      'Шытырман жолда жел түрлі түсті белгілерді тербетті, ал көпірдің ар жағында карта жұмсақ жарқырады.',
    ),
    choiceA: localized('Поставить фонарь у поворота', 'Burilish yoniga chiroq qo‘yish', 'Бұрылысқа шам қою'),
    choiceB: localized('Позвать друзей идти вместе', 'Do‘stlarni birga yurishga chaqirish', 'Достарды бірге жүруге шақыру'),
    iconA: '🧭', iconB: '🤝',
  },
  stars_and_space: {
    titleOne: localized('Свет звёздного маяка', 'Yulduz mayog‘ining nuri', 'Жұлдыз шамшырағының жарығы'),
    titleTwo: localized('Новая точка на карте', 'Xaritadagi yangi nuqta', 'Картадағы жаңа нүкте'),
    opening: localized(
      'Над звёздной станцией плыли тихие планеты, а маленький робот держал серебряную карту неба.',
      'Yulduzli bekat ustida sokin sayyoralar suzdi, kichik robot esa kumush osmon xaritasini ushlab turdi.',
      'Жұлдыз станциясының үстінде тыныш ғаламшарлар жүзіп жүрді, ал кішкентай робот күміс аспан картасын ұстап тұрды.',
    ),
    choiceA: localized('Настроить звёздный маяк', 'Yulduz mayog‘ini sozlash', 'Жұлдыз шамшырағын баптау'),
    choiceB: localized('Сложить новую созвездную линию', 'Yangi yulduz turkumini chizish', 'Жаңа шоқжұлдыз сызығын құру'),
    iconA: '🔭', iconB: '⭐',
  },
  silk_road: {
    titleOne: localized('Фонарь у каравана', 'Karvon yonidagi chiroq', 'Керуен жанындағы шам'),
    titleTwo: localized('Узор на дорожной карте', 'Yo‘l xaritasidagi naqsh', 'Жол картасындағы өрнек'),
    opening: localized(
      'У караванной стоянки вечер пах тёплым хлебом и свежим чаем, а на навесах мерцали узоры.',
      'Karvon bekatida oqshom issiq non va yangi choy hidini olib keldi, ayvonlarda esa naqshlar yaltiradi.',
      'Керуен аялдамасында кеш жылы нан мен жаңа шайдың иісін әкелді, ал шатырларда өрнектер жылтырады.',
    ),
    choiceA: localized('Зажечь караванный фонарь', 'Karvon chirog‘ini yoqish', 'Керуен шамын жағу'),
    choiceB: localized('Развернуть карту узоров', 'Naqshli xaritani ochish', 'Өрнекті картаны ашу'),
    iconA: '🏮', iconB: '🗺️',
  },
  animal_world: {
    titleOne: localized('Тёплая поляна друзей', 'Do‘stlarning iliq maydoni', 'Достардың жылы алаңы'),
    titleTwo: localized('Утро у поилки', 'Suv bo‘yidagi tong', 'Суат жанындағы таң'),
    opening: localized(
      'На тёплой поляне собрались звери: снежный барс лежал у камня, а маленький орёл сидел на ветке.',
      'Iliq maydonda hayvonlar yig‘ildi: qor barsi tosh yonida yotdi, kichik burgut esa shoxda o‘tirdi.',
      'Жылы алаңда жануарлар жиналды: қар барысы тас жанында жатты, ал кішкентай бүркіт бұтақта отырды.',
    ),
    choiceA: localized('Наполнить поилку чистой водой', 'Suv idishini toza suv bilan to‘ldirish', 'Суатты таза сумен толтыру'),
    choiceB: localized('Собрать мягкие листья для гнезда', 'In uchun yumshoq barglar yig‘ish', 'Ұяға жұмсақ жапырақ жинау'),
    iconA: '💧', iconB: '🍂',
  },
  castle_mystery: {
    titleOne: localized('Лампа в тихой галерее', 'Sokin galereyadagi chiroq', 'Тыныш галереядағы шам'),
    titleTwo: localized('Свет у старой двери', 'Eski eshik yonidagi nur', 'Ескі есік жанындағы жарық'),
    opening: localized(
      'В светлом замке тихо звенели флажки, а у старой двери лежал ключ с голубой ленточкой.',
      'Yorug‘ qal’ada bayroqchalar mayin jarangladi, eski eshik yonida esa ko‘k lentali kalit yotardi.',
      'Жарық қамалда жалаушалар баяу сыңғырлады, ал ескі есіктің жанында көк ленталы кілт жатты.',
    ),
    choiceA: localized('Зажечь лампу у галереи', 'Galereya yonidagi chiroqni yoqish', 'Галерея жанындағы шамды жағу'),
    choiceB: localized('Оставить добрую записку', 'Yaxshi tilak yozilgan xat qoldirish', 'Жылы тілек жазылған хат қалдыру'),
    iconA: '🕯️', iconB: '💌',
  },
  sea_islands: {
    titleOne: localized('Огонёк у маяка', 'Mayak yonidagi chiroq', 'Шамшырақ жанындағы жарық'),
    titleTwo: localized('Ракушка у тёплой воды', 'Iliq suv yonidagi chig‘anoq', 'Жылы су жанындағы қабыршақ'),
    opening: localized(
      'На тёплом берегу маленький маяк дышал мягким светом, а волны шептали у песка.',
      'Iliq qirg‘oqda kichik mayak mayin nur sochdi, to‘lqinlar esa qum yonida shivirladi.',
      'Жылы жағалауда кішкентай шамшырақ жұмсақ жарық шашты, ал толқындар құм жанында сыбырлады.',
    ),
    choiceA: localized('Зажечь береговой фонарик', 'Qirg‘oq chirog‘ini yoqish', 'Жағалау шамын жағу'),
    choiceB: localized('Положить светящуюся ракушку у воды', 'Yorqin chig‘anoqni suv yoniga qo‘yish', 'Жарқыраған қабыршақты су жанына қою'),
    iconA: '🏝️', iconB: '🐚',
  },
}

const copy = {
  ru: {
    effectA: 'Этот выбор сделает путь спокойнее и поможет друзьям.',
    effectB: 'Этот выбор соберёт друзей рядом и сохранит тёплый след.',
    resolution: 'Герой сделал выбор бережно. Мир ответил мягким светом, а друзья почувствовали себя спокойнее.',
    seed: 'На этом месте остался маленький знак. Завтра он покажет продолжение пути.',
    follow: 'Утром вчерашний выбор уже изменил мир. Герой заметил знакомый знак и понял, что история помнит его решение.',
    preview: 'Завтра история продолжится с этого места.',
  },
  uz: {
    effectA: 'Bu tanlov yo‘lni tinchroq qiladi va do‘stlarga yordam beradi.',
    effectB: 'Bu tanlov do‘stlarni yaqinlashtiradi va iliq iz qoldiradi.',
    resolution: 'Qahramon tanlovni ehtiyotkorlik bilan amalga oshirdi. Dunyo mayin nur bilan javob berdi, do‘stlar esa o‘zlarini xotirjam his qildi.',
    seed: 'Bu yerda kichik belgi qoldi. Ertaga u yo‘lning davomini ko‘rsatadi.',
    follow: 'Ertalab kechagi tanlov dunyoni o‘zgartirgan edi. Qahramon tanish belgini ko‘rib, hikoya uning qarorini eslab qolganini tushundi.',
    preview: 'Ertaga hikoya shu yerdan davom etadi.',
  },
  kz: {
    effectA: 'Бұл таңдау жолды тыныш етіп, достарға көмектеседі.',
    effectB: 'Бұл таңдау достарды жақындастырып, жылы із қалдырады.',
    resolution: 'Кейіпкер таңдауын ұқыппен орындады. Әлем жұмсақ жарықпен жауап беріп, достар өздерін тыныш сезінді.',
    seed: 'Бұл жерде кішкентай белгі қалды. Ертең ол жолдың жалғасын көрсетеді.',
    follow: 'Таңертең кешегі таңдау әлемді өзгертіп қойған еді. Кейіпкер таныс белгіні көріп, оқиғаның оның шешімін есте сақтағанын түсінді.',
    preview: 'Ертең оқиға осы жерден жалғасады.',
  },
} satisfies Record<Language, Record<string, string>>

const allowedAges = new Set(['3-4', '5-7', '8-9'])
const allowedLanguages = new Set<Language>(['ru', 'uz', 'kz'])
const allowedModes = new Set<StoryMode>(['one_time', 'series'])
const allowedMoods = new Set<StoryMood>(['bedtime', 'kind_adventure'])
const allowedWorlds = new Set<StylePackId>(Object.keys(worlds) as StylePackId[])

const corsHeaders = (origin: string | null) => {
  const allowed =
    origin === 'https://jteshaboev1984-ops.github.io' ||
    origin === 'http://localhost:5173' ||
    origin === 'http://127.0.0.1:5173' ||
    Boolean(origin && /^https:\/\/[a-z0-9-]+\.app\.github\.dev$/.test(origin))

  return {
    'Access-Control-Allow-Origin': allowed && origin ? origin : 'https://jteshaboev1984-ops.github.io',
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

const json = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json; charset=utf-8' },
  })

const safeResult = {
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
} as const

Deno.serve(async (request: Request) => {
  const origin = request.headers.get('origin')
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) })
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405, origin)

  let input: StoryRequest
  try {
    input = await request.json()
  } catch {
    return json({ error: 'invalid_json' }, 400, origin)
  }

  const selections = input.selections
  const seriesState = input.seriesState
  if (!selections || !seriesState) return json({ error: 'missing_story_context' }, 400, origin)

  const { ageGroup, language, stylePackId, storyMode, storyMood } = selections
  if (
    !ageGroup || !allowedAges.has(ageGroup) ||
    !language || !allowedLanguages.has(language) ||
    !stylePackId || !allowedWorlds.has(stylePackId) ||
    !storyMode || !allowedModes.has(storyMode) ||
    !storyMood || !allowedMoods.has(storyMood) ||
    !seriesState.id
  ) {
    return json({ error: 'invalid_story_context' }, 422, origin)
  }

  const world = worlds[stylePackId]
  const text = copy[language]
  const history = Array.isArray(seriesState.choiceHistory) ? seriesState.choiceHistory : []
  const isContinuation = history.length > 0
  const hero = seriesState.mainCharacter?.trim() || selections.customHeroName?.trim() || 'Hero'

  if (isContinuation) {
    const previous = history.at(-1)
    const remembered = previous?.tomorrow_seed || previous?.resolution_text || previous?.effect_summary || ''
    const storyText = `${remembered ? `${remembered} ` : ''}${text.follow}`.trim()

    return json({
      episode: {
        episode_id: `ep-2-${stylePackId}`,
        series_id: seriesState.id,
        title: world.titleTwo[language],
        story_text: storyText,
        mode: storyMode,
        mood: storyMood,
        stylePackId,
        choices: [],
        state_patch: { last_event: previous?.choice_id || 'continued_story' },
        vocabulary: [],
        nextEpisodePreview: '',
        safety_self_check: safeResult,
      },
    }, 200, origin)
  }

  const choices = [
    {
      choice_id: 'choice-a',
      text: world.choiceA[language],
      effect_summary: text.effectA,
      resolution_text: text.resolution,
      tomorrow_seed: text.seed,
      choice_icon: world.iconA,
      state_patch: {
        last_event: 'choice-a',
        open_arc: `continue-${stylePackId}-a`,
        canon_updates: { last_choice: 'choice-a' },
      },
      value_alignment: ['kindness', 'mutual_help'],
    },
    {
      choice_id: 'choice-b',
      text: world.choiceB[language],
      effect_summary: text.effectB,
      resolution_text: text.resolution,
      tomorrow_seed: text.seed,
      choice_icon: world.iconB,
      state_patch: {
        last_event: 'choice-b',
        open_arc: `continue-${stylePackId}-b`,
        canon_updates: { last_choice: 'choice-b' },
      },
      value_alignment: ['friendship', 'curiosity'],
    },
  ]

  return json({
    episode: {
      episode_id: `ep-1-${stylePackId}`,
      series_id: seriesState.id,
      title: world.titleOne[language],
      story_text: `${world.opening[language]} ${hero} остановился и внимательно посмотрел вокруг.`,
      mode: storyMode,
      mood: storyMood,
      stylePackId,
      choices,
      state_patch: { last_event: 'episode_started' },
      vocabulary: language === 'ru'
        ? [
            { word: 'бережно', translation: 'carefully', example: 'Герой бережно помог друзьям.', sourceLanguage: 'ru', targetLanguage: 'en' },
            { word: 'дружба', translation: 'friendship', example: 'Дружба сделала путь теплее.', sourceLanguage: 'ru', targetLanguage: 'en' },
          ]
        : [],
      nextEpisodePreview: storyMode === 'series' ? text.preview : '',
      safety_self_check: safeResult,
    },
  }, 200, origin)
})
