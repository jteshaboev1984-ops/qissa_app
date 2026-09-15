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
import {
  genericEditorialChoiceMemory,
  genericEditorialContinuationMemory,
} from './storyGenericEditorial.ts'
import {
  referenceContinuationStory,
  referenceEpisodeOneStory,
  referenceEpisodeTitle,
} from './storyCoreReference.ts'
import { buildChildFirstClosedBetaCandidate } from './storySixMinuteEditorial.ts'
import { spaceChoiceMemory, spaceContinuationMemory } from './storySpaceMemory.ts'
import { spaceBedtimeChoiceMemory } from './storySpaceBedtimeMemory.ts'
import { magicGardenChoiceMemory } from './storyMagicGardenMemory.ts'

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
    titleTwo: localized('Утро у старого пенька', 'Eski to‘nka yonidagi tong', 'Ескі томар жанындағы таң'),
    opening: localized(
      'Вечером в уютном лесу мерцали светлячки. У тропинки друзья искали способ помочь лесным жителям добраться домой.',
      'Kechqurun shinam o‘rmonda yaltirab turgan qo‘ng‘izlar miltilladi. Do‘stlar o‘rmon ahliga uyga yetib olishda yordam bermoqchi edi.',
      'Кешке жайлы орманда жарқырауықтар жылтырады. Достар орман тұрғындарына үйге жетуге көмектескісі келді.',
    ),
    choiceA: localized('Зажечь фонарики вдоль тропинки', 'Yo‘l bo‘ylab chiroqlar yoqish', 'Соқпақ бойына шам жағу'),
    choiceB: localized('Спеть тихую песню лесным друзьям', 'O‘rmon do‘stlariga sokin qo‘shiq aytish', 'Орман достарына баяу ән айту'),
    icons: ['🏮', '🎵'],
  },
  magic_garden: {
    titleOne: localized('Лепестковая дорожка', 'Gulbargli yo‘lak', 'Гүл жапырақты жол'),
    titleTwo: localized('Свет над лунным садом', 'Oy bog‘i ustidagi nur', 'Ай бағының үстіндегі жарық'),
    opening: localized(
      'В Волшебном саду вечер лёг на лепестковые дорожки. У фонтана лунные цветы ждали бережной помощи.',
      'Sehrli bog‘da oqshom gulbargli yo‘laklarga tushdi. Favvora yonidagi oy gullari ehtiyotkor yordamni kutardi.',
      'Сиқырлы бақта кеш гүл жапырақты жолдарға жайылды. Субұрқақ жанындағы ай гүлдері ұқыпты көмекті күтті.',
    ),
    choiceA: localized('Полить лунный цветник', 'Oy gullariga suv quyish', 'Ай гүлдерін суару'),
    choiceB: localized('Поставить светлячковую чашу', 'Yorug‘lik kosasini qo‘yish', 'Жарық тостағанын қою'),
    icons: ['🌸', '✨'],
  },
  brave_adventure: {
    titleOne: localized('Знак у поворота', 'Burilishdagi belgi', 'Бұрылыстағы белгі'),
    titleTwo: localized('Дорога за мостом', 'Ko‘prik ortidagi yo‘l', 'Көпірдің ар жағындағы жол'),
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
    titleOne: localized('Маяк над станцией «Люмен»', '«Lyumen» bekati ustidagi mayoq', '«Люмен» стансасының үстіндегі шамшырақ'),
    titleTwo: localized('Тихий сигнал среди звёзд', 'Yulduzlar orasidagi sokin signal', 'Жұлдыздар арасындағы тыныш белгі'),
    opening: localized(
      'Над звёздной станцией тихо плыли планеты. Робот Пико раскрыл карту и показал два способа помочь лунной почте найти стыковочное окно станции.',
      'Yulduzli bekat ustida sayyoralar sokin suzdi. Robot Piko xaritani ochib, oy pochtasiga bekatni topishning ikki yo‘lini ko‘rsatdi.',
      'Жұлдыз станциясының үстінде ғаламшарлар тыныш жүзіп жүрді. Пико робот картаны ашып, ай поштасына станса терезесін табудың екі жолын көрсетті.',
    ),
    choiceA: localized('Настроить звёздный маяк', 'Yulduz mayog‘ini sozlash', 'Жұлдыз шамшырағын баптау'),
    choiceB: localized('Сложить новую линию созвездия', 'Yangi yulduz turkumini chizish', 'Жаңа шоқжұлдыз сызығын құру'),
    icons: ['🔭', '⭐'],
  },
  silk_road: {
    titleOne: localized('Фонарь у каравана', 'Karvon yonidagi chiroq', 'Керуен жанындағы шам'),
    titleTwo: localized('Узор на дороге каравана', 'Karvon yo‘lidagi naqsh', 'Керуен жолындағы өрнек'),
    opening: localized(
      'У караванной стоянки пахло тёплым хлебом и свежим чаем. Мастера готовили дорожный знак и просили помочь.',
      'Karvon bekatida issiq non va yangi choy hidi taraldi. Hunarmandlar yo‘l belgisini tayyorlab, yordam so‘radi.',
      'Керуен аялдамасында жылы нан мен жаңа шайдың иісі тарады. Шеберлер жол белгісін дайындап, көмек сұрады.',
    ),
    choiceA: localized('Зажечь караванный фонарь', 'Karvon chirog‘ini yoqish', 'Керуен шамын жағу'),
    choiceB: localized('Развернуть карту узоров', 'Naqshli xaritani ochish', 'Өрнекті картаны ашу'),
    icons: ['🏮', '🗺️'],
  },
  animal_world: {
    titleOne: localized('Тёплая поляна друзей', 'Do‘stlarning iliq maydoni', 'Достардың жылы алаңы'),
    titleTwo: localized('Утро на тёплой поляне', 'Iliq maydondagi tong', 'Жылы алаңдағы таң'),
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
    titleTwo: localized('Свет за старой дверью', 'Eski eshik ortidagi nur', 'Ескі есіктің ар жағындағы жарық'),
    opening: localized(
      'В светлом замке тихо звенели флажки. У старой двери лежали голубой ключ и тёплая записка.',
      'Yorug‘ qal’ada bayroqchalar mayin jarangladi. Eski eshik yonida ko‘k kalit va iliq xat yotardi.',
      'Жарық қамалда жалаушалар баяу сыңғырлады. Ескі есіктің жанында көк кілт пен жылы хат жатты.',
    ),
    choiceA: localized('Зажечь лампу у галереи', 'Galereya yonidagi chiroqni yoqish', 'Галерея жанындағы шамды жағу'),
    choiceB: localized('Прочитать записку вместе', 'Xatni birga o‘qish', 'Хатты бірге оқу'),
    icons: ['🕯️', '💌'],
  },
  sea_islands: {
    titleOne: localized('Огонёк у маяка', 'Mayak yonidagi chiroq', 'Шамшырақ жанындағы жарық'),
    titleTwo: localized('Ракушка у тихого маяка', 'Sokin mayak yonidagi chig‘anoq', 'Тыныш шамшырақ жанындағы қабыршақ'),
    opening: localized(
      'На тёплом берегу маленький маяк дышал мягким светом. Волны принесли ракушку с двумя подсказками.',
      'Iliq qirg‘oqda kichik mayak mayin nur sochdi. To‘lqinlar ikki ishorali chig‘anoqni olib keldi.',
      'Жылы жағалауда кішкентай шамшырақ жұмсақ жарық шашты. Толқындар екі ишарасы бар қабыршақты әкелді.',
    ),
    choiceA: localized('Зажечь береговой фонарик', 'Qirg‘oq chirog‘ini yoqish', 'Жағалау шамын жағу'),
    choiceB: localized('Собрать ракушки для друзей', 'Do‘stlar uchun chig‘anoqlar yig‘ish', 'Достарға қабыршақ жинау'),
    icons: ['🏝️', '🐚'],
  },
}

