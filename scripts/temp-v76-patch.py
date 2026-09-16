from pathlib import Path


def replace_once(path: str, old: str, new: str, label: str) -> None:
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f'{label}: target not found')
    p.write_text(text.replace(old, new, 1))

# 1) Candidate-side hero identity guard: if the raw story already contains {{HERO}},
# a second generic hero-role label is ambiguous and must be rewritten.
safety = 'supabase/functions/story-generate/safety.ts'
insert_anchor = "const unicodeWordStart = '(?<![\\\\p{L}\\\\p{N}_])'"
generic_guard = r'''const genericHeroRoleAliasPattern = (
  language: NormalizedStoryContext['language'],
  heroType: NormalizedStoryContext['heroType'],
): RegExp | null => {
  const aliases: Partial<Record<NormalizedStoryContext['language'], Partial<Record<NormalizedStoryContext['heroType'], string>>>> = {
    ru: {
      girl_hero: 'девочк(?:а|и|е|у|ой|ою)',
      boy_hero: 'мальчик(?:а|у|ом|е|и)?',
    },
    uz: {
      girl_hero: 'qizaloq(?:ning|ni|ga|da|dan)?',
      boy_hero: "o'g'il\\s+bola(?:ning|ni|ga|da|dan)?",
    },
    kz: {
      girl_hero: 'қыз(?:дың|ға|ды|да|дан|бен)?',
      boy_hero: 'ұл(?:дың|ға|ды|да|дан|мен)?',
    },
  }
  const alias = aliases[language]?.[heroType]
  return alias
    ? new RegExp(`(?<![\\p{L}\\p{M}\\p{N}_])(?:${alias})(?![\\p{L}\\p{M}\\p{N}_])`, 'iu')
    : null
}

export const genericHeroAliasNeedsRewrite = (
  context: Pick<NormalizedStoryContext, 'language' | 'heroType'>,
  values: Array<string | null | undefined>,
): boolean => {
  const pattern = genericHeroRoleAliasPattern(context.language, context.heroType)
  if (!pattern) return false
  const text = values
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .replace(/[\u2018\u2019\u02BB`]/g, "'")
    .toLocaleLowerCase()
  if (!text.includes('{{hero}}') && !text.includes('qissa_hero')) return false
  return pattern.test(text)
}

'''
replace_once(safety, insert_anchor, generic_guard + insert_anchor, 'insert generic hero alias guard')
replace_once(
    safety,
    "  if (uzbekChildLanguageNeedsRewrite(context, value)) errors.push('uzbek_child_language_requires_rewrite')\n\n  if (context.language === 'ru') {",
    "  if (uzbekChildLanguageNeedsRewrite(context, value)) errors.push('uzbek_child_language_requires_rewrite')\n  if (genericHeroAliasNeedsRewrite(context, candidateLanguageValues(value))) errors.push('generic_hero_alias_requires_rewrite')\n\n  if (context.language === 'ru') {",
    'candidate generic hero validation',
)

# 2) Route this prose/identity defect through the existing full-story repair rather than
# adding a new paid generation path.
routing = 'supabase/functions/story-generate/repair-routing.ts'
replace_once(
    routing,
    "  'missing_hero_token',\n  'insufficient_narrative_beats',",
    "  'missing_hero_token',\n  'generic_hero_alias_requires_rewrite',\n  'insufficient_narrative_beats',",
    'repairable generic hero alias',
)
replace_once(
    routing,
    "  'missing_hero_token',\n  'insufficient_narrative_beats',",
    "  'missing_hero_token',\n  'generic_hero_alias_requires_rewrite',\n  'insufficient_narrative_beats',",
    'full rewrite generic hero alias',
)

