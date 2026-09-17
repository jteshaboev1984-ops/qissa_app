import { readFileSync, writeFileSync } from 'node:fs'
const path = 'supabase/functions/story-generate/safety.ts'
const source = readFileSync(path, 'utf8')
const oldBlock = `export const choiceMenuScaffoldingNeedsRewrite = (language: string, text: string): boolean => {
  const tail = paragraphs(text).slice(-4).join(' ').replace(/[\\u2018\\u2019\\u02BB\x60]/g, "'").toLocaleLowerCase()
  const patterns: Record<string, RegExp[]> = {
    ru: [/можно[\\s\\S]{0,260}(?:а\\s+можно|или\\s+можно)/iu],
    uz: [/mumkin[\\s\\S]{0,260}(?:yoki[\\s\\S]{0,100}mumkin|yana[\\s\\S]{0,100}mumkin)/iu],
    kz: [/болады[\\s\\S]{0,260}(?:немесе[\\s\\S]{0,100}болады|тағы[\\s\\S]{0,100}болады)/iu],
  }
  return (patterns[language] ?? []).some((pattern) => pattern.test(tail))
}
`
const newBlock = `export const choiceMenuScaffoldingNeedsRewrite = (language: string, text: string): boolean => {
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
if (source.split(oldBlock).length !== 2) throw new Error('exact choiceMenuScaffoldingNeedsRewrite block not found once')
writeFileSync(path, source.replace(oldBlock, newBlock))
console.log('patched sentence-local choice-menu meta predicate')
