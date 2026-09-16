import assert from 'node:assert/strict'
import { buildFinalEpisode, finalPatchFromCandidate, normalizeStoryRequest } from '../supabase/functions/story-generate/contracts.ts'

// Entirely offline. Reconstruct complete synthetic sentences matching the real
// v85 E1's three >96-character event patterns. The original Architect output
// was not logged, so these are regression fixtures, not its claimed raw words.
const context = normalizeStoryRequest({
  selections: { ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime' },
  seriesState: { id: 'memory-event-proof', mainCharacter: 'Malika', recurringCharacters: [], lastEpisodeSummary: '', activeArc: '', relationshipState: {}, canonState: {}, choiceHistory: [], episodeCount: 0 },
})
assert.ok(context && context.episodeIndex === 1)
const top = 'Malika Chirqilloqning kechki qo‘shiq o‘yinida qatnashishiga yordam berish uchun yangi o‘yin topdi va do‘stlariga bu haqda gapirdi.'
const a = '{{HERO}} navbat bilan qo‘shiq aytish o‘yinini boshlab, Chirqilloqning ovozi do‘stlariga aniq eshitilishiga yordam berdi.'
const b = '{{HERO}} Chirqilloqning kuyi ortidan do‘stlar muloyim javob beradigan aks-sado o‘yinini boshlab, do‘stlarni xursand qildi.'
for (const value of [top, a, b]) assert.ok(value.length > 96 && value.length < 300, 'fixture must cross the actual 96-character truncation boundary')
const patch = (last_event) => ({ last_event, new_friend: 'Chirqilloq', hero_trait: null, open_arc: 'Do‘stlar bir-birini tinglaydigan o‘yinlar.', relationship_updates: [], canon_updates: [] })
const candidate = {
  title: 'Chirqilloqning mayin qo‘shig‘i', story_text: '{{HERO}} do‘stlariga qaradi.',
  choices: [
    { choice_id: 'a', text: 'Navbat bilan aytish', effect_summary: '{{HERO}} navbatli o‘yin boshladi.', resolution_text: '{{HERO}}ning do‘stlari qushchani eshitdi.', tomorrow_seed: 'Yangi qo‘shiq.', choice_icon: '🎵', state_patch: patch(a), value_alignment: ['friendship'] },
    { choice_id: 'b', text: 'Aks-sado qilish', effect_summary: '{{HERO}} aks-sado o‘yini boshladi.', resolution_text: 'Do‘stlari qushchaga javob berdi.', tomorrow_seed: 'Yangi o‘yin.', choice_icon: '🌿', state_patch: patch(b), value_alignment: ['friendship'] },
  ],
  state_patch: patch(top), vocabulary: [], nextEpisodePreview: 'O‘yin davom etadi.',
}
const safety = { approved: true, risk_level: 'low', required_action: 'publish', flags: { discrimination: false, humiliation: false, religious_push: false, political_push: false, gender_stereotype: false, nationality_stereotype: false, conditional_love: false, bedtime_overstimulation: false, adult_theme: false, excessive_fear: false } }
const episode = buildFinalEpisode(context, candidate, safety)
assert.equal(episode.state_patch.last_event, top, 'E1 summary may not lose a meaningful sentence at 96 characters')
assert.equal(episode.choices[0].state_patch.last_event, a.replace('{{HERO}}', 'Malika'), 'A memory must preserve the entire selected result')
assert.equal(episode.choices[1].state_patch.last_event, b.replace('{{HERO}}', 'Malika'), 'B memory must preserve the entire selected result')
const next = normalizeStoryRequest({
  selections: { ageGroup: '5-7', language: 'uz', heroType: 'custom', customHeroName: 'Malika', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime' },
  seriesState: { id: 'memory-event-proof', mainCharacter: 'Malika', lastEpisodeSummary: episode.state_patch.last_event, episodeCount: 1, choiceHistory: [], canonState: {}, relationshipState: {} },
})
assert.ok(next && next.episodeIndex === 2, 'E1 should lead into E2')
assert.equal(next.lastEpisodeSummary, top.replace('Malika', '{{HERO}}'), 'request normalization must preserve full event meaning')

// Oversized output must never store half a sentence as canonical memory.
const firstSentence = 'Malika do‘stlarning fikrini eshitdi va qo‘shiq o‘yinini boshladi.'
const oversized = `${firstSentence} ${'Keyin do‘stlar birgalikda kuylashni davom ettirishdi '.repeat(9)}`
assert.ok(oversized.length > 300)
assert.equal(finalPatchFromCandidate(patch(oversized), 'Malika').last_event, firstSentence, 'keep only a complete sentence within the 300-character memory budget')
const unfinished = `Malika ${'do‘stlariga qo‘shiq o‘yinini '.repeat(20)}`
assert.ok(unfinished.length > 300)
assert.equal(finalPatchFromCandidate(patch(unfinished), 'Malika').last_event, undefined, 'omit overlong memory without any complete sentence instead of persisting a fragment')
assert.equal(finalPatchFromCandidate(patch('Malika do‘stlariga yordam berdi'), 'Malika').last_event, 'Malika do‘stlariga yordam berdi', 'preserve pre-existing concise punctuation-free memory')
console.log('Story E1 memory-event boundary regression PASS: complete v85-pattern events survive top/A/B, E2 request roundtrip preserves summary, oversized memory truncates at a full sentence or is omitted; zero provider/database/HTTP calls.')
