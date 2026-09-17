import { readFileSync, writeFileSync } from 'node:fs'
const path = 'supabase/functions/story-generate/safety.ts'
const original = readFileSync(path, 'utf8')
const startMark = 'export const choiceMenuScaffoldingNeedsRewrite = (language: string, text: string): boolean => {'
const endMark = '\nexport const episodeTwoUnresolvedDecisionNeedsRewrite = ('
const start = original.indexOf(startMark)
const end = original.indexOf(endMark, start)
if (start < 0 || end < 0 || original.indexOf(startMark, start + 1) >= 0) throw Error('choice menu function boundary mismatch')
const oldBlock = original.slice(start, end)
const oldStart = '  const patterns: Record<string, RegExp[]> = {'
const oldReturn = '  return sentences.some((sentence) => (patterns[language] ?? []).some((pattern) => pattern.test(sentence)))'
if (!oldBlock.includes(oldStart) || !oldBlock.includes(oldReturn)) throw Error('unexpected original predicate; stop without writing')
let replacement = oldBlock.replace(oldStart, '  const sameSentencePatterns: Record<string, RegExp[]> = {')
replacement = replacement.replace(oldReturn, String.raw`  if (sentences.some((sentence) => (sameSentencePatterns[language] ?? []).some((pattern) => pattern.test(sentence)))) return true

  // A preceding modal only forms a cross-sentence choice menu when a later sentence
  // explicitly announces an alternative. One brief narrative beat may intervene.
  const modalPattern: Record<string, RegExp> = {
    ru: /(?<![\p{L}\p{M}\p{N}_])можно(?![\p{L}\p{M}\p{N}_])/iu,
    uz: /(?<![\p{L}\p{M}\p{N}_])mumkin(?![\p{L}\p{M}\p{N}_])/iu,
    kz: /(?<![\p{L}\p{M}\p{N}_])болады(?![\p{L}\p{M}\p{N}_])/iu,
  }
  const explicitContinuation: Record<string, RegExp> = {
    ru: /^[\s«„“”"'—-]*а\s+можно(?![\p{L}\p{M}\p{N}_])/iu,
    uz: /^[\s«„“”"'—-]*yana(?![\p{L}\p{M}\p{N}_])[\s\S]{0,100}(?<![\p{L}\p{M}\p{N}_])mumkin(?![\p{L}\p{M}\p{N}_])/iu,
    kz: /^[\s«„“”"'—-]*тағы(?![\p{L}\p{M}\p{N}_])[\s\S]{0,100}(?<![\p{L}\p{M}\p{N}_])болады(?![\p{L}\p{M}\p{N}_])/iu,
  }
  const modal = modalPattern[language]
  const continuation = explicitContinuation[language]
  if (!modal || !continuation) return false
  return sentences.some((sentence, index) => {
    if (!continuation.test(sentence)) return false
    if (index > 0 && modal.test(sentences[index - 1])) return true
    const intervening = sentences[index - 1] ?? ''
    return index > 1 && intervening.length <= 80 && !intervening.includes('?') &&
      !modal.test(intervening) && modal.test(sentences[index - 2])
  })`)
const updated = original.slice(0, start) + replacement + original.slice(end)
if (updated === original) throw Error('source patch did not change content')
writeFileSync(path, updated)
console.log('patched explicit alternatives with one short narrative beat')
