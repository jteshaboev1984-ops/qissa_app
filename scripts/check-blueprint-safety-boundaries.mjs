import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { scanRuleBasedSafety, scanRuleBasedSafetyValues } from '../supabase/functions/story-generate/safety.ts'

// Synthetic examples only: the rejected 2026-09-17 Architect blueprint was NOT recorded.
// All checks run offline; never call an AI provider, Supabase or HTTP.
const context = { language: 'uz', ageGroup: '5-7', storyMood: 'bedtime', storyMode: 'series', episodeIndex: 1,
  isFinalSeriesSession: false, recurringCharacters: [], canonState: {}, relationshipState: {} }
const flags = (values) => scanRuleBasedSafetyValues(context, values)
const prose = (story_text) => scanRuleBasedSafety(context, { title: '', story_text, choices: [] })

assert.equal(flags(['siyosiy', 'partiya']).political_push, false,
  'an invented political phrase spanning two independent blueprint fields must NOT match')
assert.equal(flags(['hamma uning', 'ustidan kuldi']).humiliation, false,
  'a humiliation phrase spanning independent blueprint fields must NOT match')
assert.equal(flags(['siyosiy partiya']).political_push, true,
  'a real political phrase wholly inside one field must remain blocked')
assert.equal(flags(['hamma uning ustidan kuldi']).humiliation, true,
  'real humiliation within a field must remain blocked')
assert.equal(flags(['Yumshoq nur', null, '', undefined]).political_push, false,
  'empty values must remain harmless and correctly typed')
assert.equal(prose('Qushcha javob o‘rniga mayin ovoz berdi.').political_push, false,
  'ordinary Uzbek bird giving voice in past tense must not be interpreted as electoral persuasion')
assert.equal(prose('Qushcha ovoz beradigan joyga qo‘ndi.').political_push, false,
  'an inflected descriptive verb must not be mistaken for a voting imperative')
assert.equal(prose('Nomzodga ovoz ber!').political_push, true,
  'an explicit electoral imperative remains blocked')
assert.equal(prose('Nomzodga ovoz bering!').political_push, true,
  'the polite electoral imperative remains blocked')
assert.equal(prose('Saylovda siyosiy partiya haqida gap bordi.').political_push, true,
  'the existing explicit party-language guard remains intact')
assert.equal(prose('Yo‘lda qon bor edi.').excessive_fear, true,
  'blood remains a hard failure')
assert.equal(prose('Do‘stlar birga yordam berdi.').excessive_fear, false,
  'ordinary Uzbek help remains allowed')

// Import the *new* diagnostic only after pre-existing false positives have been tested.
// On unpatched production code the first assertion above must fail before this import.
const { blueprintRuleSafetyCategories, validateStoryBlueprint } = await import('../supabase/functions/story-generate/story-architecture.ts')
const patch = { last_event: 'Momiq uchun sovg‘a tayyorlanadi.', new_friend: 'Momiq', hero_trait: null,
  open_arc: 'Momiqning sovg‘asi', relationship_updates: [], canon_updates: [] }
const clean = {
  plan_version: 'split-v1', central_goal: 'Momiq uchun sovg‘a tayyorlash.', setting_anchor: 'shinam o‘rmon',
  continuity_callbacks: [],
  beats: ['Momiq do‘stlarini chaqiradi.', 'Do‘stlar sovg‘a haqida gaplashadi.',
    '{{HERO}} Momiq bilan kuladi.', 'Do‘stlar sovg‘ani tayyorlashga qaror qiladi.'],
  decision_point: 'Qaysi sovg‘ani tayyorlaymiz?', next_episode_preview: 'Momiq sovg‘ani akasiga ko‘rsatadi.',
  state_patch: patch,
  choices: [
    { choice_id: 'a', text: 'Bargdan rasm yasash', effect_summary: '{{HERO}} rasm yasashga yordam beradi.',
      resolution_goal: '{{HERO}} rasmni tayyorlaydi.', tomorrow_seed: 'Momiq rasmni akasiga ko‘rsatadi.',
      choice_icon: '🍃', state_patch: { ...patch, last_event: 'Rasm tayyor bo‘ldi.' }, value_alignment: ['kindness'] },
    { choice_id: 'b', text: 'Mayin qo‘shiq aytish', effect_summary: '{{HERO}} qo‘shiq aytishga yordam beradi.',
      resolution_goal: '{{HERO}} qo‘shiqni tayyorlaydi.', tomorrow_seed: 'Momiq qo‘shiqni akasiga aytadi.',
      choice_icon: '🎵', state_patch: { ...patch, last_event: 'Qo‘shiq tayyor bo‘ldi.' }, value_alignment: ['friendship'] },
  ],
}
const harmlessBlueprint = structuredClone(clean)
harmlessBlueprint.beats[0] = 'Qushcha javob o‘rniga mayin ovoz berdi.'
assert.deepEqual(blueprintRuleSafetyCategories(context, harmlessBlueprint), [],
  'safe bird speech must have no blueprint safety categories')
assert.ok(!validateStoryBlueprint(context, harmlessBlueprint).includes('blueprint_rule_safety'),
  'a harmless blueprint must not hit the generic safety gate')
const dangerousBlueprint = structuredClone(clean)
dangerousBlueprint.beats[0] = 'Yo‘lda qon bor edi.'
assert.deepEqual(blueprintRuleSafetyCategories(context, dangerousBlueprint), ['excessive_fear'],
  'category-only diagnostics must identify genuine synthetic fear without exposing the prose')
assert.ok(validateStoryBlueprint(context, dangerousBlueprint).includes('blueprint_rule_safety'),
  'the original safe-fallback gate must still reject unsafe blueprints')
const orchestration = readFileSync('supabase/functions/story-generate/split-index.ts', 'utf8')
assert.ok(orchestration.includes("'X-QISSA-Blueprint-Safety-Categories':") &&
  orchestration.includes('blueprintRuleSafetyCategories(context, blueprint)'),
  'a failed Architect gate must report only category names, not the raw blueprint')
console.log('Blueprint safety boundary regression PASS: no cross-field synthetic phrases or ordinary Uzbek voice false positives; real danger blocked; category-only failure diagnostics; zero provider/HTTP/database calls.')
