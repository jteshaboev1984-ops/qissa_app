import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { normalizeStoryRequest } from '../supabase/functions/story-generate/contracts.ts'
import { generateStoryBlueprint } from '../supabase/functions/story-generate/split-openai.ts'
import { adjudicateStoryFear, evaluateStorySafety, moderateStoryText, repairStoryCandidateTextLengths } from '../supabase/functions/story-generate/openai.ts'

// All fetches are intercepted. No live provider, network, database or children are involved.
const index = readFileSync('supabase/functions/story-generate/split-index.ts', 'utf8')
const split = readFileSync('supabase/functions/story-generate/split-openai.ts', 'utf8')
const provider = readFileSync('supabase/functions/story-generate/openai.ts', 'utf8')
assert.equal((index.match(/providerCalls \+= 1/gu) ?? []).length, 1, 'only the per-request callback may increment the counter')
assert.match(index, /Promise\.allSettled\(/u, 'wait for both safety branches before recording the final attempts')
assert.match(index, /'X-QISSA-OpenAI-Request-Attempts': String\(providerCalls\)/u, 'the canonical count must be explicit')
assert.match(index, /'X-QISSA-Provider-Calls': String\(providerCalls\)/u, 'deprecated header may remain only as an accurate alias')
assert.match(split, /onRequestAttempt\?\.\(\)/u, 'split HTTP boundary must count every attempt')
assert.match(provider, /onRequestAttempt\?\.\(\)/u, 'semantic safety, moderation and repair HTTP boundary must count every attempt')
for (const name of ['generateStoryBlueprint', 'generateStoryNarration', 'repairStoryCandidateTextLengths', 'evaluateStorySafety', 'moderateStoryText', 'adjudicateStoryFear']) {
  assert.match(index, new RegExp(`${name}\\([\\s\\S]*?onRequestAttempt\\)`, 'u'), `the ${name} path must pass the local observer`)
}

const context = normalizeStoryRequest({
  selections: { ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime' },
  seriesState: { id: 'provider-free-fixture', mainCharacter: 'Malika', recurringCharacters: [], lastEpisodeSummary: '', activeArc: '', relationshipState: {}, choiceHistory: [], canonState: {}, episodeCount: 0 },
})
assert.ok(context)
const patch = { last_event: 'Do‘stlar uchrashdi.', new_friend: null, hero_trait: null, open_arc: null, relationship_updates: [], canon_updates: [] }
const candidate = {
  title: 'Do‘stlar', story_text: '{{HERO}} do‘stlarini ko‘rdi va birga kuldi.', vocabulary: [], nextEpisodePreview: 'Davomi bor.', state_patch: patch,
  choices: [
    { choice_id: 'a', text: 'Birga yurish', effect_summary: 'Yurishdi.', resolution_text: 'Do‘stlar birga yurishdi.', tomorrow_seed: 'Ertaga uchrashadilar.', choice_icon: '🌿', state_patch: patch, value_alignment: ['friendship'] },
    { choice_id: 'b', text: 'Birga o‘ynash', effect_summary: 'O‘ynashdi.', resolution_text: 'Do‘stlar birga o‘ynashdi.', tomorrow_seed: 'Ertaga uchrashadilar.', choice_icon: '⭐', state_patch: patch, value_alignment: ['friendship'] },
  ],
}
const flags = (overrides = {}) => ({ discrimination: false, humiliation: false, religious_push: false, political_push: false, gender_stereotype: false, nationality_stereotype: false, conditional_love: false, bedtime_overstimulation: false, adult_theme: false, excessive_fear: false, ...overrides })
const clean = { approved: true, risk_level: 'low', flags: flags(), required_action: 'publish', notes: [] }
const structured = (value) => ({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(value) }] }] })
const ok = (value) => new Response(JSON.stringify(value), { status: 200 })
const error = (status) => new Response('', { status })
const originalFetch = globalThis.fetch

