from pathlib import Path


def replace_once(path: str, old: str, new: str):
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected exactly one match, got {count}: {old[:180]!r}')
    p.write_text(text.replace(old, new, 1))

# 1) Deterministic safety: stop treating dangerous substrings as if they were whole words.
safety = 'supabase/functions/story-generate/safety.ts'
replace_once(
    safety,
    "const includesAny = (text: string, phrases: string[]) => phrases.some((phrase) => text.includes(phrase))\n",
    "const includesAny = (text: string, phrases: string[]) => phrases.some((phrase) => text.includes(phrase))\n\nconst matchesAny = (text: string, patterns: RegExp[]) => patterns.some((pattern) => pattern.test(text))\n",
)
replace_once(
    safety,
    """  flags.excessive_fear = includesAny(text, [
    'ужас охватил', 'кровь', 'убить', 'погиб',
    'dahshat', 'qon', \"o'ldirish\",
    'қорқыныш биледі', 'қан', 'өлтіру',
  ])""",
    """  flags.excessive_fear = matchesAny(text, [
    /(?<![\\p{L}\\p{M}\\p{N}_])ужас\\s+охватил(?![\\p{L}\\p{M}\\p{N}_])/u,
    /(?<![\\p{L}\\p{M}\\p{N}_])кровь(?![\\p{L}\\p{M}\\p{N}_])/u,
    /(?<![\\p{L}\\p{M}\\p{N}_])убить(?![\\p{L}\\p{M}\\p{N}_])/u,
    /(?<![\\p{L}\\p{M}\\p{N}_])погиб[\\p{L}\\p{M}-]*(?![\\p{L}\\p{M}\\p{N}_])/u,
    /(?<![\\p{L}\\p{M}\\p{N}_])dahshat[\\p{L}\\p{M}-]*(?![\\p{L}\\p{M}\\p{N}_])/u,
    /(?<![\\p{L}\\p{M}\\p{N}_])qon(?:i|ni|ga|dan|li)?(?![\\p{L}\\p{M}\\p{N}_])/u,
    /(?<![\\p{L}\\p{M}\\p{N}_])o'ldir[\\p{L}\\p{M}-]*(?![\\p{L}\\p{M}\\p{N}_])/u,
    /(?<![\\p{L}\\p{M}\\p{N}_])қорқыныш\\s+биледі(?![\\p{L}\\p{M}\\p{N}_])/u,
    /(?<![\\p{L}\\p{M}\\p{N}_])қан(?![\\p{L}\\p{M}\\p{N}_])/u,
    /(?<![\\p{L}\\p{M}\\p{N}_])өлтіру(?![\\p{L}\\p{M}\\p{N}_])/u,
  ])""",
)

# 2) Make the localization/identity contract explicit for both architecture and narration.
arch = 'supabase/functions/story-generate/story-architecture.ts'
replace_once(
    arch,
    "    'Treat compact memory as authoritative. Never invent a past event that is absent from memory and never import consequences from an unselected branch.',",
    "    'Treat compact memory as authoritative. Never invent a past event that is absent from memory and never import consequences from an unselected branch.',\n    'Existing recurring-character names are canonical identity labels. Preserve them exactly as supplied by memory even if the requested language changed since an earlier session. Never translate, transliterate or rename an existing recurring character. The selected language governs only names and nicknames of newly introduced supporting characters and new place labels.',",
)
replace_once(
    arch,
    "      ? 'For Uzbek ages 5-7, prefer common natural Uzbek words, short direct phrases and child-familiar speech. Avoid bookish, formal, bureaucratic, scientific or translation-like wording merely to sound poetic.'",
    "      ? 'For Uzbek ages 5-7, prefer common natural Uzbek words, short direct phrases and child-familiar speech. Any NEW ordinary supporting-character name or nickname must use Uzbek Latin spelling, sound natural when read aloud in Uzbek children stories, and be easy for a 5-7-year-old to hear and remember. Avoid unexplained imported-sounding names. Avoid bookish, formal, bureaucratic, scientific or translation-like wording merely to sound poetic.'",
)
replace_once(
    arch,
    "    'The blueprint owns plot, choices, canon, relationships and branch consequences. Never change, replace or add a durable fact outside that blueprint.',",
    "    'The blueprint owns plot, choices, canon, relationships and branch consequences. Never change, replace or add a durable fact outside that blueprint.',\n    'Character identity is immutable. Keep every supporting-character name exactly as written in the blueprint; never translate, transliterate or rename it while narrating.',",
)

