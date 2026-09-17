import assert from 'node:assert/strict'
import { validateStoryBlueprint } from '../supabase/functions/story-generate/story-architecture.ts'

// Provider-free synthetic regression for Architect E1 choice-menu diagnostics.
// No HTTP, model, Supabase or production data access.
const context = {
  language: 'uz', ageGroup: '5-7', storyMood: 'bedtime', storyMode: 'series', episodeIndex: 1,
  isFinalSeriesSession: false, recurringCharacters: [], canonState: {}, relationshipState: {},
}
const patch = {
  last_event: 'Momiq uchun sovg‘a tayyorlanadi.', new_friend: 'Momiq', hero_trait: null,
  open_arc: 'Momiqning sovg‘asi', relationship_updates: [], canon_updates: [],
}
const base = {
  plan_version: 'split-v1', central_goal: 'Momiq uchun sovg‘a tayyorlash.', setting_anchor: 'shinam o‘rmon',
  continuity_callbacks: [],
  beats: [
    'Momiq do‘stlarini chaqiradi.',
    'Do‘stlar sovg‘a haqida gaplashadi.',
    '{{HERO}} Momiq bilan kuladi.',
    'Do‘stlar sovg‘ani tayyorlashga qaror qiladi.',
  ],
  decision_point: '{{HERO}} do‘stlariga qanday yordam beradi?',
  next_episode_preview: 'Momiq sovg‘ani akasiga ko‘rsatadi.',
  state_patch: patch,
  choices: [
    {
      choice_id: 'a', text: 'Barglardan rangli bayroqchalar yasash',
      effect_summary: '{{HERO}} barglardan rangli bayroqchalar yasashga yordam beradi.',
      resolution_goal: '{{HERO}} rangli bayroqchalarni tayyorlaydi.',
      tomorrow_seed: 'Momiq bayroqchalarni akasiga ko‘rsatadi.', choice_icon: '🍃',
      state_patch: { ...patch, last_event: 'Rangli bayroqchalar tayyor bo‘ldi.' }, value_alignment: ['kindness'],
    },
    {
      choice_id: 'b', text: 'Yong‘oqlarni tekis qator qilib terish',
      effect_summary: '{{HERO}} yong‘oqlarni tekis qator qilib terishga yordam beradi.',
      resolution_goal: '{{HERO}} yong‘oq qatorini tayyorlaydi.',
      tomorrow_seed: 'Momiq yong‘oq qatorini akasiga ko‘rsatadi.', choice_icon: '🌰',
      state_patch: { ...patch, last_event: 'Yong‘oqlar tekis qator bo‘lib turdi.' }, value_alignment: ['friendship'],
    },
  ],
}

const cleanErrors = validateStoryBlueprint(context, structuredClone(base))
assert.ok(!cleanErrors.includes('blueprint_choice_menu_meta_phrasing'))
assert.ok(!cleanErrors.includes('blueprint_choice_menu_repeats_cards'))
assert.ok(!cleanErrors.includes('blueprint_choice_menu_scaffolding'))

const meta = structuredClone(base)
meta.decision_point = 'Barglardan rasm yasash mumkin, yoki yong‘oqlardan bezak qilish mumkin.'
const metaErrors = validateStoryBlueprint(context, meta)
assert.ok(metaErrors.includes('blueprint_choice_menu_meta_phrasing'), 'meta/scaffolding phrasing must have its own diagnostic code')
assert.ok(!metaErrors.includes('blueprint_choice_menu_repeats_cards'), 'meta-only failure must not be mislabeled as card repetition')
assert.ok(!metaErrors.includes('blueprint_choice_menu_scaffolding'), 'legacy aggregate code must not hide the exact predicate')

const repeats = structuredClone(base)
repeats.decision_point = 'Barglardan rangli bayroqchalar yasashmi yoki yong‘oqlarni tekis qator qilib terishmi?'
const repeatErrors = validateStoryBlueprint(context, repeats)
assert.ok(repeatErrors.includes('blueprint_choice_menu_repeats_cards'), 'a question that restates both cards must have its own diagnostic code')
assert.ok(!repeatErrors.includes('blueprint_choice_menu_meta_phrasing'), 'card repetition without meta phrasing must stay separate')
assert.ok(!repeatErrors.includes('blueprint_choice_menu_scaffolding'), 'legacy aggregate code must not hide the exact predicate')

console.log('Choice-menu diagnostic split PASS: clean, meta-phrasing and repeats-cards paths are distinguishable; zero provider/HTTP/database calls.')
