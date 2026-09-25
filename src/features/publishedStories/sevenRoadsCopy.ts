export type SevenRoadsLanguage = 'ru' | 'uz'

export const sevenRoadsLanguages: SevenRoadsLanguage[] = ['ru', 'uz']

export const sevenRoadsLanguageName: Record<SevenRoadsLanguage, string> = {
  ru: 'Русский',
  uz: 'O‘zbekcha',
}

const ru = {
  worldTitle: 'Королевство семи дорог',
  welcomeHeadline: 'Истории, которые помнят твой выбор',
  welcomeBody: 'Читай по сериям, выбирай путь героев — и мир будет помнить твой выбор дальше.',
  start: 'Начать',
  parentLabel: 'Для родителя',
  consentTitle: 'Сохраняем прогресс и настройки на этом устройстве',
  consentBody:
    'QISSA сохраняет на этом устройстве прогресс чтения, выборы ребёнка, язык, настройки чтения и открытые сцены. Это нужно, чтобы продолжать с того же места и чтобы будущие сезоны могли помнить прошлые выборы.',
  consentAccountNote:
    'Аккаунт, email и пароль сейчас не нужны. Их можно будет добавить позже только для синхронизации между устройствами.',
  consentCheckbox:
    'Я родитель или законный представитель и разрешаю сохранять эти данные на этом устройстве.',
  continue: 'Продолжить',
  back: 'Назад',
  settings: 'Настройки',
  seasons: 'Сезоны',
  season: 'Сезон',
  episode: 'Серия',
  episodeLower: 'серия',
  newSeason: 'Новый сезон',
  completed: 'Завершён',
  soon: 'Скоро',
  nextRoad: 'Следующая дорога',
  collection: 'Коллекция',
  libraryBody: 'Истории, сезоны и сохранённый путь.',
  episodesChoices: '6 серий · 4 выбора',
  nextSeasonLater: 'Новый путь откроется позже.',
  home: 'Главная',
  library: 'Библиотека',
  openSeasonPath: 'Путь сезона',
  sixEpisodes: '6 серий',
  seasonDescription:
    'Первый путь Темура и Самиры по Королевству семи дорог. Выборы ребёнка сохраняются и смогут влиять на события следующих сезонов.',
  seasonReplayHint:
    'Пройденные серии можно открыть снова. Новые серии открываются по порядку.',
  startSeason: 'Начать сезон',
  openSeasonResult: 'Открыть итог сезона',
  open: 'Открыть ›',
  begin: 'Начать ›',
  continueArrow: 'Продолжить ›',
  ahead: 'Впереди',
  adultLabel: 'Для взрослого',
  settingsIntro:
    'Здесь меняется язык и комфорт чтения. Сюжет и сохранённые выборы не меняются без отдельного подтверждения.',
  storyLanguage: 'Язык истории',
  storyLanguageHint:
    'Переключение языка не сбрасывает серию: прогресс и сделанные выборы сохраняются.',
  reading: 'Чтение',
  readingHint: 'Эти параметры применяются ко всем сериям «Королевства семи дорог» на этом устройстве.',
  deviceData: 'Данные на устройстве',
  progressAndChoices: 'Прогресс и выборы',
  deviceDataBody:
    'Сейчас QISSA хранит прогресс чтения, позицию в тексте и выборы локально на этом устройстве. Аккаунт и облачная синхронизация пока не используются.',
  restartSeason: 'Начать сезон заново',
  restartSeasonBody:
    'Это удалит текущий прогресс чтения и сделанные выборы первого сезона на этом устройстве.',
  restartConfirm: 'Да, начать заново',
  cancel: 'Отмена',
  resetSeason: 'Сбросить прогресс сезона',
  close: 'Закрыть',
  readerSettings: 'Настройки чтения',
  openFullscreen: 'Открыть сцену на весь экран',
  imageTapHint:
    'Нажмите на сцену, чтобы рассмотреть её на весь экран. Коснитесь экрана ещё раз, чтобы вернуться.',
  illustrationPending: 'Сцена готовится',
  closeFullscreen: 'Закрыть сцену',
  tapToReturn: 'Коснитесь экрана, чтобы вернуться',
  yourChoice: 'Твой выбор',
  choiceMemoryHint:
    'QISSA запомнит этот выбор. В следующих сказках он может повлиять на привычки героев и их отношения.',
  confirmChoice: 'Подтвердить выбор',
  choiceSaved: 'Выбор сохранён',
  replayedEpisode: 'Пройденная серия',
  replayedEpisodeBody:
    'Эта серия открыта повторно. Текущий прогресс сезона и сохранённые выборы не изменились.',
  returnToSeason: 'Вернуться к пути сезона',
  episodeFinishedBody:
    'Можно продолжить путь сейчас или остановиться здесь. Прогресс уже сохранён.',
  nextEpisode: 'Следующая серия',
  finishToday: 'Завершить на сегодня',
  finishSeason: 'Завершить сезон',
  seasonCompleted: 'завершён',
  completionMemory:
    'QISSA запомнила четыре выбора. В следующих сезонах они смогут влиять на то, кто первым предложит решение, что герои проверят и насколько легко Темур и Самира будут доверять друг другу.',
  nextSeasonSoon: 'Следующий сезон — скоро',
  backHome: 'На главную',
  replaySeason: 'Пройти сезон заново',
  completionSummary: 'Темур и Самира стали юными бахадурами царства.',
}

