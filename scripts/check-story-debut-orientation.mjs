import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { storyArchitectEditorialGuidance, storyNarratorEditorialGuidance } from '../supabase/functions/story-generate/editorial-guidance.ts'

// Prompt-contract test only: cannot establish that a real model writes a good story.
// No provider requests, service-role credentials, children, database or story transcripts.
const fresh = { episodeIndex: 1, choiceHistory: [], recurringCharacters: [] }
const returning = { episodeIndex: 1, choiceHistory: [{ choice_id: 'already-confirmed' }], recurringCharacters: ['Yumo'] }
const nextEpisode = { episodeIndex: 2, choiceHistory: [{ choice_id: 'selected' }], recurringCharacters: ['Yumo'] }
const emptyButNamed = { episodeIndex: 1, choiceHistory: [], recurringCharacters: ['Yumo'] }
const architect = storyArchitectEditorialGuidance(fresh)
const narrator = storyNarratorEditorialGuidance(fresh)
for (const fragment of [
  'FIRST ENCOUNTER, NOT EPISODE EIGHT',
  'WHY the hero is in the story location',
  'species',
  'how they meet or why they already know one another',
  'first 40-80 words',
  '60-120 words',
  'new relevant information',
  'equivalent',
  'redesign the ARCHITECT blueprint',
]) assert.ok(architect.includes(fragment), `Architect debut/causality guard absent: ${fragment}`)
for (const fragment of [
  'first encounter for a new listener',
  'who {{HERO}} is',
  'why the hero is here',
  'first mention',
  'do not invent a permanent home',
  'attempt, result, new information, adjustment',
  'does NOT count as a plot beat',
  'Do not pad to 380-420 words',
]) assert.ok(narrator.includes(fragment), `Narrator debut/causality guard absent: ${fragment}`)
for (const established of [returning, emptyButNamed, nextEpisode]) {
  assert.ok(!storyArchitectEditorialGuidance(established).includes('FIRST ENCOUNTER, NOT EPISODE EIGHT'), 'Do not overwrite established canon with first-meeting fiction')
  assert.ok(!storyNarratorEditorialGuidance(established).includes('first encounter for a new listener'), 'Do not repeat origin story for returning characters or E2')
}
assert.ok(architect.includes('one concrete child-scale desire'))
assert.ok(architect.includes('Resolve neither choice before'))
assert.ok(narrator.includes('hard minimum 320'))
assert.ok(narrator.includes('structured choice cards'))
const guidance = readFileSync('supabase/functions/story-generate/editorial-guidance.ts', 'utf8')
assert.ok(guidance.includes('No extra model call, new schema field, provider retry or length hard gate'))
const split = readFileSync('supabase/functions/story-generate/split-openai.ts', 'utf8')
assert.ok(split.includes('storyArchitectEditorialGuidance(context)') && split.includes('storyNarratorEditorialGuidance(context)'), 'New guidance must reach both provider stages')
console.log('QISSA first-story orientation, living cast, causality and returning-canon prompt contract PASS; no paid calls, literary quality unverified.')
