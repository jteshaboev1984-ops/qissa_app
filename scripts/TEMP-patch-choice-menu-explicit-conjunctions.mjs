import { readFileSync, writeFileSync } from 'node:fs'
const path = 'supabase/functions/story-generate/safety.ts'
const source = readFileSync(path, 'utf8')
const start = source.indexOf('export const choiceMenuScaffoldingNeedsRewrite =')
const end = source.indexOf('\nexport const episodeTwoUnresolvedDecisionNeedsRewrite', start)
if (start < 0 || end < 0) throw Error('predicate function markers missing')
let block = source.slice(start, end)
const replacements = [
  ['а\\s+можно(?!', '(?:а|или)\\s+можно(?!'],
  ['yana(?![\\p{L}', '(?:yana|yoki)(?![\\p{L}'],
  ['тағы(?![\\p{L}', '(?:тағы|немесе)(?![\\p{L}'],
]
for (const [oldValue, newValue] of replacements) {
  if (block.split(oldValue).length !== 2) throw Error(`expected exact connector once: ${oldValue}`)
  block = block.replace(oldValue, newValue)
}
writeFileSync(path, source.slice(0, start) + block + source.slice(end))
console.log('explicit cross-sentence alternative markers patched in RU/UZ/KZ')
