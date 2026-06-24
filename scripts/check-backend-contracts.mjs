import { readFileSync } from 'node:fs'

const contractSource = readFileSync('src/contracts/storyContracts.ts', 'utf8')
const schema = readFileSync('docs/qissa/backend/schema_draft.sql', 'utf8')
const api = readFileSync('docs/qissa/backend/02_API_CONTRACTS.md', 'utf8')
const migration = readFileSync('supabase/migrations/20260624_000001_qissa_mvp_contract_parity.sql', 'utf8')

const failures = []

const requireValues = (label, source, values) => {
  for (const value of values) {
    if (!source.includes(`'${value}'`)) failures.push(`${label} is missing ${value}`)
  }
}

const ageGroups = ['3-4', '5-7', '8-9']
const deprecatedAgeGroups = ['3-5', '6-8', '9-10']
const languages = ['ru', 'uz', 'kz']
const modes = ['one_time', 'series']
const moods = ['bedtime', 'kind_adventure']
const stylePacks = [
  'cozy_forest',
  'magic_garden',
  'brave_adventure',
  'stars_and_space',
  'silk_road',
  'animal_world',
  'castle_mystery',
  'sea_islands',
]

for (const [label, source] of [
  ['story contracts', contractSource],
  ['schema draft', schema],
  ['API contracts', api],
  ['migration', migration],
]) {
  requireValues(label, source, ageGroups)
  requireValues(label, source, languages)
  requireValues(label, source, modes)
  requireValues(label, source, moods)
  requireValues(label, source, stylePacks)
}

for (const value of deprecatedAgeGroups) {
  for (const [label, source] of [
    ['schema draft', schema],
    ['API contracts', api],
    ['migration', migration],
  ]) {
    if (source.includes(`'${value}'`)) failures.push(`${label} still contains deprecated age group ${value}`)
  }
}

for (const field of ['resolution_text', 'tomorrow_seed', 'choice_icon']) {
  if (!contractSource.includes(field)) failures.push(`story contracts are missing ${field}`)
  if (!schema.includes(field)) failures.push(`schema draft is missing ${field}`)
  if (!api.includes(field)) failures.push(`API contracts are missing ${field}`)
  if (!migration.includes(field)) failures.push(`migration is missing ${field}`)
}

for (const phrase of [
  'story_sessions.id',
  'Episode.series_id',
  'story_episodes.id',
  'Episode.episode_id',
  'story_choices.choice_id',
  'EpisodeChoice.choice_id',
]) {
  if (!api.includes(phrase)) failures.push(`API contracts are missing ID mapping: ${phrase}`)
}

if (failures.length > 0) {
  console.error('backend contract parity check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('backend contract parity check passed.')
