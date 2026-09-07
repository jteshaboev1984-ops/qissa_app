import type { Language } from '../types/qissa'

export type ListeningCopy = {
  ready: string
  preparing: string
  deviceFallback: string
  aiVoiceDisclosure: string
  showText: string
  hideText: string
  nightMode: string
  exitNightMode: string
  completed: string
  unavailable: string
  error: string
  resumeHint: string
  voiceHint: string
}

export const listeningCopy: Record<Language, ListeningCopy> = {
  ru: {
    ready: 'Озвучка готова. Позиция сохраняется автоматически.',
    preparing: 'Подготавливаем озвучку… Если серверный голос недоступен, QISSA продолжит голосом устройства.',
    deviceFallback: 'Используется голос устройства. Позиция всё равно сохраняется.',
    aiVoiceDisclosure: 'Эта озвучка создана стандартным ИИ-голосом QISSA.',
    showText: 'Показать текст',
    hideText: 'Скрыть текст',
    nightMode: 'Ночной экран',
    exitNightMode: 'Обычный экран',
    completed: 'История дослушана',
    unavailable: 'Сейчас можно читать. Озвучка на этом устройстве недоступна.',
    error: 'Сейчас можно читать. Озвучку попробуем подготовить ещё раз.',
    resumeHint: 'Можно продолжить с сохранённого места.',
    voiceHint: 'Новый голос применяется без повторного онбординга.',
  },
  uz: {
    ready: 'Ovoz tayyor. Tinglash joyi avtomatik saqlanadi.',
    preparing: 'Ovozni tayyorlayapmiz… Server ovozi mavjud bo‘lmasa, QISSA qurilma ovozidan foydalanadi.',
    deviceFallback: 'Qurilma ovozi ishlatilmoqda. Tinglash joyi baribir saqlanadi.',
    aiVoiceDisclosure: 'Bu ovoz QISSA’ning standart AI ovozi yordamida yaratilgan.',
    showText: 'Matnni ko‘rsatish',
    hideText: 'Matnni yashirish',
    nightMode: 'Tungi ekran',
    exitNightMode: 'Oddiy ekran',
    completed: 'Hikoya oxirigacha tinglandi',
    unavailable: 'Hozir hikoyani o‘qish mumkin. Bu qurilmada ovoz mavjud emas.',
    error: 'Hozir hikoyani o‘qish mumkin. Ovozni yana tayyorlashga urinib ko‘ramiz.',
    resumeHint: 'Saqlangan joydan davom ettirish mumkin.',
    voiceHint: 'Yangi ovoz uchun onboardingni qayta o‘tish shart emas.',
  },
  kz: {
    ready: 'Дауыс дайын. Тыңдау орны автоматты түрде сақталады.',
    preparing: 'Дыбыстауды дайындап жатырмыз… Сервер дауысы қолжетімсіз болса, QISSA құрылғы дауысын қолданады.',
    deviceFallback: 'Құрылғы дауысы қолданылып тұр. Тыңдау орны бәрібір сақталады.',
    aiVoiceDisclosure: 'Бұл дыбыстау QISSA-ның стандартты AI дауысы арқылы жасалған.',
    showText: 'Мәтінді көрсету',
    hideText: 'Мәтінді жасыру',
    nightMode: 'Түнгі экран',
    exitNightMode: 'Қалыпты экран',
    completed: 'Оқиға толық тыңдалды',
    unavailable: 'Қазір оқуға болады. Бұл құрылғыда дыбыстау қолжетімсіз.',
    error: 'Қазір оқуға болады. Дыбыстауды кейін қайта дайындап көреміз.',
    resumeHint: 'Сақталған жерден жалғастыруға болады.',
    voiceHint: 'Жаңа дауыс үшін онбордингті қайта өту қажет емес.',
  },
}
