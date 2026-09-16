import fs from 'node:fs'
import { hasSingleLanguageMismatch } from '../supabase/functions/story-generate/language.ts'
import { buildArchitectPrompts, enforceStoryBlueprintContextContract, validateStoryBlueprint } from '../supabase/functions/story-generate/story-architecture.ts'
import { normalizeStoryBlueprintHeroReferences, normalizeStoryBlueprintMemoryKeys } from '../supabase/functions/story-generate/story-architecture.ts'
import { finalPatchFromCandidate, normalizeStoryRequest } from '../supabase/functions/story-generate/contracts.ts'
import { isTextRepairEligibleFailure, textRepairRequiresFullStoryRewrite, textRepairableValidationErrors, textRepairShouldRepairAllChoiceResolutions } from '../supabase/functions/story-generate/repair-routing.ts'

const architecture = fs.readFileSync('supabase/functions/story-generate/story-architecture.ts', 'utf8')
const provider = fs.readFileSync('supabase/functions/story-generate/split-openai.ts', 'utf8')
const orchestrator = fs.readFileSync('supabase/functions/story-generate/split-index.ts', 'utf8')
const repairRouting = fs.readFileSync('supabase/functions/story-generate/repair-routing.ts', 'utf8')
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
requireLanguageGuard(!hasSingleLanguageMismatch('uz', ['Рыжик Malika bilan o‘rmonda yurdi.'], ['Рыжик']), 'UZ must allow one established Cyrillic recurring-character identity label')
requireLanguageGuard(hasSingleLanguageMismatch('uz', ['Рыжик Malika bilan yurdi. Потом стало тихо.'], ['Рыжик']), 'UZ must still reject unrelated Cyrillic prose after stripping an allowed recurring name')
requireLanguageGuard(!hasSingleLanguageMismatch('kz', ['Momiq орманда жай жүрді.'], ['Momiq']), 'KZ must allow an established Latin recurring-character identity label')
requireLanguageGuard(hasSingleLanguageMismatch('kz', ['{{HERO}} орманға кірді. Then the light moved.']), 'KZ must reject Latin leakage')
requireLanguageGuard(!hasSingleLanguageMismatch('kz', ['{{HERO}} орманға кіріп, жарыққа жақындады. Құстар үнсіз қалды, өйткені түн тыныш еді.']), 'KZ must accept Kazakh Cyrillic prose')

const repairRouteContext = { episodeIndex: 1 }
for (const errors of [
  ['story_too_short'],
  ['story_too_short', 'missing_hero_token'],
  ['story_too_short', 'generic_hero_alias_requires_rewrite'],
  ['story_too_short', 'uzbek_child_language_requires_rewrite'],
  ['story_too_short', 'story_language_mismatch'],
  ['story_too_short', 'visible_safety_language'],
  ['story_too_short', 'insufficient_narrative_beats'],
  ['story_too_short', 'story_repeats_choice_menu'],
  ['story_too_short', 'story_choice_menu_scaffolding'],
  ['choice_resolution_too_short', 'choice_resolution_defers_to_future_session'],
  ['invalid_title'],
  ['invalid_resolution_text'],
  ['invalid_vocabulary_count'],
  ['unexpected_vocabulary'],
]) {
  requireLanguageGuard(isTextRepairEligibleFailure(errors), `repair routing must cover mixed narration errors: ${errors.join(',')}`)
}
requireLanguageGuard(textRepairRequiresFullStoryRewrite(repairRouteContext, ['story_too_short', 'uzbek_child_language_requires_rewrite']), 'existing Uzbek language defects plus short text must use a full rewrite, not insertion')
requireLanguageGuard(textRepairRequiresFullStoryRewrite(repairRouteContext, ['generic_hero_alias_requires_rewrite']), 'duplicate generic hero identity must use a full rewrite so the second pseudo-character cannot survive')
requireLanguageGuard(!textRepairRequiresFullStoryRewrite(repairRouteContext, ['story_too_short']), 'pure Episode 1 short text should keep the cheaper insertion repair')
requireLanguageGuard(textRepairRequiresFullStoryRewrite(repairRouteContext, ['story_too_long']), 'Episode 1 story_too_long must use full rewrite because insertion cannot shorten prose')
requireLanguageGuard(textRepairShouldRepairAllChoiceResolutions(['invalid_resolution_text']), 'malformed resolution text must target the structured choice resolution rather than no-op repair')
requireLanguageGuard(!isTextRepairEligibleFailure(['invalid_choice_count', 'story_too_short']), 'structural/Architect-owned failures must not be sent to prose repair')

