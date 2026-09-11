import { readFileSync } from 'node:fs'

const provider = readFileSync('supabase/functions/story-generate/openai.ts', 'utf8')
const localization = readFileSync('supabase/functions/story-generate/localization.ts', 'utf8')
const contract = readFileSync('docs/qissa/ai/08_STORY_LANGUAGE_LOCALIZATION.md', 'utf8')

const failures = []
const requireText = (label, source, fragments) => {
  for (const fragment of fragments) {
    if (!source.includes(fragment)) failures.push(`${label} is missing: ${fragment}`)
  }
}

requireText('Story provider localization hook', provider, [
  "import { storyLocalizationSystem } from './localization.ts'",
  'const localizedSystem = `${prompts.system} ${storyLocalizationSystem(context)}`',
  'localizedSystem',
])

requireText('Story localization runtime guidance', localization, [
  'The selected language governs narration, dialogue, title, interjections, onomatopoeia',
  'Never rename the selected hero, custom hero name, recurring characters, canon names, remembered objects, or remembered places',
  'Do not insert random English-style or cross-language names',
  'Humor, forms of address, diminutives, interjections, and dialogue rhythm should sound native',
  'Central Asian cultural fit should come from natural relevant details, not decorative stereotypes.',
  "context.language === 'ru'",
  'write all newly created ordinary supporting-character names and nicknames in Cyrillic',
  'Флип, Луми, Спарк, Бадди',
  "context.language === 'uz'",
  'use natural Uzbek in Latin script',
  'Do not mechanically transliterate Russian names or sentence structure.',
  'For Kazakh stories, use natural Kazakh in Cyrillic script.',
])

requireText('Story language localization contract', contract, [
  'A story should feel as though it was originally told in the selected language.',
  'Language controls the whole story surface',
  'Preserve user and memory identity',
  'Russian stories',
  'Uzbek stories',
  'Kazakh stories',
  'Central Asian cultural fit without caricature',
  'World fit still matters',
  'Human review gate',
  'custom/remembered names preserved exactly across sessions',
])

if (failures.length > 0) {
  console.error('Story language localization contract check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Story language localization contract check passed.')
