import type { VoicePreset } from '../types/qissa'

export const voicePresets: VoicePreset[] = [
  { id: 'soft_female', title: { ru: 'Мягкий женский', uz: 'Yumshoq ayol ovozi', kz: 'Жұмсақ әйел дауысы' }, description: { ru: 'Тёплый и нежный голос для спокойного чтения.', uz: 'Tinch o‘qish uchun yumshoq ovoz.', kz: 'Сабырлы оқу үшін жылы дауыс.' }, tone: 'gentle', genderPresentation: 'female', suitableFor: ['bedtime', 'kind_adventure'], isGenderLocked: false },
  { id: 'calm_male', title: { ru: 'Спокойный мужской', uz: 'Sokin erkak ovozi', kz: 'Сабырлы ер дауыс' }, description: { ru: 'Ровный и поддерживающий тембр.', uz: 'Barqaror va qo‘llab-quvvatlovchi tembr.', kz: 'Бірқалыпты және қолдаушы тембр.' }, tone: 'calm', genderPresentation: 'male', suitableFor: ['bedtime', 'kind_adventure'], isGenderLocked: false },
  { id: 'neutral_storyteller', title: { ru: 'Нейтральный рассказчик', uz: 'Neytral hikoyachi', kz: 'Бейтарап баяндаушы' }, description: { ru: 'Сбалансированный универсальный голос.', uz: 'Muvozanatli universal ovoz.', kz: 'Теңгерімді әмбебап дауыс.' }, tone: 'balanced', genderPresentation: 'neutral', suitableFor: ['bedtime', 'kind_adventure'], isGenderLocked: false },
  { id: 'cheerful_daytime', title: { ru: 'Бодрый дневной', uz: 'Quvnoq kunduzgi', kz: 'Көңілді күндізгі' }, description: { ru: 'Более яркий тон для дневного настроения.', uz: 'Kunduzgi kayfiyat uchun yorqinroq ohang.', kz: 'Күндізгі көңіл-күйге жарқын үн.' }, tone: 'bright', genderPresentation: 'neutral', suitableFor: ['kind_adventure'], isGenderLocked: false },
]
