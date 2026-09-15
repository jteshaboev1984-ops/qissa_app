import fs from 'node:fs'
import { hasSingleLanguageMismatch } from '../supabase/functions/story-generate/language.ts'
import { enforceStoryBlueprintContextContract } from '../supabase/functions/story-generate/story-architecture.ts'
import { normalizeStoryBlueprintMemoryKeys } from '../supabase/functions/story-generate/story-architecture.ts'

const architecture = fs.readFileSync('supabase/functions/story-generate/story-architecture.ts', 'utf8')
const provider = fs.readFileSync('supabase/functions/story-generate/split-openai.ts', 'utf8')
const orchestrator = fs.readFileSync('supabase/functions/story-generate/split-index.ts', 'utf8')
const safety = fs.readFileSync('supabase/functions/story-generate/safety.ts', 'utf8')
const repairPrompt = fs.readFileSync('supabase/functions/story-generate/prompt.ts', 'utf8')
const repairProvider = fs.readFileSync('supabase/functions/story-generate/openai.ts', 'utf8')
const localization = fs.readFileSync('supabase/functions/story-generate/localization.ts', 'utf8')
const languageGuard = fs.readFileSync('supabase/functions/story-generate/language.ts', 'utf8')
const scalingDoc = fs.readFileSync('docs/qissa/17_QISSA_Split_Story_Architecture_and_Series_Scaling_2026_09.md', 'utf8')

const failures = []

const requireFragments = (label, text, fragments) => {
  for (const fragment of fragments) {
    if (!text.includes(fragment)) failures.push(`${label} is missing: ${fragment}`)
  }
}

const requireLanguageGuard = (condition, message) => {
  if (!condition) failures.push(`language guard regression: ${message}`)
}

requireLanguageGuard(hasSingleLanguageMismatch('ru', ['В лесу {{HERO}} увидел green light.']), 'RU must reject Latin leakage')
requireLanguageGuard(!hasSingleLanguageMismatch('ru', ['В лесу {{HERO}} увидел зелёный огонёк.']), 'RU must accept Russian prose')
requireLanguageGuard(hasSingleLanguageMismatch('uz', ['{{HERO}} o‘rmonda yurdi. Потом стало тихо.']), 'UZ must reject Cyrillic leakage')
requireLanguageGuard(!hasSingleLanguageMismatch('uz', ['{{HERO}} o‘rmonda yurdi va mayin chiroqni ko‘rdi.']), 'UZ must accept Uzbek Latin prose')
requireLanguageGuard(hasSingleLanguageMismatch('kz', ['{{HERO}} орманға кірді. Then the light moved.']), 'KZ must reject Latin leakage')
requireLanguageGuard(!hasSingleLanguageMismatch('kz', ['{{HERO}} орманға кіріп, жарыққа жақындады. Құстар үнсіз қалды, өйткені түн тыныш еді.']), 'KZ must accept Kazakh Cyrillic prose')


const memoryKeyRegression = normalizeStoryBlueprintMemoryKeys(
  { canonState: {}, relationshipState: {} },
  {
    state_patch: {
      last_event: '', new_friend: null, hero_trait: null, open_arc: null,
      relationship_updates: [{ key: 'дружба Топы', value: 'Топа доверяет героине.' }],
      canon_updates: [
        { key: 'узор у ручья', value: 'На камнях появился узор.' },
        { key: 'семечко у ручья', value: 'У воды появилось семечко.' },
      ],
    },
    choices: [],
  },
).blueprint
const normalizedCanonKeys = memoryKeyRegression.state_patch.canon_updates.map((entry) => entry.key)
const normalizedRelationshipKeys = memoryKeyRegression.state_patch.relationship_updates.map((entry) => entry.key)
requireLanguageGuard(normalizedCanonKeys.every((key) => key !== 'canon' && /^canon_[a-z0-9]+$/u.test(key)), 'Cyrillic canon keys must hash to stable unique ASCII identifiers')
requireLanguageGuard(new Set(normalizedCanonKeys).size === normalizedCanonKeys.length, 'distinct Cyrillic canon keys must not collapse to the same identifier')
requireLanguageGuard(normalizedRelationshipKeys.every((key) => key !== 'rel' && /^rel_[a-z0-9]+$/u.test(key)), 'Cyrillic relationship keys must hash to stable ASCII identifiers')