# 3) Make the repair contract explicitly collapse duplicated generic hero labels back to {{HERO}}
# and keep Uzbek 5-7 language concrete without growing a brittle hard-ban list.
prompt = 'supabase/functions/story-generate/prompt.ts'
replace_once(
    prompt,
    "    'The hero name remains the literal token {{HERO}}. Never invent or expose a real child name. If validation_errors includes missing_hero_token, the repaired story_rewrite or story_expansion must naturally contain {{HERO}} as the in-world protagonist so the final story_text contains the token. In Russian, use {{HERO}} only as a nominative subject or direct address and use grammatically invariant phrasing such as present-tense action; never put the token after a preposition or directly before a gendered past-tense verb.',",
    "    'The hero name remains the literal token {{HERO}}. Never invent or expose a real child name. If validation_errors includes missing_hero_token, the repaired story_rewrite or story_expansion must naturally contain {{HERO}} as the in-world protagonist so the final story_text contains the token. If validation_errors includes generic_hero_alias_requires_rewrite, remove the duplicate generic role label and use only {{HERO}} for that protagonist; do not turn qizaloq, o\\'g\\'il bola, девочка, мальчик, қыз or ұл into a second child. In Russian, use {{HERO}} only as a nominative subject or direct address and use grammatically invariant phrasing such as present-tense action; never put the token after a preposition or directly before a gendered past-tense verb.',",
    'repair hero identity instruction',
)
replace_once(
    prompt,
    "      ? 'For Uzbek repair prose, use natural Uzbek Latin script. Do not introduce Cyrillic text. Existing recurring-character identity labels supplied by immutable context remain unchanged. For ages 5-7 use simple everyday Uzbek and avoid ritm, pauza, sincap, mox, paporotnik, kapyushon, spiral, tantanali, chorraha, naqadar, minnatdorlik, mamnun, sukunat and hissa when a simpler child-level phrase exists.'",
    "      ? 'For Uzbek repair prose, use natural Uzbek Latin script. Do not introduce Cyrillic text. Existing recurring-character identity labels supplied by immutable context remain unchanged. For ages 5-7 use simple everyday Uzbek and avoid ritm, pauza, sincap, mox, paporotnik, kapyushon, spiral, tantanali, chorraha, naqadar, minnatdorlik, mamnun, sukunat and hissa when a simpler child-level phrase exists. When equally accurate, prefer uyaldi over xijolat bo\\'ldi, a direct concrete action over dadilroq or qulay payt, and shu kunni eslatdi over an abstract esdalikdek tuyuldi sentence.'",
    'repair Uzbek concrete language instruction',
)
replace_once(
    prompt,
    "    task: 'Repair only deterministic text-length violations in the existing candidate.',",
    "    task: 'Repair only deterministic prose, identity, language or text-length violations in the existing candidate.',",
    'repair task wording',
)

# 4) Architect/Narrator continuity: make {{HERO}} the one canonical protagonist token inside
# blueprint facts, and expose the already-consumed choice bridge explicitly to Episode 2.
arch = 'supabase/functions/story-generate/story-architecture.ts'
replace_once(
    arch,
    "import { branchingPreviewNeedsRewrite, scanRuleBasedSafetyValues, technicalPreviewLanguageNeedsRewrite, uzbekYoungChildValuesNeedRewrite, visibleSafetyLanguageNeedsRewrite } from './safety.ts'",
    "import { branchingPreviewNeedsRewrite, genericHeroAliasNeedsRewrite, scanRuleBasedSafetyValues, technicalPreviewLanguageNeedsRewrite, uzbekYoungChildValuesNeedRewrite, visibleSafetyLanguageNeedsRewrite } from './safety.ts'",
    'architecture generic alias import',
)
replace_once(
    arch,
    "  const naturalLanguageBlueprint = blueprintNaturalLanguageValues(value)\n  if (hasSingleLanguageMismatch(context.language, naturalLanguageBlueprint, context.recurringCharacters)) errors.push('blueprint_language_mismatch')",
    "  const naturalLanguageBlueprint = blueprintNaturalLanguageValues(value)\n  if (genericHeroAliasNeedsRewrite(context, naturalLanguageBlueprint)) errors.push('blueprint_generic_hero_alias_requires_rewrite')\n  if (hasSingleLanguageMismatch(context.language, naturalLanguageBlueprint, context.recurringCharacters)) errors.push('blueprint_language_mismatch')",
    'blueprint generic alias validation',
)
replace_once(
    arch,
    "  if (!patchIsValid(value.state_patch)) errors.push('invalid_blueprint_state_patch')\n  else {\n    if (value.state_patch.canon_updates.length > 8) errors.push('blueprint_state_too_large')",
    "  if (!patchIsValid(value.state_patch)) errors.push('invalid_blueprint_state_patch')\n  else {\n    if (!textContainsHeroToken(value.state_patch.last_event)) errors.push('blueprint_state_missing_hero_token')\n    if (typeof value.state_patch.new_friend === 'string' && (textContainsHeroToken(value.state_patch.new_friend) || genericHeroAliasNeedsRewrite(context, ['{{HERO}}', value.state_patch.new_friend]))) errors.push('blueprint_new_friend_is_hero')\n    if (value.state_patch.canon_updates.length > 8) errors.push('blueprint_state_too_large')",
    'blueprint top state hero identity contract',
)
old_choice_token = """      if (
        textContainsHeroToken(typed.text) ||
        textContainsHeroToken(typed.effect_summary) ||
        textContainsHeroToken(typed.resolution_goal) ||
        textContainsHeroToken(typed.tomorrow_seed)
      ) errors.push('blueprint_choice_contains_hero_token')"""
