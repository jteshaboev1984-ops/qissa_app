import { dictionaries, type I18nKey } from '../i18n/dictionaries'
import type { Language } from '../types/qissa'

export const t = (language: Language, key: I18nKey): string => dictionaries[language][key]