const candidateValidatorErrors = new Set([
  'candidate_not_object',
  ...[...safety.matchAll(/errors\.push\('([^']+)'\)/gu)].map((match) => match[1]),
])
const architectOrSchemaOwnedCandidateErrors = new Set([
  'candidate_not_object', 'invalid_story_text', 'invalid_choice_count', 'invalid_choice', 'invalid_choice_id',
  'invalid_choice_text', 'invalid_effect_summary', 'invalid_tomorrow_seed', 'invalid_choice_icon',
  'invalid_choice_state_patch', 'invalid_value_alignment', 'invalid_state_patch', 'invalid_vocabulary',
  'invalid_preview', 'missing_preview', 'technical_preview_language', 'branching_preview_language', 'unexpected_preview',
])
const unclassifiedCandidateErrors = [...candidateValidatorErrors].filter((error) =>
  !textRepairableValidationErrors.has(error) && !architectOrSchemaOwnedCandidateErrors.has(error))
requireLanguageGuard(unclassifiedCandidateErrors.length === 0, `every candidate validator outcome must be classified before live AI; unclassified=${unclassifiedCandidateErrors.join(',')}`)


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

const resolvedHeroPatch = finalPatchFromCandidate({
  last_event: '{{HERO}} To‘pchaga yordam berdi.', new_friend: 'To‘pcha', hero_trait: 'mehribon', open_arc: '{{HERO}} va To‘pchaning do‘stligi',
  relationship_updates: [{ key: 'topcha', value: 'To‘pcha {{HERO}}ga ishonadi.' }],
  canon_updates: [{ key: 'topcha_game', value: '{{HERO}} To‘pchaning o‘yinini biladi.' }],
}, 'Malika')
requireLanguageGuard(resolvedHeroPatch.last_event === 'Malika To‘pchaga yordam berdi.', 'persisted state must resolve {{HERO}} to the canonical series hero name')
requireLanguageGuard(resolvedHeroPatch.relationship_updates?.topcha.includes('Malika') === true && !resolvedHeroPatch.relationship_updates?.topcha.includes('{{HERO}}'), 'persisted relationship memory must not leak the raw hero token')


const switchedLanguageContext = normalizeStoryRequest({
  selections: {
    ageGroup: '5-7', language: 'uz', heroType: 'girl_hero', stylePackId: 'cozy_forest', storyMode: 'series', storyMood: 'bedtime',
  },
  seriesState: {
    id: 'language-switch-series', mainCharacter: 'Алия', recurringCharacters: ['Рыжик', 'Ульяна'],
    lastEpisodeSummary: 'Рыжик и Ульяна уже стали друзьями героини.', activeArc: 'Тихая лесная история продолжается.',
    relationshipState: {}, canonState: {}, choiceHistory: [], episodeCount: 0,
  },
})
const badImmutableUzBlueprint = {
  plan_version: 'split-v1', central_goal: 'Momiqqa sovg‘a tayyorlash', setting_anchor: 'o‘rmon', continuity_callbacks: [],
  beats: ['Momiq do‘stlarini chaqiradi', 'Do‘stlar sovg‘a haqida gaplashadi', 'Ular birga tayyorlanadi', 'Malika qaror beradi'],
  decision_point: 'Malika qaysi yo‘lni tanlaydi?',
  choices: [
    { choice_id: 'a', text: 'Ritm bilan qo‘shiq aytish', effect_summary: 'Do‘stlar qo‘shiq tayyorlaydi', resolution_goal: 'Qo‘shiq tayyor bo‘ladi', tomorrow_seed: 'Do‘stlar sovg‘ani ko‘rsatadi', choice_icon: '🎵', state_patch: { last_event: 'a', new_friend: null, hero_trait: null, open_arc: 'arc', relationship_updates: [], canon_updates: [] }, value_alignment: ['friendship'] },
    { choice_id: 'b', text: 'Bargdan rasm yasash', effect_summary: 'Do‘stlar rasm tayyorlaydi', resolution_goal: 'Rasm tayyor bo‘ladi', tomorrow_seed: 'Do‘stlar sovg‘ani ko‘rsatadi', choice_icon: '🍃', state_patch: { last_event: 'b', new_friend: null, hero_trait: null, open_arc: 'arc', relationship_updates: [], canon_updates: [] }, value_alignment: ['kindness'] },
  ],
  state_patch: { last_event: 'start', new_friend: 'Momiq', hero_trait: null, open_arc: 'arc', relationship_updates: [], canon_updates: [] },
  next_episode_preview: 'Momiq bilan keyingi epizod davom etadi.',
}
const badBlueprintErrors = validateStoryBlueprint({ language: 'uz', ageGroup: '5-7', episodeIndex: 1, storyMode: 'series', storyMood: 'bedtime', isFinalSeriesSession: false, recurringCharacters: [], canonState: {}, relationshipState: {} }, badImmutableUzBlueprint)
requireLanguageGuard(badBlueprintErrors.includes('blueprint_uzbek_child_language_requires_rewrite'), 'immutable Uzbek choice/preview vocabulary must fail at Architect validation before Narrator')
requireLanguageGuard(badBlueprintErrors.includes('blueprint_technical_preview_language'), 'technical preview wording must fail at Architect validation before Narrator')
const unsafeBlueprint = structuredClone(badImmutableUzBlueprint)
unsafeBlueprint.central_goal = 'Do‘stlar qon haqida gaplashadi'
const unsafeBlueprintErrors = validateStoryBlueprint({ language: 'uz', ageGroup: '5-7', episodeIndex: 1, storyMode: 'series', storyMood: 'bedtime', isFinalSeriesSession: false, recurringCharacters: [], canonState: {}, relationshipState: {} }, unsafeBlueprint)
requireLanguageGuard(unsafeBlueprintErrors.includes('blueprint_rule_safety'), 'deterministic safety present in Architect output must fail before the paid Narrator stage')

const heroNeutralStateContext = {
  language: 'uz', heroType: 'girl_hero', ageGroup: '5-7', episodeIndex: 1, storyMode: 'series', storyMood: 'bedtime',
  isFinalSeriesSession: false, recurringCharacters: [], canonState: {}, relationshipState: {},
}
const heroNeutralStateBlueprint = {
  plan_version: 'split-v1',
  central_goal: 'Momiqqa sovg‘a tayyorlash',
  setting_anchor: 'shinam o‘rmon',
  continuity_callbacks: [],
  beats: [
    '{{HERO}} Momiq bilan sovg‘a haqida gaplashadi',
    'Momiq ikki oddiy fikrni ko‘rsatadi',
    '{{HERO}} do‘stlar bilan ikkalasini sinab ko‘radi',
    '{{HERO}} bittasini tanlashga tayyor bo‘ladi',
  ],
  decision_point: 'Qaysi sovg‘adan boshlaymiz?',
  choices: [
    {
      choice_id: 'choice-a', text: 'Barglardan rasm yasash',
      effect_summary: '{{HERO}} Momiq bilan barglardan rasm yasaydi.',
      resolution_goal: '{{HERO}} rasmni Momiqqa tayyorlab beradi.',
      tomorrow_seed: 'Momiq sovg‘ani akasiga ko‘rsatadi.', choice_icon: '🎁',
      state_patch: { last_event: 'Barglardan rasm tayyor bo‘ldi', new_friend: null, hero_trait: null, open_arc: 'Momiq sovg‘asi', relationship_updates: [], canon_updates: [] },
      value_alignment: ['kindness'],
    },
    {
      choice_id: 'choice-b', text: 'Sokin qo‘shiq aytish',
      effect_summary: '{{HERO}} Momiq bilan sokin qo‘shiq aytadi.',
      resolution_goal: '{{HERO}} Momiqqa sokin qo‘shiq tayyorlab beradi.',
      tomorrow_seed: 'Momiq qo‘shiqni akasiga aytadi.', choice_icon: '🎵',
      state_patch: { last_event: 'Sokin qo‘shiq tayyor bo‘ldi', new_friend: null, hero_trait: null, open_arc: 'Momiq sovg‘asi', relationship_updates: [], canon_updates: [] },
      value_alignment: ['friendship'],
    },
  ],
  state_patch: { last_event: 'Momiq akasi uchun sovg‘a tayyorlamoqchi', new_friend: 'Momiq', hero_trait: null, open_arc: 'Momiq sovg‘asi', relationship_updates: [], canon_updates: [] },
  next_episode_preview: 'Momiq sovg‘ani akasiga ko‘rsatishga tayyorlanadi.',
}
const heroNeutralStateErrors = validateStoryBlueprint(heroNeutralStateContext, heroNeutralStateBlueprint)
requireLanguageGuard(!heroNeutralStateErrors.includes('blueprint_state_missing_hero_token'), 'hero-neutral top-level last_event must not be rejected merely for omitting {{HERO}}')
requireLanguageGuard(!heroNeutralStateErrors.includes('blueprint_choice_state_missing_hero_token'), 'hero-neutral choice last_event must not be rejected merely for omitting {{HERO}}')

const duplicateHeroInStateBlueprint = structuredClone(heroNeutralStateBlueprint)
duplicateHeroInStateBlueprint.choices[0].state_patch.last_event = 'Qizaloq barglardan rasm tayyorladi.'
const duplicateHeroInStateErrors = validateStoryBlueprint(heroNeutralStateContext, duplicateHeroInStateBlueprint)
requireLanguageGuard(duplicateHeroInStateErrors.includes('blueprint_generic_hero_alias_requires_rewrite'), 'generic qizaloq identity inside state memory must still fail before Narrator')

const resultCenteredResolutionBlueprint = structuredClone(heroNeutralStateBlueprint)
resultCenteredResolutionBlueprint.choices[0].resolution_goal = 'Momiq tayyor rasmni ikki panjasi bilan ehtiyotkor ushlaydi.'
const resultCenteredBefore = validateStoryBlueprint(heroNeutralStateContext, resultCenteredResolutionBlueprint)
requireLanguageGuard(resultCenteredBefore.includes('blueprint_choice_resolution_goal_missing_hero_token'), 'result-centered resolution goal should expose the missing hero anchor before normalization')
const resultCenteredNormalized = normalizeStoryBlueprintHeroReferences(resultCenteredResolutionBlueprint)
const resultCenteredAfter = validateStoryBlueprint(heroNeutralStateContext, resultCenteredNormalized.blueprint)
requireLanguageGuard(resultCenteredNormalized.normalizedCount === 1, 'exactly one result-centered resolution goal should be deterministically hero-anchored')
requireLanguageGuard(!resultCenteredAfter.includes('blueprint_choice_resolution_goal_missing_hero_token'), 'hero-bearing effect_summary must safely anchor a result-centered resolution_goal without another provider call')
requireLanguageGuard(resultCenteredNormalized.blueprint.choices[0].resolution_goal.includes('{{HERO}}'), 'normalized resolution_goal must inherit the canonical hero token from immutable effect_summary')

const missingBothHeroAnchorsBlueprint = structuredClone(heroNeutralStateBlueprint)
missingBothHeroAnchorsBlueprint.choices[0].effect_summary = 'Momiq tayyor rasmni ko‘radi.'
missingBothHeroAnchorsBlueprint.choices[0].resolution_goal = 'Momiq rasmni ikki panjasi bilan ushlaydi.'
const missingBothNormalized = normalizeStoryBlueprintHeroReferences(missingBothHeroAnchorsBlueprint)
const missingBothErrors = validateStoryBlueprint(heroNeutralStateContext, missingBothNormalized.blueprint)
requireLanguageGuard(missingBothNormalized.normalizedCount === 0, 'normalizer must not invent hero participation when both branch consequence fields omit the hero')
requireLanguageGuard(missingBothErrors.includes('blueprint_choice_effect_missing_hero_token') && missingBothErrors.includes('blueprint_choice_resolution_goal_missing_hero_token'), 'missing hero in both branch consequence fields must remain fail-closed')

const aliasInResolutionBlueprint = structuredClone(resultCenteredResolutionBlueprint)
aliasInResolutionBlueprint.choices[0].resolution_goal = 'Qizaloq rasmni Momiqqa beradi.'
const aliasInResolutionNormalized = normalizeStoryBlueprintHeroReferences(aliasInResolutionBlueprint)
const aliasInResolutionErrors = validateStoryBlueprint(heroNeutralStateContext, aliasInResolutionNormalized.blueprint)
requireLanguageGuard(aliasInResolutionErrors.includes('blueprint_generic_hero_alias_requires_rewrite'), 'deterministic resolution-goal anchoring must not hide a generic qizaloq duplicate identity')

if (!switchedLanguageContext) {
  failures.push('language switch continuity context failed to normalize')
} else {
  requireLanguageGuard(switchedLanguageContext.heroName === 'Алия', 'changing story language must preserve the established hero name from series state')
  requireLanguageGuard(switchedLanguageContext.recurringCharacters.join('|') === 'Рыжик|Ульяна', 'changing story language must preserve established recurring-character names exactly')
  const switchedPrompts = buildArchitectPrompts(switchedLanguageContext)
  requireLanguageGuard(switchedPrompts.user.includes('Рыжик') && switchedPrompts.user.includes('Ульяна'), 'architect memory must carry established names unchanged after a language switch')
}

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
  'normalizeStoryBlueprintHeroReferences',
  'canonicalNewMemoryKey',
  'canonicalizeMemoryEntries',
  'byKey.has(key)',
  'existingCanon.has(entry.key)',
  'existingRelationships.has(entry.key)',
  'never import consequences from an unselected branch.',
  'For Episode 2, the confirmed resolution_text in memory has ALREADY been shown to the child before this segment starts.',
  "target_story_words: target",
  'paragraph_budget: paragraphBudget',
  "errors.push('blueprint_language_mismatch')",
  "target_paragraphs: '6-7'",
  "context.episodeIndex === 1 ? '380-420' : '430-490'",
  'Never restate, list, paraphrase, preview, or name either choice action inside story_text',
  'next_episode_preview is child-facing story copy',
  'Episode 2 has no child decision menu',
  'make living forest characters drive the story',
  'central goal must stay warm, social or playful',
  'Do not center the plot on finding the way home',
  'For Uzbek ages 5-7, prefer common natural Uzbek words',
  'Avoid words such as ritm, pauza, sincap, mox',
  'Existing recurring-character names are canonical identity labels',
  'selected language governs only names and nicknames of newly introduced supporting characters',
  'Any NEW ordinary supporting-character name or nickname must use Uzbek Latin spelling',
  'Character identity is immutable',
  'state_patch.new_friend is singular',
  'tomorrow_seed is reserved only as a possible hook for a future bedtime session',
  'same bedtime session and same evening',
  'never say tomorrow, morning, next day, ertaga, ertalab, keyingi kuni',
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
  'context.recurringCharacters',
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
  'normalizeStoryBlueprintHeroReferences(blueprint).blueprint',
  'validateStoryBlueprint(context, blueprint)',
  'narrationToCandidate(context, blueprint, narration)',
  'repairStoryCandidateTextLengths',
  'evaluateStorySafety',
  'moderateStoryText',
  'moderationNeedsFearAdjudication',
  'adjudicateStoryFear',
  'clearAdjudicatedNonSevereViolence',
  'moderation_fear_adjudication:',
  'childVisibleStorySafetyText(candidate)',
  'fear_adjudication:[a-z_]+',
  'evaluationFlags',
  'moderationCategories',
  "'eval=clear'",
  "'mod=clear'",
  "'X-QISSA-Provider-Calls'",
  "'X-QISSA-Narrator-Retry-Used'",
  'deterministic-safety-pre-repair',
  'nonrepairable-validation',
  'isTextRepairEligibleFailure',
  'isTextRepairCorrectionEligible',
  'repairRetryUsed = true',
  'Previous text repair failed deterministic validation',
  "'X-QISSA-Repair-Retry-Used'",
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

if (orchestrator.includes('narratorRetryUsed = true') || orchestrator.includes('Previous narration failed deterministic validation')) {
  failures.push('Narrator deterministic defects must route directly to bounded repair; a redundant full Narrator retry wastes provider calls')
}

const preRepairSafetyPosition = orchestrator.indexOf('const initialRuleFlags = scanRuleBasedSafety')
const repairCallPosition = orchestrator.indexOf('repairStoryCandidateTextLengths(', preRepairSafetyPosition)
if (!(preRepairSafetyPosition >= 0 && repairCallPosition > preRepairSafetyPosition)) {
  failures.push('deterministic safety must run before any paid text-repair call')
}

if (orchestrator.includes("OPENAI_NARRATOR_ESCALATION_MODEL')?.trim() || 'gpt-5.6-sol'")) {
  failures.push('Sol escalation must remain opt-in during tuning')
}

requireFragments('centralized repair routing', repairRouting, [
  'bedtime_coda_too_short',
  'bedtime_coda_too_long',
  'uzbek_child_language_requires_rewrite',
  'visible_safety_language',
  'russian_hero_requires_rewrite',
  'insufficient_narrative_beats',
  'story_repeats_choice_menu',
  'story_choice_menu_scaffolding',
  'isTextRepairEligibleFailure',
  'textRepairRequiresFullStoryRewrite',
])

requireFragments('Episode 2 text repair prompt', repairPrompt, [
  'fullStoryRewrite',
  'final_bedtime_coda_words',
  '60-120 words in the final paragraph',
  'same Episode 2 plot, same selected-choice consequence',
  'validation_errors includes missing_hero_token',
  'tomorrow_seed is future-session metadata only',
  'retry_feedback: retryFeedback',
  'previous text repair failed deterministic validation',
  'title_rewrite',
  'vocabulary_rewrite',
  'textRepairRequiresFullStoryRewrite',
  'For Uzbek repair prose, use natural Uzbek Latin script',
  'avoid ritm, pauza, sincap, mox',
])

requireFragments('interactive fear adjudication', repairProvider, [
  'needsInteractiveFearConfirmation',
  'requestFearAdjudication',
  'narrow child-bedtime fear adjudicator',
  'fearAdjudicationConsistencyErrors(adjudication',
  'isolated excessive_fear was not confirmed by narrow fear adjudication',
])

requireFragments('split safety session contract', repairProvider, [
  'Do NOT set excessive_fear merely because the central low-stakes goal is not fully solved before the child chooses',
  'Ordinary evening darkness, rain, a brief worry',
  'sustained panic, threatening pursuit, abandonment, trapping, serious injury',
])

requireFragments('Episode 2 text repair routing', repairPrompt, [
  'codaTooShort',
  'codaTooLong',
  'textRepairRequiresFullStoryRewrite',
  'buildTextLengthRepairOutputSchema',
])
requireFragments('Episode 2 text repair provider', repairProvider, [
  'fullStoryRewrite',
  'openai_invalid_full_text_repair_rewrite',
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

requireFragments('repair contract observability', orchestrator, [
  'repairContractFailureCodes',
  'repairContractFailureDetail',
  "lastFailureClass = repairContractDetail ? 'repair-contract' : providerFailureClass(reason)",
  'repair-contract',
])

requireFragments('hero identity continuity v77', architecture, [
  'The protagonist identity token is literal {{HERO}}',
  "errors.push('blueprint_choice_effect_missing_hero_token')",
  "errors.push('blueprint_choice_resolution_goal_missing_hero_token')",
  "identity_token: '{{HERO}}'",
  'confirmed_choice_bridge',
  'has ALREADY been shown to the child before this segment starts',
  'Already consumed before this narration begins',
  'Do not spend consecutive beats on the trajectory, target, positioning or repeated mechanics',
])
requireFragments('hero identity candidate repair v76', safety + repairRouting + repairPrompt, [
  'genericHeroAliasNeedsRewrite',
  'generic_hero_alias_requires_rewrite',
])

if (failures.length > 0) {
  console.error('Split Story AI architecture contract check failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Split Story AI contract passed: Architect owns canon/branches, Narrator owns prose only, selected language and publication-quality validators are enforced, runtime AI state is observable on provider success, Luna is default, Sol escalation is opt-in, and long-series identity/memory scaling is documented.')