new_choice_token = """      if (textContainsHeroToken(typed.text)) errors.push('blueprint_choice_text_contains_hero_token')
      if (!textContainsHeroToken(typed.effect_summary)) errors.push('blueprint_choice_effect_missing_hero_token')
      if (!textContainsHeroToken(typed.resolution_goal)) errors.push('blueprint_choice_resolution_goal_missing_hero_token')
      if (patchIsValid(typed.state_patch)) {
        if (!textContainsHeroToken(typed.state_patch.last_event)) errors.push('blueprint_choice_state_missing_hero_token')
        if (typeof typed.state_patch.new_friend === 'string' && (textContainsHeroToken(typed.state_patch.new_friend) || genericHeroAliasNeedsRewrite(context, ['{{HERO}}', typed.state_patch.new_friend]))) errors.push('blueprint_choice_new_friend_is_hero')
      }"""
replace_once(arch, old_choice_token, new_choice_token, 'blueprint choice hero identity contract')
replace_once(
    arch,
    "export const buildArchitectPrompts = (context: NormalizedStoryContext) => {\n  const system = [",
    "export const buildArchitectPrompts = (context: NormalizedStoryContext) => {\n  const latestChoice = context.choiceHistory[context.choiceHistory.length - 1] ?? null\n  const system = [",
    'architect latest choice',
)
replace_once(
    arch,
    "    'The architecture is the source of truth for canon, branch consequences and memory. The Narrator will be forbidden from changing these facts.',",
    "    'The architecture is the source of truth for canon, branch consequences and memory. The Narrator will be forbidden from changing these facts.',\n    'The protagonist identity token is literal {{HERO}}. Whenever any non-choice-display blueprint text refers to the protagonist, use {{HERO}} rather than a generic role label. Never call the protagonist qizaloq, o\\'g\\'il bola, девочка, мальчик, қыз or ұл, and never create a second unnamed child using that same generic label.',",
    'architect hero token instruction',
)
replace_once(
    arch,
    "      ? 'For cozy_forest, make living forest characters drive the story. Prefer friendly animals, birds, insects or other clearly living forest residents with a small desire, relationship, funny misunderstanding, discovery or need for help. Streams, stones, leaves, weather and paths may support the scene, but should not become the main protagonist or a maintenance task by themselves. Avoid plots centered on clearing water, repairing a path, moving debris or fixing nature unless that action directly serves a living character goal. For ages 5-7 bedtime, the central goal must stay warm, social or playful. Do not center the plot on finding the way home, washed-away signs, choosing a route in darkness, being lost, separation, pursuit, injury, rescue from danger, or weather damage.'",
    "      ? 'For cozy_forest, make living forest characters drive the story. Prefer friendly animals, birds, insects or other clearly living forest residents with a small desire, relationship, funny misunderstanding, discovery or need for help. Streams, stones, leaves, weather and paths may support the scene, but should not become the main protagonist or a maintenance task by themselves. Avoid plots centered on clearing water, repairing a path, moving debris or fixing nature unless that action directly serves a living character goal. After setup, make most causal beats about a living character acting, speaking, reacting, joking, trying, helping or changing a relationship. Do not spend consecutive beats on the trajectory, target, positioning or repeated mechanics of one leaf, stone, path or other prop. For ages 5-7 bedtime, the central goal must stay warm, social or playful. Do not center the plot on finding the way home, washed-away signs, choosing a route in darkness, being lost, separation, pursuit, injury, rescue from danger, or weather damage.'",
    'architect living-character majority',
)
replace_once(
    arch,
    "    'For Episode 2, continue immediately after the already-confirmed resolution bridge in the same bedtime session and same evening unless the established scene itself uses another same-session time. Never jump to tomorrow, morning or the next day. The latest confirmed choice tomorrow_seed belongs to a future bedtime session and must not become an Episode 2 opening beat. Use 4-7 causal beats, solve the original story goal and end with a calm bedtime coda. Return zero choices.',",
    "    'For Episode 2, the confirmed resolution_text in memory has ALREADY been shown to the child before this segment starts. Continue from the result of that bridge; never present its action as newly invented, newly discovered, newly decided or performed for the first time again. Continue immediately in the same bedtime session and same evening unless the established scene itself uses another same-session time. Never jump to tomorrow, morning or the next day. The latest confirmed choice tomorrow_seed belongs to a future bedtime session and must not become an Episode 2 opening beat. Use 4-7 causal beats, solve the original story goal and end with a calm bedtime coda. Return zero choices.',",
    'architect consumed bridge contract',
)
replace_once(
    arch,
    "      ? 'For Uzbek ages 5-7, prefer common natural Uzbek words, short direct phrases and child-familiar speech. Any NEW ordinary supporting-character name or nickname must use Uzbek Latin spelling, sound natural when read aloud in Uzbek children stories, and be easy for a 5-7-year-old to hear and remember. Avoid unexplained imported-sounding names. Avoid bookish, formal, bureaucratic, scientific or translation-like wording merely to sound poetic. Prefer xursand and rahmat over formal abstract wording. Avoid words such as ritm, pauza, sincap, mox, paporotnik, kapyushon, spiral, tantanali, chorraha, naqadar, minnatdorlik, mamnun, sukunat and hissa when a simple child-level phrase can say the same thing.'",
    "      ? 'For Uzbek ages 5-7, prefer common natural Uzbek words, short direct phrases and child-familiar speech. Any NEW ordinary supporting-character name or nickname must use Uzbek Latin spelling, sound natural when read aloud in Uzbek children stories, and be easy for a 5-7-year-old to hear and remember. Avoid unexplained imported-sounding names. Avoid bookish, formal, bureaucratic, scientific or translation-like wording merely to sound poetic. Prefer xursand and rahmat over formal abstract wording. When equally accurate, prefer uyaldi over xijolat bo\\'ldi, a direct concrete action over dadilroq or qulay payt, and shu kunni eslatdi over an abstract esdalikdek tuyuldi sentence. Avoid words such as ritm, pauza, sincap, mox, paporotnik, kapyushon, spiral, tantanali, chorraha, naqadar, minnatdorlik, mamnun, sukunat and hissa when a simple child-level phrase can say the same thing.'",
    'architect Uzbek child phrasing',
)
replace_once(
    arch,
    "      ? 'Choice display text must be in the requested story language. Do not use the {{HERO}} token in architect output; phrase choices without the hero name.'",
    "      ? 'Choice display text must be in the requested story language. Do not use {{HERO}} inside choice.text; phrase that display label as an action. In effect_summary, resolution_goal, state_patch values and any other blueprint text that refers to the protagonist, use the literal {{HERO}} token and never a generic child role label.'",
    'architect choice token contract',
)
replace_once(
    arch,
    "    hero: {\n      type: context.heroType,\n      note: 'Plan actions physically and socially appropriate for this hero type without inferring gender stereotypes or inventing child identity facts.',\n    },",
    "    hero: {\n      type: context.heroType,\n      identity_token: '{{HERO}}',\n      note: 'Plan actions physically and socially appropriate for this hero type without inferring gender stereotypes or inventing child identity facts. Use identity_token whenever blueprint prose refers to this protagonist.',\n    },",
    'architect user hero identity token',
)
replace_once(
    arch,
    "    segment: context.episodeIndex,\n    memory: memoryPayload(context),",
    "    segment: context.episodeIndex,\n    confirmed_choice_bridge: context.episodeIndex === 2 && latestChoice ? {\n      choice_text: latestChoice.choice_text,\n      effect_summary: latestChoice.effect_summary,\n      resolution_text: latestChoice.resolution_text,\n      instruction: 'This bridge already happened before segment 2. Start after its consequence; do not replay it.',\n    } : null,\n    memory: memoryPayload(context),",
    'architect explicit consumed bridge payload',
)
# Narrator: same explicit bridge, identity and character-first quality constraints.
replace_once(
    arch,
    ") => {\n  const [minimumWords, maximumWords] = hardStoryWordRange(context)",
    ") => {\n  const latestChoice = context.choiceHistory[context.choiceHistory.length - 1] ?? null\n  const [minimumWords, maximumWords] = hardStoryWordRange(context)",
    'narrator latest choice',
)
replace_once(
    arch,
    "    'For Episode 2, begin immediately after the confirmed choice resolution already happened, in the same bedtime session. Do not replay that action and do not jump to tomorrow, morning or the next day. Treat any tomorrow_seed in memory as a deferred future-session hook, not as Episode 2 material. Resolve the same central goal and finish calmly without a cliffhanger. Use only the already-established living cast from the immutable blueprint and memory; do not add a new animal, bird, insect, named helper, nickname or plural helper group, and do not replace one established character with a generic group.',",
    "    'For Episode 2, the exact confirmed_choice_bridge.resolution_text has already been displayed before this prose begins. Start from its result. Do not narrate that action as newly invented, newly discovered, newly decided or performed for the first time again, and do not copy or paraphrase the bridge as an opening beat. Stay in the same bedtime session; do not jump to tomorrow, morning or the next day. Treat any tomorrow_seed in memory as a deferred future-session hook, not as Episode 2 material. Resolve the same central goal and finish calmly without a cliffhanger. Use only the already-established living cast from the immutable blueprint and memory; do not add a new animal, bird, insect, named helper, nickname, unnamed second child or plural helper group, and do not replace one established character with a generic group.',",
    'narrator consumed bridge contract',
)
replace_once(
    arch,
    "      ? 'Keep the forest socially alive: let 2-3 memorable living forest characters act, speak, react, joke or help. Nature can be beautiful and responsive scenery, but do not make a stream, stone pile, path or weather pattern the main child-facing subject when a living-character story can carry the same value.'",
    "      ? 'Keep the forest socially alive: let 2-3 memorable living forest characters act, speak, react, joke or help. Nature can be beautiful and responsive scenery, but do not make a stream, stone pile, path, leaf game mechanic or weather pattern the main child-facing subject when a living-character story can carry the same value. Do not spend consecutive paragraphs explaining how the same prop rolls, moves, is positioned, clears a route or reaches a target; move back to character interaction and feeling through visible action.'",
    'narrator character-led forest constraint',
)
replace_once(
    arch,
    "      ? 'Write warm natural Uzbek for a young Uzbek-speaking child in Latin script. Prefer common spoken-and-read vocabulary and simple sentence structure; avoid Russian calques, formal written Uzbek and uncommon poetic words. Do not use ritm, pauza, sincap, mox, paporotnik, kapyushon, spiral, tantanali, chorraha, naqadar, minnatdorlik, mamnun, sukunat or hissa when simpler child-level wording is available. Prefer xursand, rahmat, jim, bir oz to‘xtadi and other concrete everyday phrasing.'",
    "      ? 'Write warm natural Uzbek for a young Uzbek-speaking child in Latin script. Prefer common spoken-and-read vocabulary and simple sentence structure; avoid Russian calques, formal written Uzbek and uncommon poetic words. Do not use ritm, pauza, sincap, mox, paporotnik, kapyushon, spiral, tantanali, chorraha, naqadar, minnatdorlik, mamnun, sukunat or hissa when simpler child-level wording is available. Prefer xursand, rahmat, jim, bir oz to‘xtadi and other concrete everyday phrasing. When equally accurate, prefer uyaldi over xijolat bo‘ldi, show courage through a concrete action instead of dadilroq, and say shu kunni eslatdi instead of abstract esdalikdek tuyuldi wording.'",
    'narrator Uzbek child phrasing',
)
replace_once(
    arch,
    "    paragraph_budget: paragraphBudget,\n    counting_scope: 'Whitespace-separated words in story_text only.',",
    "    paragraph_budget: paragraphBudget,\n    confirmed_choice_bridge: context.episodeIndex === 2 && latestChoice ? {\n      choice_text: latestChoice.choice_text,\n      effect_summary: latestChoice.effect_summary,\n      resolution_text: latestChoice.resolution_text,\n      instruction: 'Already consumed before this narration begins. Continue after it; never replay it.',\n    } : null,\n    counting_scope: 'Whitespace-separated words in story_text only.',",
    'narrator explicit consumed bridge payload',
)

