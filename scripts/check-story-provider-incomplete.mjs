import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { structuredResponseIncompleteReason } from '../supabase/functions/story-generate/split-openai.ts'

// Source and fake provider payloads only: zero HTTP, DB, user data or API keys.
const reason = structuredResponseIncompleteReason
assert.equal(reason({ status: 'incomplete', incomplete_details: { reason: 'max_output_tokens' } }), 'max-output-tokens')
assert.equal(reason({ incomplete_details: { reason: 'max_tokens' } }), 'max-output-tokens')
assert.equal(reason({ incomplete_details: { reason: 'content_filter' } }), 'content-filter')
for (const payload of [null, {}, { incomplete_details: null }, { incomplete_details: { reason: 'user-sensitive-data' } }, { incomplete_details: { reason: { secret: true } } }]) {
  assert.equal(reason(payload), 'other', 'unknown provider values must never leak into response headers')
}
const split = readFileSync('supabase/functions/story-generate/split-openai.ts', 'utf8')
const server = readFileSync('supabase/functions/story-generate/split-index.ts', 'utf8')
const guard = readFileSync('supabase/functions/story-generate/test-spend-budget.ts', 'utf8')
const architecture = readFileSync('supabase/functions/story-generate/story-architecture.ts', 'utf8')
assert.match(split, /'qissa_story_blueprint'[\s\S]*timeoutMs,[\s\S]*2400,[\s\S]*'none'/, 'bounded 2400 token Architect experiment is wired')
assert.match(split, /if \(status === 'incomplete'\) throw new Error\(`openai_incomplete_response:\$\{structuredResponseIncompleteReason\(payload\)\}`\)/, 'reason must be fixed category only')
assert.match(server, /reason\.startsWith\('openai_incomplete_response:'\)/, 'incomplete must keep existing provider-incomplete failure class')
assert.equal((server.match(/'X-QISSA-Provider-Incomplete-Reason':/g) ?? []).length, 2, 'both Architect and Narrator failures expose safe reason')
assert.match(server, /value === 'max-output-tokens' \|\| value === 'content-filter'/, 'headers cannot forward raw provider reasons')
assert.match(guard, /MAX_NANODOLLARS = 50_000_000/, 'strict five-cent ceiling preserved')
assert.match(guard, /output > 4000/, 'unbounded output cannot bypass ceiling')
assert.match(architecture, /state_patch: patchSchema/, 'branch/canon schema remains unchanged')
assert.doesNotMatch(server, /console\.log\(.*payload/, 'never log provider response body')
console.log('V102 provider-incomplete fixed-reason + bounded Architect cap contract PASS; provider-free, root-cause hypothesis not proven.')