const uz = {
  worldTitle: 'Yetti yo‘l qirolligi',
  welcomeHeadline: 'Tanlovlaringni eslab qoladigan hikoyalar',
  welcomeBody: 'Qismma-qism o‘qi, qahramonlar yo‘lini tanla — hikoya olami tanlovingni keyingi voqealarda ham eslab qoladi.',
  start: 'Boshlash',
  parentLabel: 'Ota-ona uchun',
  consentTitle: 'Ma’lumotlar shu qurilmada saqlanadi',
  consentBody:
    'QISSA shu qurilmada qayergacha o‘qilganini, bolaning tanlovlarini, til va o‘qish sozlamalarini hamda ochilgan lavhalarni saqlaydi. Shuning uchun hikoyani keyin o‘sha joydan davom ettirish mumkin, keyingi mavsumlar esa oldingi tanlovlarni eslab qoladi.',
  consentAccountNote:
    'Hozir akkaunt, email yoki parol kerak emas. Keyinchalik ular faqat qurilmalar o‘rtasida sinxronlash uchun kerak bo‘lishi mumkin.',
  consentCheckbox:
    'Men ota-ona yoki qonuniy vakilman va ushbu ma’lumotlarni shu qurilmada saqlashga roziman.',
  continue: 'Davom etish',
  back: 'Orqaga',
  settings: 'Sozlamalar',
  seasons: 'Mavsumlar',
  season: 'Mavsum',
  episode: 'Qism',
  episodeLower: 'qism',
  newSeason: 'Yangi mavsum',
  completed: 'Yakunlangan',
  soon: 'Tez orada',
  nextRoad: 'Keyingi yo‘l',
  collection: 'To‘plam',
  libraryBody: 'Hikoyalar, mavsumlar va saqlangan yo‘l.',
  episodesChoices: '6 qism · 4 tanlov',
  nextSeasonLater: 'Yangi yo‘l keyinroq ochiladi.',
  home: 'Bosh sahifa',
  library: 'Kutubxona',
  openSeasonPath: 'Mavsum qismlari',
  sixEpisodes: '6 qism',
  seasonDescription:
    'Temur va Samiraning Yetti yo‘l qirolligidagi ilk safari. Bolaning tanlovlari saqlanadi va keyingi mavsumlarda voqealarga ta’sir qilishi mumkin.',
  seasonReplayHint:
    'O‘qilgan qismlarni qayta ochish mumkin. Yangi qismlar navbati bilan ochiladi.',
  startSeason: 'Mavsumni boshlash',
  openSeasonResult: 'Mavsum yakunini ko‘rish',
  open: 'Ochish ›',
  begin: 'Boshlash ›',
  continueArrow: 'Davom etish ›',
  ahead: 'Oldinda',
  adultLabel: 'Kattalar uchun',
  settingsIntro:
    'Bu yerda hikoya tilini va o‘qish sozlamalarini o‘zgartirish mumkin. Syujet va saqlangan tanlovlar faqat alohida tasdiq bilan o‘zgaradi.',
  storyLanguage: 'Hikoya tili',
  storyLanguageHint:
    'Tilni almashtirsangiz ham, o‘qigan joyingiz va tanlovlaringiz saqlanadi.',
  reading: 'O‘qish',
  readingHint: 'Bu sozlamalar shu qurilmadagi “Yetti yo‘l qirolligi”ning barcha qismlariga qo‘llanadi.',
  deviceData: 'Qurilmadagi ma’lumotlar',
  progressAndChoices: 'O‘qilgan joy va tanlovlar',
  deviceDataBody:
    'Hozir QISSA o‘qilgan qismni, matndagi joyni va tanlovlarni faqat shu qurilmada saqlaydi. Akkaunt va bulutli sinxronlash hozircha ishlatilmaydi.',
  restartSeason: 'Mavsumni boshidan boshlash',
  restartSeasonBody:
    'Bu shu qurilmada saqlangan 1-mavsumdagi o‘qilgan joy va tanlovlarni o‘chiradi.',
  restartConfirm: 'Ha, boshidan boshlash',
  cancel: 'Bekor qilish',
  resetSeason: 'Mavsumni boshidan boshlash',
  close: 'Yopish',
  readerSettings: 'O‘qish sozlamalari',
  openFullscreen: 'Lavhani to‘liq ekranda ochish',
  imageTapHint:
    'Lavhani to‘liq ekranda ko‘rish uchun ustiga bosing. Qaytish uchun ekranga yana bir marta teging.',
  illustrationPending: 'Lavha tayyorlanmoqda',
  closeFullscreen: 'Lavhani yopish',
  tapToReturn: 'Qaytish uchun ekranga teging',
  yourChoice: 'Sening tanloving',
  choiceMemoryHint:
    'QISSA bu tanlovni eslab qoladi. Bu tanlov keyingi hikoyalarda qahramonlarning odatlari va o‘zaro munosabatlariga ta’sir qilishi mumkin.',
  confirmChoice: 'Tanlovni tasdiqlash',
  choiceSaved: 'Tanlov saqlandi',
  replayedEpisode: 'Oldin o‘qilgan qism',
  replayedEpisodeBody:
    'Bu qism qayta ochildi. Mavsumdagi o‘qilgan joy va saqlangan tanlovlar o‘zgarmaydi.',
  returnToSeason: 'Mavsumga qaytish',
  episodeFinishedBody:
    'Hozir davom etishing yoki shu yerda to‘xtashing mumkin. O‘qigan joying saqlandi.',
  nextEpisode: 'Keyingi qismga o‘tish',
  finishToday: 'Hozircha to‘xtash',
  finishSeason: 'Mavsumni tugatish',
  seasonCompleted: 'tugadi',
  completionMemory:
    'QISSA to‘rtta tanlovni eslab qoldi. Keyingi mavsumlarda ular kim birinchi bo‘lib yechim taklif qilishiga, qahramonlar nimani tekshirishiga va Temur bilan Samiraning bir-biriga qanchalik oson ishonishiga ta’sir qilishi mumkin.',
  nextSeasonSoon: 'Keyingi mavsum — tez orada',
  backHome: 'Bosh sahifaga',
  replaySeason: 'Mavsumni boshidan o‘qish',
  completionSummary: 'Temur va Samira qirollikning yosh bahodirlariga aylanishdi.',
}

