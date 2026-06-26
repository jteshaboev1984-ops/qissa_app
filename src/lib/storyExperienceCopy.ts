import type { Language } from '../types/qissa'

type CompletionCopy = {
  title: string
  body: string
}

const seriesFinalCopy: Record<Language, CompletionCopy> = {
  ru: {
    title: 'Эта глава завершилась',
    body: 'Герой вернулся в тихое место, а сказочный мир готовится к новой встрече. Эту главу можно прочитать ещё раз или начать другое путешествие.',
  },
  uz: {
    title: 'Bu bob yakunlandi',
    body: 'Qahramon sokin joyga qaytdi, ertak olami esa yangi uchrashuvga tayyorlanmoqda. Bu bobni yana o‘qish yoki boshqa sayohatni boshlash mumkin.',
  },
  kz: {
    title: 'Бұл тарау аяқталды',
    body: 'Кейіпкер тыныш мекенге оралды, ал ертегі әлемі жаңа кездесуге дайындалып жатыр. Бұл тарауды қайта оқуға немесе басқа сапарды бастауға болады.',
  },
}

export const getSeriesFinalCopy = (language: Language): CompletionCopy => seriesFinalCopy[language]
