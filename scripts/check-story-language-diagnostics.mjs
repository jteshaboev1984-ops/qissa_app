import assert from 'node:assert/strict'
import fs from 'node:fs'
import { candidateLanguageMismatchFieldCodes } from '../supabase/functions/story-generate/language-diagnostics.ts'
import { normalizeStoryRequest } from '../supabase/functions/story-generate/contracts.ts'
import { validateCandidate } from '../supabase/functions/story-generate/safety.ts'
import { buildNarratorPrompts } from '../supabase/functions/story-generate/story-architecture.ts'
import { buildTextLengthRepairOutputSchema } from '../supabase/functions/story-generate/prompt.ts'

// No secrets, network, database, provider calls or user material: only synthetic text.
const context = normalizeStoryRequest({
  selections: { ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime' },
  seriesState: { id: 'synthetic-language-diagnostic', mainCharacter: 'Malika', recurringCharacters: [], lastEpisodeSummary: '', activeArc: '', relationshipState: {}, canonState: {}, choiceHistory: [], episodeCount: 0 },
})
assert.ok(context && context.episodeIndex === 1)
const patch = () => ({ last_event: 'Momiq kutmoqda.', new_friend: null, hero_trait: null, open_arc: 'Sovg‘a', relationship_updates: [], canon_updates: [] })
const base = {
  title: 'Momiqning sovg‘asi', story_text: '{{HERO}} Momiqqa yordam berdi.',
  nextEpisodePreview: 'Momiq sovg‘asini ko‘rsatadi.', state_patch: patch(), vocabulary: [],
  choices: [
    { choice_id: 'choice-a', text: 'Barglardan kichik rasm yasash', effect_summary: 'Momiq rasmni oladi.', resolution_text: '{{HERO}} rasmni tugatdi.', tomorrow_seed: 'Momiq rasmni eslaydi.', choice_icon: '🎁', state_patch: patch(), value_alignment: ['kindness'] },
    { choice_id: 'choice-b', text: 'Birga sokin qo‘shiq aytish', effect_summary: 'Momiq qo‘shiqni tinglaydi.', resolution_text: '{{HERO}} qo‘shiqni aytdi.', tomorrow_seed: 'Momiq qo‘shiqni eslaydi.', choice_icon: '🎵', state_patch: patch(), value_alignment: ['friendship'] },
  ],
}
assert.deepEqual(candidateLanguageMismatchFieldCodes(context, base), [])
assert.ok(!validateCandidate(context, base).includes('story_language_mismatch'))
for (const [name, mutate, code] of [
  ['title', c => { c.title = 'Подарок.' }, 'title'],
  ['story', c => { c.story_text += ' Потом.' }, 'story_text'],
  ['preview', c => { c.nextEpisodePreview = 'Продолжение.' }, 'preview'],
  ['top patch', c => { c.state_patch.last_event = 'Случилось.' }, 'state_patch'],
  ['choice A card', c => { c.choices[0].text = 'Сделать рисунок' }, 'choice_1_text'],
  ['choice B resolution', c => { c.choices[1].resolution_text = 'Спеть песню.' }, 'choice_2_resolution'],
  ['choice B state', c => { c.choices[1].state_patch.canon_updates = [{ key: 'memory', value: 'Секрет.' }] }, 'choice_2_state_patch'],
  ['vocabulary word', c => { c.vocabulary = [{ word: 'Слово', translation: 'tarjima', example: 'O‘rmonda yurdi.' }] }, 'vocabulary_word'],
]) {
  const candidate = structuredClone(base)
  mutate(candidate)
  assert.ok(validateCandidate(context, candidate).includes('story_language_mismatch'), `${name}: authoritative gate unexpectedly changed`)
  assert.deepEqual(candidateLanguageMismatchFieldCodes(context, candidate), [code], `${name}: attribution`)
  assert.ok(!JSON.stringify(candidateLanguageMismatchFieldCodes(context, candidate)).includes('Подарок'), 'diagnostics must never expose content')
}
const established = { ...context, recurringCharacters: ['Рыжик'] }
const allowed = structuredClone(base)
allowed.story_text += ' Рыжик Malika bilan yurdi.'
assert.deepEqual(candidateLanguageMismatchFieldCodes(established, allowed), [], 'established character name is allowed')
allowed.story_text += ' Потом.'
assert.deepEqual(candidateLanguageMismatchFieldCodes(established, allowed), ['story_text'], 'allowed names cannot mask unrelated Russian prose')
const aggregate = structuredClone(base)
aggregate.title = Array(20).fill('лесной').join(' ')
aggregate.story_text = Array(20).fill('тихий').join(' ')
aggregate.nextEpisodePreview = ''
aggregate.state_patch = { last_event: '', new_friend: null, hero_trait: null, open_arc: null, relationship_updates: [], canon_updates: [] }
aggregate.choices = []
assert.deepEqual(candidateLanguageMismatchFieldCodes({ language: 'kz', recurringCharacters: [] }, aggregate), ['aggregate_only'], 'cross-field threshold must not be misattributed')

const source = fs.readFileSync('supabase/functions/story-generate/split-index.ts', 'utf8')
assert.ok(source.includes('candidateLanguageMismatchFieldCodes'), 'orchestrator must actually use the privacy-safe diagnostic')
assert.ok(source.includes('language_fields='), 'language attribution must survive a Repair failure in failure trace')
assert.ok(!source.includes('JSON.stringify(candidate)'), 'no unredacted rejected child story diagnostics')

// A deterministic shortfall is real, but its cause (model compliance vs tokens) is not inferable
// without the rejected Narrator response. Ensure existing boundaries are aligned before spending.
const plan = buildNarratorPrompts(context, {
  plan_version: 'split-v1', central_goal: 'Momiqqa sovg‘a tayyorlash', setting_anchor: 'o‘rmon', continuity_callbacks: [],
  beats: ['{{HERO}} Momiq bilan gaplashadi', 'Do‘stlar sovg‘ani ko‘radi', 'Ular birga gaplashadi', 'Momiq javobni kutadi'],
  decision_point: 'Qaysi sovg‘ani tayyorlaymiz?', choices: [], state_patch: patch(), next_episode_preview: '',
})
const narratorPayload = JSON.parse(plan.user)
assert.equal(narratorPayload.hard_story_word_range.minimum, 320)
assert.equal(narratorPayload.hard_story_word_range.maximum, 470)
assert.equal(narratorPayload.target_story_words, '380-420')
assert.equal(narratorPayload.paragraph_budget.target_paragraphs, '8-10')
const short = structuredClone(base)
short.story_text = Array(250).fill('Momiq').join(' ') + ' {{HERO}}.'
assert.ok(validateCandidate(context, short).includes('story_too_short'), 'v91-pattern subminimum Narrator must be rejected')
const repairSchema = buildTextLengthRepairOutputSchema(context, ['story_language_mismatch', 'story_too_short'])
assert.equal(repairSchema.properties.story_rewrite.type, 'string')
assert.equal(repairSchema.properties.choice_resolutions.type, 'object')
console.log('Provider-free story language attribution, privacy, immutable validation and v91 word-budget contracts GREEN.')
