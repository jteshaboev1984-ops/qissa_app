export type SevenRoadsLanguage = 'ru' | 'uz'

export const sevenRoadsLanguages: SevenRoadsLanguage[] = ['ru', 'uz']

export const sevenRoadsLanguageName: Record<SevenRoadsLanguage, string> = {
  ru: 'Русский',
  uz: 'O‘zbekcha',
}

const ru = {
  worldTitle: 'Королевство семи дорог',
  welcomeHeadline: 'Истории, которые помнят твои решения',
  welcomeBody: 'Читай по сериям, выбирай путь героев — и мир будет помнить твой выбор дальше.',
  start: 'Начать',
  parentLabel: 'Для родителя',
  consentTitle: 'Сохраняем только прогресс чтения',
  consentBody:
    'QISSA сохраняет на этом устройстве, какую серию вы читаете и какие решения ребёнок сделал. Это нужно, чтобы будущие сезоны могли помнить прошлые выборы.',
  consentAccountNote:
    'Аккаунт, email и пароль сейчас не нужны. Их можно будет добавить позже только для синхронизации между устройствами.',
  consentCheckbox:
    'Я родитель или законный представитель и разрешаю сохранять прогресс чтения и решения ребёнка на этом устройстве.',
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
  episodesChoices: '6 серий · 4 решения',
  nextSeasonLater: 'Новый путь откроется позже.',
  home: 'Главная',
  library: 'Библиотека',
  openSeasonPath: 'Путь сезона',
  sixEpisodes: '6 серий',
  seasonDescription:
    'Первый путь Темура и Самиры по Королевству семи дорог. Решения ребёнка сохраняются и смогут проявиться в следующих сезонах.',
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
    'Здесь меняется язык и комфорт чтения. Сюжет и сохранённые решения не меняются без отдельного подтверждения.',
  storyLanguage: 'Язык истории',
  storyLanguageHint:
    'Переключение языка не сбрасывает серию: прогресс и сделанные решения сохраняются.',
  reading: 'Чтение',
  readingHint: 'Эти параметры применяются ко всем сериям Seven Roads на этом устройстве.',
  deviceData: 'Данные на устройстве',
  progressAndChoices: 'Прогресс и решения',
  deviceDataBody:
    'Сейчас QISSA хранит прогресс чтения, позицию в тексте и выборы локально на этом устройстве. Аккаунт и облачная синхронизация пока не используются.',
  restartSeason: 'Начать сезон заново',
  restartSeasonBody:
    'Это удалит текущий прогресс чтения и четыре сделанных выбора для первого сезона на этом устройстве.',
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
    'QISSA запомнит решение. В следующих сказках оно может повлиять на привычки героев и их отношения.',
  confirmChoice: 'Подтвердить выбор',
  choiceSaved: 'Выбор сохранён',
  replayedEpisode: 'Пройденная серия',
  replayedEpisodeBody:
    'Вы открыли эту серию повторно. Текущий прогресс сезона и сохранённые решения не изменились.',
  returnToSeason: 'Вернуться к пути сезона',
  episodeFinishedBody:
    'Можно продолжить путь сейчас или остановиться здесь. Прогресс уже сохранён.',
  nextEpisode: 'Следующая серия',
  finishToday: 'Завершить на сегодня',
  finishSeason: 'Завершить сезон',
  seasonCompleted: 'завершён',
  completionMemory:
    'QISSA запомнила четыре решения. В следующих сезонах они смогут влиять на то, кто первым предложит решение, что герои проверят и насколько легко Темур и Самира будут доверять друг другу.',
  nextSeasonSoon: 'Следующий сезон — скоро',
  backHome: 'На главную',
  replaySeason: 'Пройти сезон заново',
  completionSummary: 'Темур и Самира стали юными бахадурами царства.',
}

