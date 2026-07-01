import { readFileSync } from 'node:fs'

const pack = readFileSync('supabase/functions/story-generate/storySpaceBedtime.ts', 'utf8')
const memory = readFileSync('supabase/functions/story-generate/storySpaceBedtimeMemory.ts', 'utf8')
const reference = readFileSync('supabase/functions/story-generate/storyCoreReference.ts', 'utf8')
const fallback = readFileSync('supabase/functions/story-generate/fallback.ts', 'utf8')

const wordCount = (text) => text.trim().split(/\s+/u).filter(Boolean).length
const templates = [...pack.matchAll(/`([\s\S]*?)`/g)].map((match) => match[1])

if (templates.length < 6) {
  throw new Error('Cosmos bedtime pack must include RU/UZ episode one and two continuations.')
}

const [episodeOneRu, episodeOneUz, ruA, ruB, uzA, uzB] = templates

const storyParts = [
  ['episodeOneRu', episodeOneRu],
  ['episodeOneUz', episodeOneUz],
  ['ruA', ruA],
  ['ruB', ruB],
  ['uzA', uzA],
  ['uzB', uzB],
]

for (const [label, text] of storyParts) {
  if (!text.includes('{{HERO}}')) {
    throw new Error(`Cosmos ${label} must keep hero personalization.`)
  }
  if (wordCount(text) < 180) {
    throw new Error(`Cosmos ${label} is too short for Bedtime Session v1.`)
  }
}

const uzOnlyText = [episodeOneUz, uzA, uzB].join('\n')
if (/[А-Яа-яЁё]/u.test(uzOnlyText)) {
  throw new Error('Cosmos UZ bedtime pack must not contain Cyrillic text.')
}

if (!reference.includes('spaceBedtimeEpisodeOne[spaceLanguage]')) {
  throw new Error('Cosmos Episode 1 is not routed.')
}

if (!reference.includes('spaceBedtimeContinuation[spaceLanguage][branch]')) {
  throw new Error('Cosmos continuations are not routed.')
}

if (!fallback.includes('spaceBedtimeChoiceMemory(context, id)')) {
  throw new Error('Cosmos memory bridge must run before old space fallback memory.')
}

if (!memory.includes('Uchta oltin shu’la')) {
  throw new Error('Cosmos UZ beacon memory bridge is missing.')
}

if (!memory.includes('Yulduz qushi atlasda qoladi')) {
  throw new Error('Cosmos UZ constellation memory bridge is missing.')
}

console.log('cosmos bedtime check passed.')
