import { readFileSync, writeFileSync } from 'node:fs'
const path = 'supabase/functions/story-generate/safety.ts'
const source = readFileSync(path, 'utf8')
const oldBlock = `export const choiceMenuScaffoldingNeedsRewrite = (language: string, text: string): boolean => {
  const normalized = paragraphs(text).slice(-4).join('\\n').replace(/[\\u2018\\u2019\\u02BB\x60]/g, "'").toLocaleLowerCase()
  // Choice-menu scaffolding is a sentence-level construction. Never synthesize it from
  // separate questions/statements merely because two common modal words occur nearby.
  const sentences = normalized.split(/(?<=[.!?])\\s+|\\n+/u).map((item) => item.trim()).filter(Boolean)
  const patterns: Record<string, RegExp[]> = {
    ru: [/(?<![\\p{L}\\p{M}\\p{N}_])можно(?![\\p{L}\\p{M}\\p{N}_])[\\s\\S]{0,180}(?:(?:а|или)\\s+)(?<![\\p{L}\\p{M}\\p{N}_])можно(?![\\p{L}\\p{M}\\p{N}_])/iu],
    uz: [/(?<![\\p{L}\\p{M}\\p{N}_])mumkin(?![\\p{L}\\p{M}\\p{N}_])[\\s\\S]{0,180}(?:(?:yoki|yana)[\\s\\S]{0,80})(?<![\\p{L}\\p{M}\\p{N}_])mumkin(?![\\p{L}\\p{M}\\p{N}_])/iu],
    kz: [/(?<![\\p{L}\\p{M}\\p{N}_])болады(?![\\p{L}\\p{M}\\p{N}_])[\\s\\S]{0,180}(?:(?:немесе|тағы)[\\s\\S]{0,80})(?<![\\p{L}\\p{M}\\p{N}_])болады(?![\\p{L}\\p{M}\\p{N}_])/iu],
  }
  return sentences.some((sentence) => (patterns[language] ?? []).some((pattern) => pattern.test(sentence)))
}
`
const newBlock = `export const choiceMenuScaffoldingNeedsRewrite = (language: string, text: string): boolean => {
  const normalized = paragraphs(text).slice(-4).join('\\n').replace(/[\\u2018\\u2019\\u02BB\x60]/g, "'").toLocaleLowerCase()
  const sentences = normalized.split(/(?<=[.!?])\\s+|\\n+/u).map((item) => item.trim()).filter(Boolean)
  const sameSentencePatterns: Record<string, RegExp[]> = {
    ru: [/(?<![\\p{L}\\p{M}\\p{N}_])можно(?![\\p{L}\\p{M}\\p{N}_])[\\s\\S]{0,180}(?:(?:а|или)\\s+)(?<![\\p{L}\\p{M}\\p{N}_])можно(?![\\p{L}\\p{M}\\p{N}_])/iu],
    uz: [/(?<![\\p{L}\\p{M}\\p{N}_])mumkin(?![\\p{L}\\p{M}\\p{N}_])[\\s\\S]{0,180}(?:(?:yoki|yana)[\\s\\S]{0,80})(?<![\\p{L}\\p{M}\\p{N}_])mumkin(?![\\p{L}\\p{M}\\p{N}_])/iu],
    kz: [/(?<![\\p{L}\\p{M}\\p{N}_])болады(?![\\p{L}\\p{M}\\p{N}_])[\\s\\S]{0,180}(?:(?:немесе|тағы)[\\s\\S]{0,80})(?<![\\p{L}\\p{M}\\p{N}_])болады(?![\\p{L}\\p{M}\\p{N}_])/iu],
  }
  if (sentences.some((sentence) => (sameSentencePatterns[language] ?? []).some((pattern) => pattern.test(sentence)))) return true

  // Separate sentences count as a menu only when the later sentence explicitly announces
  // another option. Look back at most two sentences so a tiny narrative beat between explicit
  // alternatives ("Можно A. Потом подумал. А можно B.") remains blocked without treating
  // ordinary nearby modal sentences as one menu.
  const modalPattern: Record<string, RegExp> = {
    ru: /(?<![\\p{L}\\p{M}\\p{N}_])можно(?![\\p{L}\\p{M}\\p{N}_])/iu,
    uz: /(?<![\\p{L}\\p{M}\\p{N}_])mumkin(?![\\p{L}\\p{M}\\p{N}_])/iu,
    kz: /(?<![\\p{L}\\p{M}\\p{N}_])болады(?![\\p{L}\\p{M}\\p{N}_])/iu,
  }
  const explicitContinuation: Record<string, RegExp> = {
    ru: /^[\\s«„“”"'—-]*а\\s+можно(?![\\p{L}\\p{M}\\p{N}_])/iu,
    uz: /^[\\s«„“”"'—-]*yana(?![\\p{L}\\p{M}\\p{N}_])[\\s\\S]{0,100}(?<![\\p{L}\\p{M}\\p{N}_])mumkin(?![\\p{L}\\p{M}\\p{N}_])/iu,
    kz: /^[\\s«„“”"'—-]*тағы(?![\\p{L}\\p{M}\\p{N}_])[\\s\\S]{0,100}(?<![\\p{L}\\p{M}\\p{N}_])болады(?![\\p{L}\\p{M}\\p{N}_])/iu,
  }
  const modal = modalPattern[language]
  const continuation = explicitContinuation[language]
  if (!modal || !continuation) return false
  return sentences.some((sentence, index) => {
    if (index === 0 || !continuation.test(sentence)) return false
    return sentences.slice(Math.max(0, index - 2), index).some((previous) => modal.test(previous))
  })
}
`
if (source.split(oldBlock).length !== 2) throw new Error('exact sentence-local choice menu block not found once')
writeFileSync(path, source.replace(oldBlock, newBlock))
console.log('patched explicit cross-sentence alternative handling')