const genericOpeningTail = localized(
  'Перед {{HERO}} было два спокойных пути. Рядом ждали друзья, а вокруг оставалось достаточно времени, чтобы подумать и выбрать один из них.',
  '{{HERO}} oldida ikki sokin yo‘l bor edi. Yonida do‘stlari kutib turardi, o‘ylab, ulardan birini tanlash uchun yetarli vaqt bor edi.',
  '{{HERO}} алдында екі тыныш жол тұрды. Қасында достары күтіп тұрды, ойланып, соның бірін таңдауға уақыт жеткілікті еді.',
)

const recurringCharacterLine = (context: NormalizedStoryContext): string => {
  const names = context.recurringCharacters.slice(0, 3).join(', ')
  if (!names) return ''
  if (context.language === 'ru') return `Рядом снова были знакомые друзья: ${names}.`
  if (context.language === 'uz') return `Tanish do‘stlar ham yana shu yerda edi: ${names}.`
  return `Таныс достар да қайтадан осында еді: ${names}.`
}

const identitySafeContinuationText = (context: NormalizedStoryContext): string => {
  const names = context.recurringCharacters.slice(0, 3).join(', ')
  const choiceId = context.choiceHistory.at(-1)?.choice_id ?? ''
  const isChoiceA = choiceId === 'choice-a' || choiceId === 'path_a'
  const branchBeat = context.language === 'ru'
    ? (isChoiceA ? 'Первый результат выбранного действия уже заметен рядом.' : 'Результат другого выбранного действия уже заметен рядом.')
    : context.language === 'uz'
      ? (isChoiceA ? 'Tanlangan ishning birinchi natijasi yonida ko‘rinib turardi.' : 'Boshqa tanlangan ishning natijasi ham yonida ko‘rinib turardi.')
      : (isChoiceA ? 'Таңдалған істің алғашқы нәтижесі қасында көрініп тұрды.' : 'Басқа таңдалған істің нәтижесі де қасында көрініп тұрды.')
  if (context.language === 'ru') {
    return `{{HERO}} продолжает вечернюю историю с того же места. ${branchBeat} ${names ? `Рядом остаются знакомые друзья: ${names}.` : 'Рядом остаются уже знакомые друзья.'} Сделанный несколько минут назад выбор уже дал первый результат, поэтому никто не начинает новое приключение и не меняет общее дело.\n\nДрузья спокойно доводят начатое до конца. Один помогает держать нужную вещь, другой замечает маленькую деталь, а {{HERO}} следит, чтобы никто не спешил. Всё происходит рядом, в знакомом месте, и каждый шаг связан с тем, что уже было начато раньше этим вечером.\n\nКогда главное дело закончено, компания ещё немного остаётся вместе. Друзья проверяют, что всё на месте, тихо радуются результату и убирают лишние вещи. Никакой новой загадки не появляется.\n\n{{HERO}} смотрит на друзей и понимает, что вечер можно завершать. Вокруг становится тише, голоса звучат всё мягче, и знакомое место готовится ко сну. Друзья прощаются до следующей встречи, сохраняя именно ту общую историю, которую уже начали.`
  }
  if (context.language === 'uz') {
    return `{{HERO}} kechki hikoyani aynan to‘xtagan joyidan davom ettirdi. ${branchBeat} ${names ? `Tanish do‘stlar ham shu yerda edi: ${names}.` : 'Oldindan tanish do‘stlar ham shu yerda edi.'} Bir necha daqiqa oldin qilingan tanlov allaqachon natija bera boshlagan, shuning uchun hech kim yangi sarguzasht boshlamadi.\n\nDo‘stlar boshlangan ishni birga va shoshmasdan tugatdi. Biri kerakli narsani ushlab turdi, boshqasi mayda bir detalni ko‘rdi, {{HERO}} esa hamma birga qolishiga e’tibor berdi. Har bir qadam shu oqshom avval boshlangan voqeaga bog‘liq edi.\n\nAsosiy ish tugagach, ular yana bir oz birga qoldi. Hamma narsa joyida ekanini tekshirdi, natijadan sekin quvondi va ortiqcha narsalarni yig‘ishtirdi. Yangi muammo ham, yangi sir ham paydo bo‘lmadi.\n\n{{HERO}} do‘stlariga qarab, oqshomni endi tinch yakunlash mumkinligini bildi. Atrof asta jimidi, ovozlar mayinlashdi. Do‘stlar keyingi uchrashuvgacha xayrlashdi va shu kecha boshlangan tanish hikoya xotirada qoldi.`
  }
  return `{{HERO}} кешкі оқиғаны дәл тоқтаған жерінен жалғастырды. ${branchBeat} ${names ? `Таныс достар да осында еді: ${names}.` : 'Бұрыннан таныс достар да осында еді.'} Бірнеше минут бұрын жасалған таңдау алғашқы нәтижесін берген, сондықтан ешкім жаңа оқиға бастамады.\n\nДостар басталған істі асықпай бірге аяқтады. Біреуі керек затты ұстап тұрды, екіншісі кішкентай бөлшекті байқады, ал {{HERO}} бәрінің бірге болғанын қадағалады. Әр қадам осы кеште бұрын басталған іске байланысты болды.\n\nНегізгі іс біткен соң, олар тағы біраз бірге отырды. Бәрінің орнында екенін тексеріп, нәтижеге тыныш қуанды. Жаңа мәселе де, жаңа жұмбақ та пайда болмады.\n\n{{HERO}} достарына қарап, кешті енді тыныш аяқтауға болатынын түсінді. Айнала біртіндеп тынды, дауыстар бәсеңдеді. Достар келесі кездесуге дейін қоштасып, осы кеште басталған таныс оқиғаны есте сақтады.`
}

