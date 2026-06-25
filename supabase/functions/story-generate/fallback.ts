import {
  buildFinalEpisode,
  emptySafetyFlags,
  type CandidateChoice,
  type CandidatePatch,
  type Language,
  type NormalizedStoryContext,
  type StoryCandidate,
} from './contracts.ts'

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
      'Над звёздной станцией тихо плыли планеты. Маленький добрый робот держал карту и предлагал два безопасных пути исследования.',
      'Yulduzli bekat ustida sayyoralar sokin suzdi. Kichik mehribon robot xaritani ushlab, tadqiqotning ikki xavfsiz yo‘lini ko‘rsatdi.',
      'Жұлдыз станциясының үстінде ғаламшарлар тыныш жүзіп жүрді. Кішкентай мейірімді робот картаны ұстап, зерттеудің екі қауіпсіз жолын көрсетті.',
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
      'В светлом замке тихо звенели флажки. У старой двери лежали голубой ключ и добрая записка без страшных загадок.',
      'Yorug‘ qal’ada bayroqchalar mayin jarangladi. Eski eshik yonida ko‘k kalit va qo‘rqinchli bo‘lmagan mehribon xat yotardi.',
      'Жарық қамалда жалаушалар баяу сыңғырлады. Ескі есіктің жанында көк кілт пен қорқынышсыз жылы хат жатты.',
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

const common = {
  resolution: localized(
    '{{HERO}} сделал выбор бережно. Мир ответил мягким светом, а друзья почувствовали себя спокойнее.',
    '{{HERO}} tanlovni ehtiyotkorlik bilan amalga oshirdi. Dunyo mayin nur bilan javob berdi, do‘stlar esa xotirjam bo‘ldi.',
    '{{HERO}} таңдауын ұқыппен жасады. Әлем жұмсақ жарықпен жауап беріп, достар тыныштала түсті.',
  ),
  seed: localized(
    'На этом месте остался маленький добрый знак. В следующей истории он поможет узнать выбранный путь.',
    'Bu yerda kichik mehribon belgi qoldi. Keyingi hikoyada u tanlangan yo‘lni eslatadi.',
    'Бұл жерде кішкентай мейірімді белгі қалды. Келесі оқиғада ол таңдалған жолды еске салады.',
  ),
  continuation: localized(
    'Утром вчерашний выбор уже изменил мир. {{HERO}} увидел знакомый знак, помог друзьям завершить начатое дело и вернулся в уютное место. Всё вокруг стало тихим и спокойным.',
    'Ertalab kechagi tanlov dunyoni o‘zgartirgan edi. {{HERO}} tanish belgini ko‘rdi, do‘stlariga boshlangan ishni tugatishda yordam berdi va shinam joyga qaytdi. Atrof yana sokinlashdi.',
    'Таңертең кешегі таңдау әлемді өзгертіп қойған еді. {{HERO}} таныс белгіні көріп, достарына басталған істі аяқтауға көмектесті де, жайлы жерге оралды. Айнала қайтадан тынышталды.',
  ),
}

const patch = (event: string, arc: string): CandidatePatch => ({
  last_event: event,
  new_friend: null,
  hero_trait: 'kind_and_attentive',
  open_arc: arc,
  relationship_updates: [{ key: 'friends', value: 'trust_increased' }],
  canon_updates: [{ key: 'last_choice', value: event }],
})

export const buildSafeFallback = (context: NormalizedStoryContext) => {
  const world = worlds[context.stylePackId]
  const language = context.language

  if (context.isContinuation) {
    const latestChoice = context.choiceHistory[context.choiceHistory.length - 1]
    const remembered = latestChoice?.tomorrow_seed || latestChoice?.effect_summary || latestChoice?.choice_text || ''
    const candidate: StoryCandidate = {
      title: world.titleTwo[language],
      story_text: `${remembered ? `${remembered} ` : ''}${common.continuation[language]}`.trim(),
      choices: [],
      state_patch: patch('continued_saved_choice', ''),
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

  const makeChoice = (id: 'choice-a' | 'choice-b', text: string, icon: string): CandidateChoice => ({
    choice_id: id,
    text,
    effect_summary: language === 'ru'
      ? 'Этот выбор помогает друзьям и оставляет в мире добрый след.'
      : language === 'uz'
        ? 'Bu tanlov do‘stlarga yordam beradi va dunyoda mehribon iz qoldiradi.'
        : 'Бұл таңдау достарға көмектесіп, әлемде мейірімді із қалдырады.',
    resolution_text: common.resolution[language],
    tomorrow_seed: common.seed[language],
    choice_icon: icon,
    state_patch: patch(id, `continue-${context.stylePackId}-${id}`),
    value_alignment: id === 'choice-a' ? ['kindness', 'mutual_help'] : ['friendship', 'curiosity'],
  })

  const vocabulary = language === 'ru'
    ? [
        { word: 'бережно', translation: 'carefully', example: '{{HERO}} бережно помог друзьям.' },
        { word: 'дружба', translation: 'friendship', example: 'Дружба сделала путь теплее.' },
      ]
    : []

  const candidate: StoryCandidate = {
    title: world.titleOne[language],
    story_text: `${world.opening[language]} {{HERO}} остановился, внимательно посмотрел вокруг и понял, что можно помочь спокойно и без спешки.`,
    choices: [
      makeChoice('choice-a', world.choiceA[language], world.icons[0]),
      makeChoice('choice-b', world.choiceB[language], world.icons[1]),
    ],
    state_patch: patch('episode_started', `continue-${context.stylePackId}`),
    vocabulary,
    nextEpisodePreview: context.storyMode === 'series'
      ? (language === 'ru'
          ? 'В следующей истории мир мягко напомнит о выбранном пути.'
          : language === 'uz'
            ? 'Keyingi hikoyada dunyo tanlangan yo‘lni mayin eslatadi.'
            : 'Келесі оқиғада әлем таңдалған жолды жұмсақ еске салады.')
      : '',
  }

  return buildFinalEpisode(context, candidate, {
    approved: true,
    risk_level: 'low',
    flags: emptySafetyFlags(),
    required_action: 'fallback',
  })
}