# 5) API state should expose the real hero name rather than leaking {{HERO}} into persisted
# machine memory; the next request will redact that canonical name back to {{HERO}}.
contracts = 'supabase/functions/story-generate/contracts.ts'
replace_once(
    contracts,
    "const entriesToRecord = (entries: unknown): Record<string, string> => {",
    "const resolveHeroTokenForMemory = (value: string, heroName: string): string => heroName\n  ? value.replaceAll('{{HERO}}', heroName).replaceAll('QISSA_HERO', heroName)\n  : value\n\nconst entriesToRecord = (entries: unknown, heroName = ''): Record<string, string> => {",
    'memory hero token resolver',
)
replace_once(
    contracts,
    "    const value = compactMemoryText(item.value, 120)",
    "    const value = compactMemoryText(resolveHeroTokenForMemory(typeof item.value === 'string' ? item.value : '', heroName), 120)",
    'memory entry hero token replacement',
)
replace_once(
    contracts,
    "export const finalPatchFromCandidate = (patch: unknown): FinalStatePatch => {",
    "export const finalPatchFromCandidate = (patch: unknown, heroName = ''): FinalStatePatch => {",
    'final patch hero name argument',
)
for field, limit in [('last_event', '96'), ('new_friend', '64'), ('hero_trait', '64')]:
    replace_once(
        contracts,
        f"  const {''.join([field.split('_')[0]] + [part.title() for part in field.split('_')[1:]])} = compactMemoryText(patch.{field}, {limit})",
        f"  const {''.join([field.split('_')[0]] + [part.title() for part in field.split('_')[1:]])} = compactMemoryText(resolveHeroTokenForMemory(typeof patch.{field} === 'string' ? patch.{field} : '', heroName), {limit})",
        f'final patch {field} hero replacement',
    )