requireFragments('architecture', architecture, [
  "plan_version: 'split-v1'",
  'storyBlueprintSchema',
  'storyNarrationSchema',
  'validateStoryBlueprint',
  'narrationToCandidate',
  'The architecture is the source of truth for canon, branch consequences and memory.',
  'The blueprint owns plot, choices, canon, relationships and branch consequences.',
  'Prefer updating an existing canon key when a persistent fact changes.',
  'New canon and relationship keys must be stable lowercase ASCII semantic identifiers',
  'type: context.heroType',
  'patchHasStableMemoryKeys',
  'normalizeStoryBlueprintMemoryKeys',
  'canonicalNewMemoryKey',
  'canonicalizeMemoryEntries',
  'byKey.has(key)',
  'existingCanon.has(entry.key)',
  'existingRelationships.has(entry.key)',
  'never import consequences from an unselected branch.',
  'For Episode 2, continue after the already-confirmed resolution bridge',
  "target_story_words: target",
  'paragraph_budget: paragraphBudget',
  "errors.push('blueprint_language_mismatch')",
  "target_paragraphs: '6-7'",
  "context.episodeIndex === 1 ? '350-390' : '430-490'",
  'Never restate, list, paraphrase, preview, or name either choice action inside story_text',
  'next_episode_preview is child-facing story copy',
  'Episode 2 has no child decision menu',
  'make living forest characters drive the story',
  'central goal must stay warm, social or playful',
  'Do not center the plot on finding the way home',
  'For Uzbek ages 5-7, prefer common natural Uzbek words',
  "choices: context.episodeIndex === 1 ? 'exactly 2' : 'exactly 0'",
  "decision_point: context.episodeIndex === 1 ? 'one non-empty child decision point' : 'empty string'",
  'enforceStoryBlueprintContextContract',
])

requireFragments('Uzbek child language prompt', repairPrompt, [
  'prefer words common in everyday family speech',
  'chorraha, paporotnik, kapyushon, ritm, spiral and tantanali',
])

const continuationBlueprint = enforceStoryBlueprintContextContract(
  { episodeIndex: 2 },
  {
    plan_version: 'split-v1', central_goal: 'Продолжить историю', setting_anchor: 'лес', continuity_callbacks: [], beats: ['один спокойный шаг', 'второй спокойный шаг', 'третий спокойный шаг', 'тихий финал'],
    decision_point: 'Ошибочный новый выбор',
    choices: [{ choice_id: 'wrong', text: 'Новый выбор', effect_summary: 'ошибка', resolution_goal: 'ошибка', tomorrow_seed: '', choice_icon: '✨', state_patch: { last_event: '', new_friend: null, hero_trait: null, open_arc: null, relationship_updates: [], canon_updates: [] }, value_alignment: ['kindness'] }],
    state_patch: { last_event: '', new_friend: null, hero_trait: null, open_arc: null, relationship_updates: [], canon_updates: [] },
    next_episode_preview: 'Ошибочный preview',
  },
)
if (continuationBlueprint.choices.length !== 0 || continuationBlueprint.decision_point !== '' || continuationBlueprint.next_episode_preview !== '') {
  failures.push('Episode 2 context contract must deterministically remove choices, decision point and preview before blueprint validation')
}

const narrationSchemaStart = architecture.indexOf('export const storyNarrationSchema')
const narrationSchemaEnd = architecture.indexOf('const languageNames', narrationSchemaStart)
const narrationSchema = architecture.slice(narrationSchemaStart, narrationSchemaEnd)
for (const forbidden of ['state_patch', 'canon_updates', 'relationship_updates', 'tomorrow_seed', 'effect_summary']) {
  if (narrationSchema.includes(forbidden)) failures.push(`Narrator schema must not own ${forbidden}`)
}

if ((provider.match(/storyLocalizationSystem\(context\)/g) ?? []).length < 2) {
  failures.push('Architect and Narrator must both use storyLocalizationSystem')
}

requireFragments('language guard', languageGuard, [
  'hasSingleLanguageMismatch',
  "language === 'ru'",
  "language === 'uz'",
  'kazakhSpecificCount',
])

