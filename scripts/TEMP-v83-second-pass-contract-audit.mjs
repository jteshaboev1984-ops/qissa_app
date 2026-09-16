import assert from 'node:assert/strict'
import { normalizeStoryRequest } from '../supabase/functions/story-generate/contracts.ts'
import { validateCandidate } from '../supabase/functions/story-generate/safety.ts'
import { validateStoryBlueprint } from '../supabase/functions/story-generate/story-architecture.ts'

const makeContext = (language = 'uz', storyMode = 'series', heroType = 'custom') => normalizeStoryRequest({
  selections: { ageGroup: '5-7', language, heroType, customHeroName: heroType === 'custom' ? 'Malika' : undefined, stylePackId: 'cozy_forest', storyMode, storyMood: 'bedtime' },
  seriesState: { id: `audit-${language}-${storyMode}`, sessionId: `audit-${language}-${storyMode}`, sessionIndex: 1, mainCharacter: heroType === 'custom' ? 'Malika' : undefined, recurringCharacters: [], lastEpisodeSummary: '', activeArc: '', relationshipState: {}, canonState: {}, choiceHistory: [], episodeCount: 0 },
})
const context = makeContext()
assert.ok(context)
const patch = (last_event) => ({ last_event, new_friend: null, hero_trait: null, open_arc: 'Momiq sovg‘asi', relationship_updates: [], canon_updates: [] })
const blueprint = {
  plan_version: 'split-v1', central_goal: 'Momiq uchun sovg‘a tayyorlash', setting_anchor: 'shinam o‘rmon', continuity_callbacks: [],
  beats: ['{{HERO}} Momiq bilan gaplashadi', 'Momiq sovg‘ani ko‘rsatadi', '{{HERO}} fikrni tinglaydi', 'Momiq javobni kutadi'],
  decision_point: 'Qaysi sovg‘ani tayyorlaymiz?',
  choices: [
    { choice_id: 'a', text: 'Barglardan rasm yasash', effect_summary: '{{HERO}} rasm yasaydi.', resolution_goal: '{{HERO}} rasmni tugatadi.', tomorrow_seed: 'Momiq rasmni do‘stiga ko‘rsatadi.', choice_icon: '🎁', state_patch: patch('Rasm tayyor.'), value_alignment: ['kindness'] },
    { choice_id: 'b', text: 'Birga qo‘shiq aytish', effect_summary: '{{HERO}} qo‘shiq aytadi.', resolution_goal: '{{HERO}} qo‘shiqni tugatadi.', tomorrow_seed: 'Momiq qo‘shiqni eslaydi.', choice_icon: '🎵', state_patch: patch('Qo‘shiq aytildi.'), value_alignment: ['friendship'] },
  ],
  state_patch: patch('Momiq sovg‘ani kutmoqda.'), next_episode_preview: 'Sovg‘a tayyorlash davom etadi.',
}
assert.deepEqual(validateStoryBlueprint(context, blueprint), [])

// H1: Architect may admit a direct-copy effect_summary that final candidate rejects after Narrator spend.
const shortEffect = structuredClone(blueprint)
shortEffect.choices[0].effect_summary = '{{HERO}} x.' // >=5 chars, <8 useful chars after token removal is irrelevant; final uses raw length, so use plain 5-7 string instead
shortEffect.choices[0].effect_summary = '1234567'
const upstreamShortEffect = validateStoryBlueprint(context, shortEffect)
const candidateFromShortEffect = {
  title: 'Sovg‘a', story_text: Array.from({ length: 330 }, (_, i) => i === 0 ? '{{HERO}}' : 'so‘z').join(' '),
  choices: shortEffect.choices.map((c) => ({ ...c, resolution_text: Array.from({ length: 30 }, () => 'so‘z').join(' ') })),
  state_patch: shortEffect.state_patch, vocabulary: [], nextEpisodePreview: shortEffect.next_episode_preview,
}
const downstreamShortEffect = validateCandidate(context, candidateFromShortEffect)
assert.ok(!upstreamShortEffect.includes('invalid_blueprint_effect_summary'), 'H1 upstream unexpectedly already rejects short effect_summary')
assert.ok(downstreamShortEffect.includes('invalid_effect_summary'), 'H1 downstream should reject short direct-copy effect_summary')
console.log('CONFIRMED H1: Architect/final validator effect_summary threshold mismatch')

// H2: one_time E1 should have no next preview downstream, while Architect currently requires one.
const oneTime = makeContext('uz', 'one_time', 'custom')
assert.ok(oneTime && oneTime.episodeIndex === 1)
const oneTimeEmptyPreview = structuredClone(blueprint)
oneTimeEmptyPreview.next_episode_preview = ''
const oneTimeUpstream = validateStoryBlueprint(oneTime, oneTimeEmptyPreview)
assert.ok(oneTimeUpstream.includes('missing_blueprint_preview'), 'H2 Architect no longer requires preview; update audit')
const oneTimeCandidate = { ...candidateFromShortEffect, choices: blueprint.choices.map((c) => ({ ...c, resolution_text: Array.from({ length: 30 }, () => 'so‘z').join(' ') })), nextEpisodePreview: '' }
const oneTimeDownstream = validateCandidate(oneTime, oneTimeCandidate)
assert.ok(!oneTimeDownstream.includes('missing_preview') && !oneTimeDownstream.includes('unexpected_preview'), 'H2 downstream should accept empty preview for one_time')
console.log('CONFIRMED H2: one_time preview contract contradicts final candidate contract')

// H3: immutable RU branch fields can contain raw-token grammar that Repair cannot change.
const ru = makeContext('ru', 'series', 'girl_hero')
assert.ok(ru)
const ruBlueprint = structuredClone(blueprint)
ruBlueprint.central_goal = 'Подготовить подарок для друга'
ruBlueprint.setting_anchor = 'уютный лес'
ruBlueprint.beats = ['{{HERO}} говорит с другом', 'Друг показывает подарок', '{{HERO}} слушает идею', 'Друг ждёт ответа']
ruBlueprint.decision_point = 'Что сделать дальше?'
ruBlueprint.next_episode_preview = 'История о подарке продолжится.'
ruBlueprint.state_patch = { ...patch('Друг ждёт подарок.'), open_arc: 'Подарок для друга' }
ruBlueprint.choices = [
  { choice_id: 'a', text: 'Сделать рисунок', effect_summary: 'Друг подходит к {{HERO}}.', resolution_goal: '{{HERO}} заканчивает рисунок.', tomorrow_seed: 'Друг покажет рисунок.', choice_icon: '🎁', state_patch: { ...patch('Рисунок готов.'), open_arc: 'Подарок для друга' }, value_alignment: ['kindness'] },
  { choice_id: 'b', text: 'Спеть песню', effect_summary: '{{HERO}} поёт песню.', resolution_goal: '{{HERO}} заканчивает песню.', tomorrow_seed: 'Друг вспомнит песню.', choice_icon: '🎵', state_patch: { ...patch('Песня прозвучала.'), open_arc: 'Подарок для друга' }, value_alignment: ['friendship'] },
]
const ruErrors = validateStoryBlueprint(ru, ruBlueprint)
assert.ok(!ruErrors.some((e) => e.includes('russian_hero')), `H3 upstream unexpectedly catches RU token grammar: ${ruErrors.join(',')}`)
console.log('CONFIRMED H3: Architect does not preflight immutable Russian {{HERO}} grammar')

console.log('Second-pass provider-free audit reproduced H1-H3; zero provider calls.')