prompt = 'supabase/functions/story-generate/prompt.ts'
replace_once(
    prompt,
    "  memory_quality: 'When prior state exists, let later fiction visibly reflect it through a returning character, object, relationship, remembered action or changed situation. Treat canon_state and the latest confirmed selected choice as authoritative. Only selected choices become canon: never import hypothetical objects, discoveries or consequences from an unselected branch. If a past fact is absent from compact canon, do not invent it as a memory; introduce any new discovery as new.',",
    "  memory_quality: 'When prior state exists, let later fiction visibly reflect it through a returning character, object, relationship, remembered action or changed situation. Treat canon_state and the latest confirmed selected choice as authoritative. Preserve every existing recurring-character name exactly across language changes; never translate, transliterate or rename an established character. The selected language governs only NEW supporting-character names, nicknames and place labels. Only selected choices become canon: never import hypothetical objects, discoveries or consequences from an unselected branch. If a past fact is absent from compact canon, do not invent it as a memory; introduce any new discovery as new.',",
)
replace_once(
    prompt,
    "    ? 'Write natural Uzbek storytelling in Latin script. Do not translate Russian sentence by sentence. For ages 5-7, prefer words common in everyday family speech and short direct phrasing. Avoid bookish or borrowed words such as chorraha, paporotnik, kapyushon, ritm, spiral and tantanali when a simpler child-level phrase exists. Natural jokes and concrete details may differ while preserving the same story contract.'",
    "    ? 'Write natural Uzbek storytelling in Latin script. Do not translate Russian sentence by sentence. For ages 5-7, prefer words common in everyday family speech and short direct phrasing. Any NEW ordinary supporting-character name or nickname must use Uzbek Latin spelling, sound natural aloud in Uzbek children stories, and be easy to remember; avoid unexplained imported-sounding names. Existing recurring-character names from memory are immutable even if they came from another story language. Avoid bookish or borrowed words such as chorraha, paporotnik, kapyushon, ritm, spiral and tantanali when a simpler child-level phrase exists. Natural jokes and concrete details may differ while preserving the same story contract.'",
)

# 3) Replace the accidental imported-sounding Uzbek fallback cast with simple Uzbek child-story nicknames.
story = Path('supabase/functions/story-generate/storySixMinuteEditorial.ts')
text = story.read_text()
collection = text.index('const childFirstStories: Record<ClosedBetaWorld, ChildFirstStory> = {')
cozy_start = text.index('  cozy_forest: {', collection)
cozy_end = text.index('  magic_garden: {', cozy_start)
cozy = text[cozy_start:cozy_end]
for old, new in [('Puf', 'Momiq'), ('Nura', 'Oycha'), ('Lola', 'Yong‘oqcha'), ('Toti', 'Toshvoy')]:
    cozy = cozy.replace(old, new)
text = text[:cozy_start] + cozy + text[cozy_end:]
story.write_text(text)

# 4) Regression tests for rule-based safety boundaries.
test = Path('scripts/check-story-ai-safety.mjs')
t = test.read_text()
t = t.replace(
    "import { branchingPreviewNeedsRewrite, choiceMenuScaffoldingNeedsRewrite, russianHeroTokenNeedsRewrite, storyRepeatsChoiceMenu, technicalPreviewLanguageNeedsRewrite, visibleSafetyLanguageNeedsRewrite } from '../supabase/functions/story-generate/safety.ts'",
    "import { branchingPreviewNeedsRewrite, choiceMenuScaffoldingNeedsRewrite, russianHeroTokenNeedsRewrite, scanRuleBasedSafety, storyRepeatsChoiceMenu, technicalPreviewLanguageNeedsRewrite, visibleSafetyLanguageNeedsRewrite } from '../supabase/functions/story-generate/safety.ts'",
    1,
)
marker = "requireRegression(\n  !visibleSafetyLanguageNeedsRewrite('ru', 'Перед героем были две двери, и за каждой слышался тихий звон.'),\n  'must not reject ordinary choice-scene prose without safety evaluation language',\n)\n"
addition = marker + """
const uzRuleContext = { storyMood: 'bedtime' }
const harmlessUzFearScan = scanRuleBasedSafety(uzRuleContext, {
  title: 'Momiqning sovg‘asi',
  story_text: "Momiq qong‘iroq ovozini eshitib kuldi. Qo‘ng‘iroq yonida qonun yozilgan qog‘oz emas, oddiy rasm turardi.",
  choices: [],
})
requireRegression(!harmlessUzFearScan.excessive_fear, 'Uzbek qong‘iroq/qonun must not trigger the standalone qon fear rule')
const realUzFearScan = scanRuleBasedSafety(uzRuleContext, {
  title: 'Tekshiruv',
  story_text: 'Yo‘lda qon bor edi va manzara dahshatli edi.',
  choices: [],
})
requireRegression(realUzFearScan.excessive_fear, 'real Uzbek blood/fear language must remain blocked')
"""
if t.count(marker) != 1:
    raise SystemExit('check-story-ai-safety.mjs: insertion marker mismatch')