requireFragments('candidate language validation', safety, [
  "errors.push('story_language_mismatch')",
  'candidateLanguageValues',
  "errors.push('visible_safety_language')",
  'visibleSafetyLanguageNeedsRewrite',
  'genderedPastWord',
])

requireFragments('split provider', provider, [
  'generateStoryBlueprint',
  'generateStoryNarration',
  "'qissa_story_blueprint'",
  "'qissa_story_narration'",
  '1800',
  '3200',
  "'none'",
])

requireFragments('split orchestrator', orchestrator, [
  "'X-QISSA-Story-Pipeline': 'split-v1'",
  "'gpt-5.6-luna'",
  "OPENAI_NARRATOR_ESCALATION_MODEL",
  "|| ''",
  'validateStoryBlueprint(context, blueprint)',
  'narrationToCandidate(context, blueprint, narration)',
  'repairStoryCandidateTextLengths',
  'bedtime_coda_too_short',
  'bedtime_coda_too_long',
  'evaluateStorySafety',
  'moderateStoryText',
  "'X-QISSA-Provider-Calls'",
  "'X-QISSA-Narrator-Retry-Used'",
  'narratorRetryUsed = true',
  'Previous narration failed deterministic validation',
  'For visible_safety_language',
  'For story_language_mismatch',
  'For story_repeats_choice_menu',
  'For technical_preview_language',
  'For story_choice_menu_scaffolding',
  'For branching_preview_language',
  "'X-QISSA-Initial-Story-Words'",
  "'X-QISSA-Final-Story-Words'",
  'runtimeProviderMetadata',
  "'X-QISSA-Runtime-AI'",
  "'X-QISSA-Generation-Source': 'openai-structured'",
  "'X-QISSA-Escalation-Used'",
])

const runtimeMetadataPosition = orchestrator.indexOf('const runtimeProviderMetadata')
const providerSuccessPosition = orchestrator.indexOf("'X-QISSA-Generation-Source': 'openai-structured'")
const runtimeOnSuccessPosition = orchestrator.lastIndexOf('...runtimeProviderMetadata', providerSuccessPosition)
if (!(runtimeMetadataPosition >= 0 && runtimeOnSuccessPosition > runtimeMetadataPosition && runtimeOnSuccessPosition < providerSuccessPosition)) {
  failures.push('openai-structured success response must carry X-QISSA-Runtime-AI metadata')
}

if (orchestrator.includes("OPENAI_NARRATOR_ESCALATION_MODEL')?.trim() || 'gpt-5.6-sol'")) {
  failures.push('Sol escalation must remain opt-in during tuning')
}

requireFragments('Episode 2 text repair prompt', repairPrompt, [
  'rewriteContinuation',
  'final_bedtime_coda_words',
  '60-120 words in the final paragraph',
  'same Episode 2 plot, same selected-choice consequence',
])

requireFragments('interactive fear confirmation', repairProvider, [
  'needsInteractiveFearConfirmation',
  'previous internally consistent verdict flagged only excessive_fear',
  'Maximum semantic-safety calls on this path remain two',
  'Do not clear any real safety issue',
])

requireFragments('split safety session contract', repairProvider, [
  'Do NOT set excessive_fear merely because the central low-stakes goal is not fully solved before the child chooses',
  'Ordinary evening darkness, rain, a brief worry',
  'sustained panic, threatening pursuit, abandonment, trapping, serious injury',
])

requireFragments('Episode 2 text repair provider', repairProvider, [
  'codaLengthFailure',
  'rewriteContinuation',
  'openai_invalid_continuation_text_repair_rewrite',
])

requireFragments('Uzbek localization', localization, [
  'prefer common everyday Uzbek words and short direct sentences',
  'Do not make Uzbek sound artificially old-fashioned or overly poetic',
])

requireFragments('scaling architecture doc', scalingDoc, [
  'bedtime session',
  'series_id',
  'session_id',
  'session_index',
  'segment_index',
  'compact active memory',
  'old story prose remains archived outside the prompt',
])

if (failures.length > 0) {
  console.error('Split Story AI architecture contract check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Split Story AI contract passed: Architect owns canon/branches, Narrator owns prose only, selected language and publication-quality validators are enforced, runtime AI state is observable on provider success, Luna is default, Sol escalation is opt-in, and long-series identity/memory scaling is documented.')
