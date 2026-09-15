export type StoryLanguage = 'ru' | 'uz' | 'kz'

const stripMachineTokens = (value: string): string => value
  .replace(/\{\{HERO\}\}/gu, ' ')
  .replace(/QISSA_HERO/gu, ' ')
  .replace(/\bQISSA\b/gu, ' ')

const wordCount = (value: string): number => value.trim().split(/\s+/u).filter(Boolean).length

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')

const stripAllowedForeignTerms = (value: string, allowedTerms: string[]): string => {
  let result = value
  for (const term of allowedTerms) {
    const normalized = term.trim()
    if (!normalized) continue
    result = result.replace(new RegExp(escapeRegExp(normalized), 'gu'), ' ')
  }
  return result
}

export const hasSingleLanguageMismatch = (
  language: StoryLanguage,
  values: string[],
  allowedForeignTerms: string[] = [],
): boolean => {
  const text = stripMachineTokens(stripAllowedForeignTerms(values.filter(Boolean).join(' '), allowedForeignTerms))
  if (!text.trim()) return false

  const latinWords = text.match(/\b[A-Za-z]{2,}\b/gu) ?? []
  const hasCyrillic = /[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/u.test(text)
  const kazakhSpecificCount = (text.match(/[ӘәҒғҚқҢңӨөҰұҮүҺһІі]/gu) ?? []).length
  const words = wordCount(text)

  if (language === 'ru') {
    return latinWords.length > 0 || kazakhSpecificCount > 0
  }
  if (language === 'uz') {
    return hasCyrillic || (words >= 20 && !/[A-Za-z]/u.test(text))
  }
  return latinWords.length > 0 || (words >= 40 && kazakhSpecificCount < 2)
}