const identitySafeContinuationPatch = (context: NormalizedStoryContext): CandidatePatch => {
  const choiceId = context.choiceHistory.at(-1)?.choice_id ?? 'continued_saved_choice'
  return {
    last_event: `continued_${choiceId}`,
    new_friend: null,
    hero_trait: 'kind_and_attentive',
    open_arc: null,
    relationship_updates: [],
    canon_updates: [{ key: 'remembered_choice', value: choiceId }],
  }
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
  const childFirstCandidate = buildChildFirstClosedBetaCandidate(context)
  if (childFirstCandidate) {
    return buildFinalEpisode(context, childFirstCandidate, {
      approved: true,
      risk_level: 'low',
      flags: emptySafetyFlags(),
      required_action: 'fallback',
    })
  }

  const world = worlds[context.stylePackId]
  const language = context.language
  const isForest = context.stylePackId === 'cozy_forest'

  if (context.isContinuation && context.hasSeriesMemory) {
    const candidate: StoryCandidate = {
      title: referenceEpisodeTitle(context, world.titleTwo[language]),
      story_text: identitySafeContinuationText(context),
      choices: [],
      state_patch: identitySafeContinuationPatch(context),
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

  if (context.isContinuation) {
    const choiceId = context.choiceHistory[context.choiceHistory.length - 1]?.choice_id ?? ''
    const continuation = spaceContinuationMemory(context)
      ?? (isForest ? fallbackContinuationMemory(context) : genericEditorialContinuationMemory(context))
    const candidate: StoryCandidate = {
      title: referenceEpisodeTitle(context, world.titleTwo[language]),
      story_text: referenceContinuationStory(context, choiceId, continuation.storyText),
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
    const memory = magicGardenChoiceMemory(context, id)
      ?? spaceBedtimeChoiceMemory(context, id)
      ?? spaceChoiceMemory(context, id)
      ?? (isForest ? fallbackChoiceMemory(context, id, text) : genericEditorialChoiceMemory(context, id, text))
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

  const genericOpening = `${world.opening[language]} ${recurringCharacterLine(context)} ${genericOpeningTail[language]}`.replace(/\s+/gu, ' ').trim()
  const candidate: StoryCandidate = {
    title: referenceEpisodeTitle(context, world.titleOne[language]),
    story_text: referenceEpisodeOneStory(context, genericOpening),
    choices: [
      makeChoice('choice-a', world.choiceA[language], world.icons[0]),
      makeChoice('choice-b', world.choiceB[language], world.icons[1]),
    ],
    state_patch: patch('episode_started', `continue-${context.stylePackId}`),
    vocabulary,
    nextEpisodePreview: context.storyMode === 'series'
      ? (language === 'ru'
          ? 'Сказка продолжится отсюда.'
          : language === 'uz'
            ? 'Hikoya shu joydan davom etadi.'
            : 'Ертегі осы жерден жалғасады.')
      : '',
  }

  return buildFinalEpisode(context, candidate, {
    approved: true,
    risk_level: 'low',
    flags: emptySafetyFlags(),
    required_action: 'fallback',
  })
}
