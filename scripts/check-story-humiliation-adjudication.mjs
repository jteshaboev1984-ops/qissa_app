import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { humiliationAdjudicationConsistencyErrors } from '../supabase/functions/story-generate/humiliation-adjudication.ts'

const provider = readFileSync('supabase/functions/story-generate/openai.ts', 'utf8')
const safety = readFileSync('supabase/functions/story-generate/safety.ts', 'utf8')

const harmless = 'Tikanjon panjalarini bir-biriga tekkizib, yerga qaradi. Do‘stlari uni sabr bilan kutishdi.'
assert.deepEqual(
  humiliationAdjudicationConsistencyErrors({ humiliation: false, category: 'none', evidence: '' }, harmless),
  [],
  'ordinary shyness/body language must support a clean narrow adjudication',
)

const real = 'Hamma uning ustidan kuldi va uni ataylab kamsitdi.'
assert.deepEqual(
  humiliationAdjudicationConsistencyErrors({ humiliation: true, category: 'targeted_mockery', evidence: 'Hamma uning ustidan kuldi' }, real),
  [],
  'real targeted ridicule with exact evidence must remain a valid humiliation verdict',
)
assert.ok(
  humiliationAdjudicationConsistencyErrors({ humiliation: true, category: 'targeted_mockery', evidence: 'Ular uni masxara qilishdi' }, real)
    .includes('humiliation_evidence_not_in_story'),
  'invented evidence must fail closed',
)
assert.ok(
  humiliationAdjudicationConsistencyErrors({ humiliation: false, category: 'none', evidence: 'yerga qaradi' }, harmless)
    .includes('nonhumiliation_must_not_invent_evidence'),
  'a cleared verdict must not retain misleading evidence',
)

for (const required of [
  "from './humiliation-adjudication.ts'",
  'requestHumiliationAdjudication',
  'narrow child humiliation adjudicator',
  'needsIsolatedHumiliationConfirmation',
  'humiliationAdjudicationConsistencyErrors',
  'isolated humiliation was not confirmed by narrow humiliation adjudication',
  'humiliation_adjudication:${adjudication.category}',
]) assert.ok(provider.includes(required), `missing humiliation adjudication provider contract: ${required}`)

assert.ok(
  provider.indexOf('needsIsolatedHumiliationConfirmation(context, evaluation)') < provider.indexOf('needsInteractiveFearConfirmation(context, evaluation)'),
  'isolated humiliation must be resolved before the existing moderation/fear path can inspect a clean verdict',
)
assert.ok(
  /moderationNeedsFearAdjudication[\s\S]*!evaluation\.approved[\s\S]*!allFalse\(evaluation\.flags\)/u.test(safety),
  'existing isolated moderation violence gate must remain conservative and require a clean semantic verdict',
)
assert.ok(!provider.includes('clear moderation violence because humiliation was false'), 'humiliation adjudication must not directly clear moderation')

console.log('Humiliation adjudication PASS: ordinary shyness can be cleared only by a narrow evidence check, real targeted ridicule stays blocked, and moderation remains independently adjudicated.')