replace_once(
    contracts,
    "  const openArc = patch.open_arc === null ? null : compactMemoryText(patch.open_arc, 120)",
    "  const openArc = patch.open_arc === null ? null : compactMemoryText(resolveHeroTokenForMemory(typeof patch.open_arc === 'string' ? patch.open_arc : '', heroName), 120)",
    'final patch open arc hero replacement',
)
replace_once(contracts, "  const relationshipUpdates = entriesToRecord(patch.relationship_updates)\n  const canonUpdates = entriesToRecord(patch.canon_updates)", "  const relationshipUpdates = entriesToRecord(patch.relationship_updates, heroName)\n  const canonUpdates = entriesToRecord(patch.canon_updates, heroName)", 'final patch entry hero replacement')
replace_once(contracts, "    state_patch: finalPatchFromCandidate(choice.state_patch),", "    state_patch: finalPatchFromCandidate(choice.state_patch, context.heroName),", 'choice final patch hero name')
replace_once(contracts, "  state_patch: finalPatchFromCandidate(candidate.state_patch),", "  state_patch: finalPatchFromCandidate(candidate.state_patch, context.heroName),", 'episode final patch hero name')

# 6) Regressions: routing, generic alias detection, consumed bridge contract, persisted hero state.
safety_test = 'scripts/check-story-ai-safety.mjs'
replace_once(
    safety_test,
    "clearAdjudicatedNonSevereViolence, moderationNeedsFearAdjudication, newFriendIsAtomic, russianHeroTokenNeedsRewrite",
    "clearAdjudicatedNonSevereViolence, genericHeroAliasNeedsRewrite, moderationNeedsFearAdjudication, newFriendIsAtomic, russianHeroTokenNeedsRewrite",
    'safety test generic hero import',
)
anchor = "requireRegression(realUzFearScan.excessive_fear, 'real Uzbek blood/fear language must remain blocked')\n"
block = anchor + """
requireRegression(
  genericHeroAliasNeedsRewrite({ language: 'uz', heroType: 'girl_hero' }, ['{{HERO}} To‘pcha bilan o‘ynadi. Qizaloq yana kelib qoldi.']),
  'Uzbek girl hero plus a second generic qizaloq label must be rewritten as an identity ambiguity',
)
requireRegression(
  !genericHeroAliasNeedsRewrite({ language: 'uz', heroType: 'girl_hero' }, ['{{HERO}} To‘pcha va Lola bilan o‘ynadi.']),
  'named supporting characters must not be mistaken for the hero merely because the story is Uzbek',
)
requireRegression(
  genericHeroAliasNeedsRewrite({ language: 'ru', heroType: 'boy_hero' }, ['{{HERO}} вошёл. Мальчик снова начал то же действие.']),
  'Russian boy hero plus a duplicate generic мальчик label must be rewritten',
)
"""
replace_once(safety_test, anchor, block, 'generic hero safety regressions')

