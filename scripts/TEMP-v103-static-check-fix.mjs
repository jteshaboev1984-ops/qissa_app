import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'

assert.equal(process.env.GITHUB_REF, 'refs/heads/fix/v103-story-character-and-severe-repair-20260918')
assert.equal(process.env.GITHUB_RUN_ATTEMPT, '1')
const path = 'scripts/check-story-ai-safety.mjs'
let source = readFileSync(path, 'utf8')
for (const [previous, current] of [
  [
    'For a pure Episode 1 story_too_short failure, do NOT rewrite the existing story.',
    'For a MODERATE Episode 1 story_too_short failure only, do NOT rewrite the existing story.',
  ],
  [
    'A deterministic prose or language defect is already present in the Narrator output',
    'A severe first-story length deficit or deterministic prose/language defect requires rewriting the full title and story_text',
  ],
]) {
  assert.equal(source.split(previous).length - 1, 1, `Expected exactly one stale assertion: ${previous}`)
  source = source.replace(previous, current)
}
for (const expected of ['For a MODERATE Episode 1 story_too_short failure only, do NOT rewrite the existing story.', 'A severe first-story length deficit or deterministic prose/language defect requires rewriting the full title and story_text']) {
  assert.equal(readFileSync('supabase/functions/story-generate/prompt.ts', 'utf8').split(expected).length - 1, 1, `Updated assertion must exactly match current production prompt: ${expected}`)
}
writeFileSync(path, source, 'utf8')
console.log('V103_STATIC_ASSERTION_FIX_PASS: updated exactly two obsolete textual assertions; no runtime behavior, secrets, provider or DB changes.')