test.write_text(t.replace(marker, addition, 1))

# 5) Regression: language changes preserve established character identity while new-name rules localize future names.
split = Path('scripts/check-story-ai-split.mjs')
s = split.read_text()
s = s.replace(
    "import { enforceStoryBlueprintContextContract } from '../supabase/functions/story-generate/story-architecture.ts'\nimport { normalizeStoryBlueprintMemoryKeys } from '../supabase/functions/story-generate/story-architecture.ts'",
    "import { buildArchitectPrompts, enforceStoryBlueprintContextContract } from '../supabase/functions/story-generate/story-architecture.ts'\nimport { normalizeStoryBlueprintMemoryKeys } from '../supabase/functions/story-generate/story-architecture.ts'\nimport { normalizeStoryRequest } from '../supabase/functions/story-generate/contracts.ts'",
    1,
)
anchor = "requireLanguageGuard(normalizedRelationshipKeys.every((key) => key !== 'rel' && /^rel_[a-z0-9]+$/u.test(key)), 'Cyrillic relationship keys must hash to stable ASCII identifiers')\n"
identity_test = anchor + """

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
if (!switchedLanguageContext) {
  failures.push('language switch continuity context failed to normalize')
} else {
  requireLanguageGuard(switchedLanguageContext.heroName === 'Алия', 'changing story language must preserve the established hero name from series state')
  requireLanguageGuard(switchedLanguageContext.recurringCharacters.join('|') === 'Рыжик|Ульяна', 'changing story language must preserve established recurring-character names exactly')
  const switchedPrompts = buildArchitectPrompts(switchedLanguageContext)
  requireLanguageGuard(switchedPrompts.user.includes('Рыжик') && switchedPrompts.user.includes('Ульяна'), 'architect memory must carry established names unchanged after a language switch')
}
"""
if s.count(anchor) != 1:
    raise SystemExit('check-story-ai-split.mjs: identity insertion marker mismatch')
s = s.replace(anchor, identity_test, 1)
fragment = "  'For Uzbek ages 5-7, prefer common natural Uzbek words',\n"
replacement = fragment + "  'Existing recurring-character names are canonical identity labels',\n  'selected language governs only names and nicknames of newly introduced supporting characters',\n  'Any NEW ordinary supporting-character name or nickname must use Uzbek Latin spelling',\n  'Character identity is immutable',\n"
if s.count(fragment) != 1:
    raise SystemExit('check-story-ai-split.mjs: architecture fragment marker mismatch')
s = s.replace(fragment, replacement, 1)
split.write_text(s)

# 6) Deterministic Uzbek flagship must use the new localized names and reject the accidental old imported cast.
core = Path('scripts/check-story-core-proof.mjs')
c = core.read_text()
marker = "  assert(uzForestOne.title === 'Pufning uyqu oldi sovg‘asi', 'Uzbek forest title must stay character-led.')\n"
replacement = "  assert(uzForestOne.title === 'Momiqning uyqu oldi sovg‘asi', 'Uzbek forest title must stay character-led and naturally localized.')\n  assert(/Momiq/u.test(uzForestOne.story_text) && /Oycha/u.test(uzForestOne.story_text) && /Yong‘oqcha/u.test(uzForestOne.story_text) && /Toshvoy/u.test(uzForestOne.story_text), 'Uzbek forest must use the localized child-story cast.')\n  assert(!/\\b(?:Puf|Nura|Lola|Toti)\\b/u.test(uzForestOne.story_text), 'Uzbek forest must not expose the old imported-sounding fallback cast.')\n"
if c.count(marker) != 1:
    raise SystemExit('check-story-core-proof.mjs: Uzbek title marker mismatch')
c = c.replace(marker, replacement, 1)
preview_old = "  assert(uzForestOne.nextEpisodePreview === 'Puf akasiga sovg‘ani ko‘rsatadigan payt juda yaqin edi.', 'Uzbek forest preview must stay in-world.')"
preview_new = "  assert(uzForestOne.nextEpisodePreview === 'Momiq akasiga sovg‘ani ko‘rsatadigan payt juda yaqin edi.', 'Uzbek forest preview must stay in-world.')"
if c.count(preview_old) != 1:
    raise SystemExit('check-story-core-proof.mjs: Uzbek preview marker mismatch')
c = c.replace(preview_old, preview_new, 1)
core.write_text(c)
