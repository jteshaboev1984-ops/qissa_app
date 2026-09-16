import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { storyArchitectEditorialGuidance, storyNarratorEditorialGuidance } from '../supabase/functions/story-generate/editorial-guidance.ts'

// Provider-free source contract only. These assertions ensure the instructions
// reach both generation stages; they cannot certify a model's semantic output.
const e1 = { episodeIndex: 1 }
const e2 = { episodeIndex: 2 }
const architectE1 = storyArchitectEditorialGuidance(e1)
const narratorE1 = storyNarratorEditorialGuidance(e1)
const architectE2 = storyArchitectEditorialGuidance(e2)
const narratorE2 = storyNarratorEditorialGuidance(e2)
const split = readFileSync('supabase/functions/story-generate/split-openai.ts', 'utf8')

for (const [stage, prompt, markers] of [
  ['Architect E1', architectE1, [
    'Counterfactual pre-choice check',
    'remove both choice cards and their bridges',
    'central goal is already achieved',
    'quiet singer',
    'ordinary kindness',
  ]],
  ['Narrator E1', narratorE1, [
    'Counterfactual pre-choice check',
    'remove both choice cards and their bridges',
    'main goal has already been completed',
    'immutable blueprint',
    'do not invent a new obstacle',
  ]],
]) {
  for (const marker of markers) {
    assert.ok(prompt.includes(marker), `${stage} is missing causal safeguard: ${marker}`)
  }
}

assert.ok(!architectE2.includes('Counterfactual pre-choice check'), 'E1-only checkpoint must not leak into Architect E2')
assert.ok(!narratorE2.includes('Counterfactual pre-choice check'), 'E1-only checkpoint must not leak into Narrator E2')
assert.ok(split.includes('storyArchitectEditorialGuidance(context)'), 'Architect guidance must be sent to the provider')
assert.ok(split.includes('storyNarratorEditorialGuidance(context)'), 'Narrator guidance must be sent to the provider')
assert.ok(architectE1.includes('Resolve neither choice before'), 'Prior branch-neutrality protection must remain')
assert.ok(narratorE1.includes('Neither action has happened before selection'), 'Prior no-preplay protection must remain')
assert.ok(narratorE2.includes('selected resolution_text has already been read'), 'Post-choice continuation must stay after the bridge')

console.log('Provider-free pre-choice causal guidance contract PASS. No generated prose, semantic gate, provider request or beta approval is claimed.')
