import { dictionaries, type I18nKey } from '../i18n/dictionaries'
import type { Language } from '../types/qissa'

const editorialOverrides: Partial<Record<I18nKey, Record<Language, string>>> = {
  'story.preview_tomorrow': {
    ru: 'Продолжить сказку',
    uz: 'Hikoyani davom ettirish',
    kz: 'Ертегіні жалғастыру',
  },
  'story.series_final_title': {
    ru: 'Эта глава завершилась',
    uz: 'Bu bob yakunlandi',
    kz: 'Бұл тарау аяқталды',
  },
  'story.series_final_body': {
    ru: 'Герой вернулся в тихое место, а сказочный мир готовится к новой встрече. Эту главу можно прочитать ещё раз или начать другое путешествие.',
    uz: 'Qahramon sokin joyga qaytdi, ertak olami esa yangi uchrashuvga tayyorlanmoqda. Bu bobni yana o‘qish yoki boshqa sayohatni boshlash mumkin.',
    kz: 'Кейіпкер тыныш мекенге оралды, ал ертегі әлемі жаңа кездесуге дайындалып жатыр. Бұл тарауды қайта оқуға немесе басқа сапарды бастауға болады.',
  },
  'home.completed_series_title': {
    ru: 'Эта глава завершилась',
    uz: 'Bu bob yakunlandi',
    kz: 'Бұл тарау аяқталды',
  },
  'home.completed_series_body': {
    ru: 'Герой вернулся в тихое место, а сказочный мир готовится к новой встрече. Можно перечитать эту главу или начать другое путешествие.',
    uz: 'Qahramon sokin joyga qaytdi, ertak olami esa yangi uchrashuvga tayyorlanmoqda. Bu bobni yana o‘qish yoki boshqa sayohatni boshlash mumkin.',
    kz: 'Кейіпкер тыныш мекенге оралды, ал ертегі әлемі жаңа кездесуге дайындалып жатыр. Бұл тарауды қайта оқуға немесе басқа сапарды бастауға болады.',
  },
  'story.world_remembers': {
    ru: 'Сказка продолжится отсюда.',
    uz: 'Hikoya shu yerdan davom etadi.',
    kz: 'Ертегі осы жерден жалғасады.',
  },
  'story.next_episode_hint': {
    ru: 'Этот знак появится в следующей главе.',
    uz: 'Bu belgi keyingi bobda yana paydo bo‘ladi.',
    kz: 'Бұл белгі келесі тарауда қайта көрінеді.',
  },
  'home.tomorrow_memory_body': {
    ru: 'В прошлой главе герой оставил важный знак. Сегодня сказка продолжится с него.',
    uz: 'Oldingi bobda qahramon muhim belgi qoldirdi. Bugun ertak shu yerdan davom etadi.',
    kz: 'Алдыңғы тарауда кейіпкер маңызды белгі қалдырды. Бүгін ертегі сол жерден жалғасады.',
  },
}

export const t = (language: Language, key: I18nKey): string =>
  editorialOverrides[key]?.[language] ?? dictionaries[language][key]