async function scenario(name, replies, perform, expectedCount) {
  let calls = 0
  const attempts = []
  globalThis.fetch = async (url, options) => {
    assert.match(String(url), /^https:\/\/api\.openai\.com\/v1\/(responses|moderations)$/u)
    assert.equal(options.method, 'POST')
    attempts.push(url)
    const reply = replies.shift()
    assert.ok(reply, `${name}: unexpected provider request`)
    if (reply instanceof Error) throw reply
    return reply
  }
  try {
    await perform(() => { calls += 1 })
    assert.equal(calls, expectedCount, `${name}: observer calls`)
    assert.equal(attempts.length, expectedCount, `${name}: actual fetches`)
    assert.equal(replies.length, 0, `${name}: planned responses consumed`)
  } finally {
    globalThis.fetch = originalFetch
  }
}

await scenario('architect HTTP failure', [error(503)], async (onAttempt) => {
  await assert.rejects(generateStoryBlueprint('synthetic-key', 'test-model', context, 500, onAttempt), /openai_http_503/u)
}, 1)
await scenario('repair HTTP failure', [error(502)], async (onAttempt) => {
  await assert.rejects(repairStoryCandidateTextLengths('synthetic-key', 'test-model', context, candidate, ['story_too_short'], '', 500, onAttempt), /openai_http_502/u)
}, 1)
await scenario('semantic safety clean', [ok(structured(clean))], async (onAttempt) => {
  assert.equal((await evaluateStorySafety('synthetic-key', 'test-model', context, candidate, onAttempt)).approved, true)
}, 1)
await scenario('semantic consistency correction', [ok(structured({ ...clean, approved: false, risk_level: 'medium', required_action: 'regenerate' })), ok(structured(clean))], async (onAttempt) => {
  assert.equal((await evaluateStorySafety('synthetic-key', 'test-model', context, candidate, onAttempt)).approved, true)
}, 2)
await scenario('nested humiliation adjudication', [ok(structured({ ...clean, approved: false, risk_level: 'medium', required_action: 'regenerate', flags: flags({ humiliation: true }), notes: ['humiliation_evidence:UNAVAILABLE'] })), ok(structured({ humiliation: false, category: 'none', evidence: '' }))], async (onAttempt) => {
  assert.equal((await evaluateStorySafety('synthetic-key', 'test-model', context, candidate, onAttempt)).approved, true)
}, 2)
await scenario('nested fear adjudication', [ok(structured({ ...clean, approved: false, risk_level: 'high', required_action: 'block', flags: flags({ excessive_fear: true }) })), ok(structured({ excessive_fear: false, category: 'none_or_mild', evidence: '' }))], async (onAttempt) => {
  assert.equal((await evaluateStorySafety('synthetic-key', 'test-model', context, candidate, onAttempt)).approved, true)
}, 2)
await scenario('independent moderation', [ok({ results: [{ flagged: false, categories: {} }] })], async (onAttempt) => {
  assert.equal((await moderateStoryText('synthetic-key', 'child-visible-fixture', onAttempt)).flagged, false)
}, 1)
await scenario('outer moderation fear adjudication', [ok(structured({ excessive_fear: false, category: 'none_or_mild', evidence: '' }))], async (onAttempt) => {
  assert.equal((await adjudicateStoryFear('synthetic-key', 'test-model', candidate, onAttempt)).excessive_fear, false)
}, 1)
await scenario('network abort still counts once', [new DOMException('aborted', 'AbortError')], async (onAttempt) => {
  await assert.rejects(moderateStoryText('synthetic-key', 'synthetic-fixture', onAttempt), /openai_timeout/u)
}, 1)
await scenario('concurrent moderation error waits for nested safety correction', [ok(structured({ ...clean, approved: false, risk_level: 'medium', required_action: 'regenerate' })), error(503), ok(structured(clean))], async (onAttempt) => {
  const [safety, moderation] = await Promise.allSettled([
    evaluateStorySafety('synthetic-key', 'test-model', context, candidate, onAttempt),
    moderateStoryText('synthetic-key', 'synthetic-fixture', onAttempt),
  ])
  assert.equal(safety.status, 'fulfilled')
  assert.equal(moderation.status, 'rejected')
}, 3)
console.log('OpenAI request-attempt accounting PASS: every intercepted HTTP attempt counted exactly once, nested checks and errors included; 0 real calls.')