export const formatSevenRoadsSeasonLabel = (
  language: SevenRoadsLanguage,
  seasonNumber: number,
) => language === 'uz' ? `${seasonNumber}-mavsum` : `Сезон ${seasonNumber}`

export const formatSevenRoadsEpisodeLabel = (
  language: SevenRoadsLanguage,
  episodeNumber: number,
) => language === 'uz' ? `${episodeNumber}-qism` : `Серия ${episodeNumber}`

export const formatSevenRoadsEpisodeProgress = (
  language: SevenRoadsLanguage,
  episodeNumber: number,
  total: number,
) => language === 'uz'
  ? `${episodeNumber}-qism / ${total}`
  : `Серия ${episodeNumber} / ${total}`

export const formatSevenRoadsSeasonEpisodeContext = (
  language: SevenRoadsLanguage,
  seasonNumber: number,
  episodeNumber: number,
  total?: number,
) => {
  if (language === 'uz') {
    return `${seasonNumber}-mavsum · ${episodeNumber}-qism${total ? ` / ${total}` : ''}`
  }

  return `Сезон ${seasonNumber} · серия ${episodeNumber}${total ? ` / ${total}` : ''}`
}

export const formatSevenRoadsEpisodeCompleted = (
  language: SevenRoadsLanguage,
  episodeNumber: number,
) => language === 'uz' ? `${episodeNumber}-qism tugadi` : `Серия ${episodeNumber} завершена`

export const formatSevenRoadsSeasonCompleted = (
  language: SevenRoadsLanguage,
  seasonNumber: number,
) => language === 'uz' ? `${seasonNumber}-mavsum tugadi` : `Сезон ${seasonNumber} завершён`

export type SevenRoadsCopy = typeof ru

export const getSevenRoadsCopy = (language: SevenRoadsLanguage): SevenRoadsCopy =>
  language === 'uz' ? uz : ru
