import { readFileSync, writeFileSync } from 'node:fs'
const path = 'supabase/functions/story-generate/safety.ts'
const source = readFileSync(path, 'utf8')
const oldBlock = `const significantChoiceWords = (text: string): Set<string> => new Set(
  (text.toLocaleLowerCase().match(/[\\p{L}\\p{M}]{4,}/gu) ?? [])
    .filter((word) => !choiceMenuStopWords.has(word)),
)

export const textRepeatsStructuredChoiceMenu = (text: string, choices: unknown): boolean => {
  if (!Array.isArray(choices) || choices.length < 2) return false
  const finalParagraph = paragraphs(text).at(-1) ?? ''
  const finalWords = significantChoiceWords(finalParagraph)
  if (finalWords.size < 4) return false

  return choices.every((choice) => {
    if (!isRecord(choice) || typeof choice.text !== 'string') return false
    const choiceWords = significantChoiceWords(choice.text)
    if (choiceWords.size < 3) return false
    const overlap = [...choiceWords].filter((word) => finalWords.has(word)).length
    return overlap >= Math.max(3, Math.ceil(choiceWords.size * 0.35))
  })
}
`
const newBlock = `const significantChoiceWords = (text: string): Set<string> => new Set(
  (text.toLocaleLowerCase().match(/[\\p{L}\\p{M}]{4,}/gu) ?? [])
    .filter((word) => !choiceMenuStopWords.has(word)),
)

const choiceWordEquivalent = (left: string, right: string): boolean => {
  if (left === right) return true
  const minimumLength = Math.min(left.length, right.length)
  if (minimumLength < 6) return false
  let commonPrefix = 0
  while (commonPrefix < minimumLength && left[commonPrefix] === right[commonPrefix]) commonPrefix += 1
  return commonPrefix >= 6 && commonPrefix / minimumLength >= 0.7
}

const setHasEquivalentChoiceWord = (words: Set<string>, target: string): boolean =>
  [...words].some((word) => choiceWordEquivalent(word, target))

export const textRepeatsStructuredChoiceMenu = (text: string, choices: unknown): boolean => {
  if (!Array.isArray(choices) || choices.length < 2) return false
  const finalParagraph = paragraphs(text).at(-1) ?? ''
  const finalWords = significantChoiceWords(finalParagraph)
  if (finalWords.size < 4) return false

  const choiceWordSets: Set<string>[] = []
  for (const choice of choices) {
    if (!isRecord(choice) || typeof choice.text !== 'string') return false
    const words = significantChoiceWords(choice.text)
    if (words.size < 3) return false
    choiceWordSets.push(words)
  }

  // Shared names/context say only that the question is about the same scene. Reject only when
  // the decision point covers the words that distinguish every structured branch. A conservative
  // prefix equivalence tolerates common inflectional endings (e.g. yasashni/yasashmi) without
  // turning arbitrary substring matches into evidence.
  const distinctWordSets = choiceWordSets.map((words, index) => new Set(
    [...words].filter((word) => !choiceWordSets.some((otherWords, otherIndex) =>
      otherIndex !== index && setHasEquivalentChoiceWord(otherWords, word))),
  ))
  if (distinctWordSets.some((words) => words.size === 0)) return false

  return distinctWordSets.every((words) => {
    const covered = [...words].filter((word) => setHasEquivalentChoiceWord(finalWords, word)).length
    return covered >= Math.max(1, Math.ceil(words.size * 0.5))
  })
}
`
if (source.split(oldBlock).length !== 2) throw new Error('exact textRepeatsStructuredChoiceMenu block not found once')
writeFileSync(path, source.replace(oldBlock, newBlock))
console.log('patched branch-distinct choice-menu overlap predicate')
