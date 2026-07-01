import { readFileSync } from 'node:fs'

const fallback = readFileSync('supabase/functions/story-generate/fallback.ts', 'utf8')
const memory = readFileSync('supabase/functions/story-generate/storyMagicGardenMemory.ts', 'utf8')
const i18n = readFileSync('src/lib/i18n.ts', 'utf8')

if (!fallback.includes('magicGardenChoiceMemory(context, id)')) {
  throw new Error('Magic Garden choice memory must run before generic fallback memory.')
}

if (!memory.includes('Gulbargli yo‘lakda ko‘k tomchilar')) {
  throw new Error('Magic Garden UZ water branch must include a story-like memory scene.')
}

if (!memory.includes('Yorug‘ zanjir favvora yonida qoladi')) {
  throw new Error('Magic Garden UZ light branch must include a story-like memory scene.')
}

if (!i18n.includes('Hikoya shu joydan davom etadi')) {
  throw new Error('Immediate continuation label must not sound like tomorrow-only flow.')
}

console.log('bedtime session polish check passed.')