const uz = {
  worldTitle: 'Yetti yo‘l qirolligi',
  welcomeHeadline: 'Qarorlaringni eslab qoladigan hikoyalar',
  welcomeBody: 'Qismlab o‘qi, qahramonlar yo‘lini tanla — hikoya olami tanlovingni keyingi voqealarda ham eslab qoladi.',
  start: 'Boshlash',
  parentLabel: 'Ota-ona uchun',
  consentTitle: 'Faqat o‘qish jarayonini saqlaymiz',
  consentBody:
    'QISSA ushbu qurilmada qaysi qismni o‘qiyotganingizni va bola qanday qarorlar qilganini saqlaydi. Bu keyingi mavsumlarda avvalgi tanlovlarni eslab qolish uchun kerak.',
  consentAccountNote:
    'Hozir akkaunt, email yoki parol kerak emas. Keyinroq ular faqat qurilmalar orasida sinxronlash uchun qo‘shilishi mumkin.',
  consentCheckbox:
    'Men ota-ona yoki qonuniy vakilman va ushbu qurilmada o‘qish jarayoni hamda bolaning qarorlarini saqlashga roziman.',
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
  episodesChoices: '6 qism · 4 qaror',
  nextSeasonLater: 'Yangi yo‘l keyinroq ochiladi.',
  home: 'Bosh sahifa',
  library: 'Kutubxona',
  openSeasonPath: 'Mavsum yo‘li',
  sixEpisodes: '6 qism',
  seasonDescription:
    'Temur va Samiraning Yetti yo‘l qirolligidagi ilk safari. Bolaning qarorlari saqlanadi va keyingi mavsumlarda yana namoyon bo‘lishi mumkin.',
  seasonReplayHint:
    'O‘tilgan qismlarni qayta ochish mumkin. Yangi qismlar navbat bilan ochiladi.',
  startSeason: 'Mavsumni boshlash',
  openSeasonResult: 'Mavsum yakunini ochish',
  open: 'Ochish ›',
  begin: 'Boshlash ›',
  continueArrow: 'Davom etish ›',
  ahead: 'Oldinda',
  adultLabel: 'Kattalar uchun',
  settingsIntro:
    'Bu yerda hikoya tili va o‘qish qulayligini o‘zgartirish mumkin. Syujet va saqlangan qarorlar alohida tasdiqsiz o‘zgarmaydi.',
  storyLanguage: 'Hikoya tili',
  storyLanguageHint:
    'Tilni almashtirish mavsumni qayta boshlamaydi: o‘qish jarayoni va tanlovlar saqlanib qoladi.',
  reading: 'O‘qish',
  readingHint: 'Bu sozlamalar ushbu qurilmadagi barcha Seven Roads qismlariga qo‘llanadi.',
  deviceData: 'Qurilmadagi ma’lumotlar',
  progressAndChoices: 'Jarayon va qarorlar',
  deviceDataBody:
    'Hozir QISSA o‘qish jarayoni, matndagi joy va tanlovlarni faqat shu qurilmada saqlaydi. Akkaunt va bulutli sinxronlash hozircha ishlatilmaydi.',
  restartSeason: 'Mavsumni boshidan boshlash',
  restartSeasonBody:
    'Bu ushbu qurilmadagi birinchi mavsumning o‘qish jarayoni va qilingan to‘rtta qarorni o‘chiradi.',
  restartConfirm: 'Ha, boshidan boshlash',
  cancel: 'Bekor qilish',
  resetSeason: 'Mavsum jarayonini tozalash',
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
    'QISSA bu qarorni eslab qoladi. Keyingi hikoyalarda u qahramonlarning odatlari va o‘zaro munosabatlariga ta’sir qilishi mumkin.',
  confirmChoice: 'Tanlovni tasdiqlash',
  choiceSaved: 'Tanlov saqlandi',
  replayedEpisode: 'O‘tilgan qism',
  replayedEpisodeBody:
    'Bu qismni qayta ochdingiz. Mavsumdagi joriy jarayon va saqlangan qarorlar o‘zgarmadi.',
  returnToSeason: 'Mavsum yo‘liga qaytish',
  episodeFinishedBody:
    'Yo‘lni hozir davom ettirish yoki shu yerda to‘xtash mumkin. Jarayon allaqachon saqlandi.',
  nextEpisode: 'Keyingi qism',
  finishToday: 'Buguncha yakunlash',
  finishSeason: 'Mavsumni yakunlash',
  seasonCompleted: 'yakunlandi',
  completionMemory:
    'QISSA to‘rtta qarorni eslab qoldi. Keyingi mavsumlarda ular kim birinchi bo‘lib yechim taklif qilishiga, qahramonlar nimani tekshirishiga va Temur bilan Samiraning bir-biriga qanchalik oson ishonishiga ta’sir qilishi mumkin.',
  nextSeasonSoon: 'Keyingi mavsum — tez orada',
  backHome: 'Bosh sahifaga',
  replaySeason: 'Mavsumni qayta o‘tish',
  completionSummary: 'Temur va Samira qirollikning yosh bahodirlariga aylanishdi.',
}

export type SevenRoadsCopy = typeof ru

export const getSevenRoadsCopy = (language: SevenRoadsLanguage): SevenRoadsCopy =>
  language === 'uz' ? uz : ru
