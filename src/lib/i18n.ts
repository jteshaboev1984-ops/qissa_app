import { dictionaries, type I18nKey } from '../i18n/dictionaries'
import { storyQualityCopy } from '../i18n/storyQualityCopy'
import type { Language } from '../types/qissa'

export const t = (language: Language, key: I18nKey): string => {
  const override = storyQualityCopy[language]?.[key]
  return override ?? dictionaries[language][key]
}