split_test = 'scripts/check-story-ai-split.mjs'
replace_once(split_test, "import { normalizeStoryRequest } from '../supabase/functions/story-generate/contracts.ts'", "import { finalPatchFromCandidate, normalizeStoryRequest } from '../supabase/functions/story-generate/contracts.ts'", 'split test final patch import')
replace_once(
    split_test,
    "  ['story_too_short', 'missing_hero_token'],",
    "  ['story_too_short', 'missing_hero_token'],\n  ['story_too_short', 'generic_hero_alias_requires_rewrite'],",
    'split repair routing generic hero',
)
replace_once(
    split_test,
    "requireLanguageGuard(textRepairRequiresFullStoryRewrite(repairRouteContext, ['story_too_short', 'uzbek_child_language_requires_rewrite']), 'existing Uzbek language defects plus short text must use a full rewrite, not insertion')",
    "requireLanguageGuard(textRepairRequiresFullStoryRewrite(repairRouteContext, ['story_too_short', 'uzbek_child_language_requires_rewrite']), 'existing Uzbek language defects plus short text must use a full rewrite, not insertion')\nrequireLanguageGuard(textRepairRequiresFullStoryRewrite(repairRouteContext, ['generic_hero_alias_requires_rewrite']), 'duplicate generic hero identity must use a full rewrite so the second pseudo-character cannot survive')",
    'split full rewrite generic hero test',
)
mem_anchor = "requireLanguageGuard(normalizedRelationshipKeys.every((key) => key !== 'rel' && /^rel_[a-z0-9]+$/u.test(key)), 'Cyrillic relationship keys must hash to stable ASCII identifiers')\n"
mem_test = mem_anchor + """
const resolvedHeroPatch = finalPatchFromCandidate({
  last_event: '{{HERO}} To‘pchaga yordam berdi.', new_friend: 'To‘pcha', hero_trait: 'mehribon', open_arc: '{{HERO}} va To‘pchaning do‘stligi',
  relationship_updates: [{ key: 'topcha', value: 'To‘pcha {{HERO}}ga ishonadi.' }],
  canon_updates: [{ key: 'topcha_game', value: '{{HERO}} To‘pchaning o‘yinini biladi.' }],
}, 'Malika')
requireLanguageGuard(resolvedHeroPatch.last_event === 'Malika To‘pchaga yordam berdi.', 'persisted state must resolve {{HERO}} to the canonical series hero name')
requireLanguageGuard(resolvedHeroPatch.relationship_updates?.topcha.includes('Malika') === true && !resolvedHeroPatch.relationship_updates?.topcha.includes('{{HERO}}'), 'persisted relationship memory must not leak the raw hero token')
"""
replace_once(split_test, mem_anchor, mem_test, 'split persisted hero token regression')
# Add prompt/validator fragments without rewriting the large existing list.
final_marker = "if (failures.length > 0) {"
extra = """requireFragments('hero identity continuity v76', architecture, [
  'The protagonist identity token is literal {{HERO}}',
  "errors.push('blueprint_state_missing_hero_token')",
  "errors.push('blueprint_choice_effect_missing_hero_token')",
  "errors.push('blueprint_choice_resolution_goal_missing_hero_token')",
  'identity_token: \'{{HERO}}\'',
  'confirmed_choice_bridge',
  'has ALREADY been shown to the child before this segment starts',
  'Already consumed before this narration begins',
  'Do not spend consecutive beats on the trajectory, target, positioning or repeated mechanics',
])
requireFragments('hero identity candidate repair v76', safety + repairRouting + repairPrompt, [
  'genericHeroAliasNeedsRewrite',
  'generic_hero_alias_requires_rewrite',
])

"""
replace_once(split_test, final_marker, extra + final_marker, 'split v76 contract fragments')

print('v76 hero continuity and Uzbek editorial patch applied')
