import assert from 'node:assert/strict'
import { auditCanonTransitions } from '../supabase/functions/story-generate/canon-guard.ts'

const context = {
  heroName: 'Малика',
  heroType: 'girl_hero',
  stylePackId: 'cozy_forest',
  canonState: {
    hero_name: 'Малика',
    world_name: 'Лес светлячков',
    found_key: 'not_yet',
  },
}
const entry = (key, value) => ({ key, value })
const patch = (...updates) => ({ canon_updates: updates })

const coherent = {
  state_patch: patch(entry('shared_goal', 'completed')),
  choices: [
    { state_patch: patch(entry('method', 'find_paths')) },
    { state_patch: patch(entry('method', 'ask_keeper')) },
  ],
}
assert.deepEqual(auditCanonTransitions(context, coherent), [],
  'different legitimate branch memories must not be rejected')

const rename = {
  state_patch: patch(entry('hero_name', 'Другой герой')),
  choices: [],
}
assert(auditCanonTransitions(context, rename).includes('canon_immutable_identity_conflict:hero_name'),
  'cannot rename canonical hero')

const changeWorld = {
  state_patch: patch(entry('world_name', 'Другой мир')),
  choices: [],
}
assert(auditCanonTransitions(context, changeWorld).includes('canon_immutable_identity_conflict:world_name'),
  'cannot rewrite a locked world identity')

const collision = {
  state_patch: patch(entry('method', 'forced_common')),
  choices: [
    { state_patch: patch(entry('method', 'branch_a')) },
    { state_patch: patch(entry('method', 'branch_b')) },
  ],
}
assert(auditCanonTransitions(context, collision).includes('canon_common_overwrites_choice:method'),
  'common patch must not erase a selected branch result')

assert.deepEqual(auditCanonTransitions(context, {
  state_patch: patch(entry('found_key', 'found')),
  choices: [],
}), [], 'normal plot progression remains allowed')

const stale = {
  ...context,
  canonState: { ...context.canonState, hero_name: 'Историческая ошибка' },
}
assert(auditCanonTransitions(stale, rename).includes('canon_immutable_identity_conflict:hero_name'),
  'normalized hero must be authoritative even if stored canon is stale')

console.log('[story-runtime-canon] PASS: immutable identity, shared-merge collision and allowed plot changes')
