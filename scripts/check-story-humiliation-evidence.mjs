import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { locateHumiliationEvidence } from '../supabase/functions/story-generate/humiliation-evidence.ts'
import { combineSafety } from '../supabase/functions/story-generate/safety.ts'
import { emptySafetyFlags } from '../supabase/functions/story-generate/contracts.ts'

const candidate = {
  title: 'Do‘stlar bilan',
  story_text: '{{HERO}} bilan qushlar o‘ynadi. Qushning xatosidan hamma uning ustidan kuldi.',
  choices: [
    { text: 'Do‘stga yordam', effect_summary: 'Hamma do‘stiga yordam berdi.', resolution_text: 'Ular birga masalani hal qildi.' },
    { text: 'Birga yurish', effect_summary: 'Hamma birga yurdi.', resolution_text: 'Ular yo‘l bo‘ylab birga yurdi.' },
  ],
  vocabulary: [], nextEpisodePreview: 'Ertaga ular yana uchrashadi.',
}
const flagged = (notes, humiliation = true) => ({
  approved: !humiliation,
  risk_level: humiliation ? 'medium' : 'low',
  flags: { ...emptySafetyFlags(), humiliation },
  required_action: humiliation ? 'regenerate' : 'publish',
  notes,
})
const moderationClear = { flagged: false, categories: { harassment: false } }

assert.equal(locateHumiliationEvidence(candidate, flagged(['humiliation_evidence:hamma uning ustidan kuldi'])), 'story_text')
assert.equal(locateHumiliationEvidence(candidate, flagged(['humiliation_evidence:Ular yo‘l bo‘ylab birga yurdi.'])), 'choice_2_resolution')
assert.equal(locateHumiliationEvidence(candidate, flagged(['humiliation_evidence:Qushning xatosidan', 'humiliation_evidence:hamma uning ustidan kuldi'])), 'invalid')
assert.equal(locateHumiliationEvidence(candidate, flagged([])), 'missing')
assert.equal(locateHumiliationEvidence(candidate, flagged(['humiliation_evidence:the child was mocked'])), 'unmatched')
assert.equal(locateHumiliationEvidence(candidate, flagged(['humiliation_evidence:short'])), 'invalid')
assert.equal(locateHumiliationEvidence(candidate, flagged(['humiliation_evidence:Qushning xatosidan hamma\nuning ustidan kuldi'])), 'invalid')
assert.equal(locateHumiliationEvidence(candidate, flagged(['humiliation_evidence:hamma uning ustidan kuldi'], false)), 'not_flagged')
const split = structuredClone(candidate)
split.story_text = 'Birinchi: hamma uning'
split.choices[0].resolution_text = 'ustidan kuldi'
assert.equal(locateHumiliationEvidence(split, flagged(['humiliation_evidence:hamma uning ustidan kuldi'])), 'unmatched', 'independent fields never concatenate into fabricated evidence')
const duplicate = structuredClone(candidate)
duplicate.choices[0].resolution_text += ' hamma uning ustidan kuldi'
assert.equal(locateHumiliationEvidence(duplicate, flagged(['humiliation_evidence:hamma uning ustidan kuldi'])), 'multiple')

const rejected = combineSafety(emptySafetyFlags(), flagged(['humiliation_evidence:hamma uning ustidan kuldi']), moderationClear)
assert.equal(rejected.approved, false, 'moderation clear must not override semantic humiliation')
assert.equal(rejected.flags.humiliation, true)
assert.equal(rejected.required_action, 'regenerate')
const unverified = combineSafety(emptySafetyFlags(), flagged(['humiliation_evidence:invented evidence']), moderationClear)
assert.equal(unverified.approved, false, 'unsupported evidence must never auto-approve')

const index = readFileSync('supabase/functions/story-generate/split-index.ts', 'utf8')
const provider = readFileSync('supabase/functions/story-generate/openai.ts', 'utf8')
assert.match(index, /locateHumiliationEvidence\(candidate, evaluation\)/u, 'production must derive diagnostic from exact final candidate')
assert.match(index, /humiliation_evidence=\$\{humiliationEvidenceField\}/u, 'trace must contain code only')
assert.match(provider, /humiliationEvidenceInstruction/u, 'safety evaluator must request grounded excerpt')
assert.doesNotMatch(index, /evaluation\.notes\.join\(/u, 'never write raw evidence notes to trace')
console.log('Humiliation evidence diagnostics PASS: verified field-only codes, unsupported/missing evidence blocks, no cross-field synthesis, moderation clear never overrides, no provider/network/database calls.')
