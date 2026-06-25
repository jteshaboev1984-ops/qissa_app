import type { Language } from '../types/qissa'

export type ListeningCopy = {
  ready: string
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
