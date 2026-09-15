from pathlib import Path


def replace_once(path: str, old: str, new: str):
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected exactly one match, got {count}: {old[:180]!r}')
    p.write_text(text.replace(old, new, 1))

# 1) Deterministic child-language gate for Uzbek ages 5-7.
safety = 'supabase/functions/story-generate/safety.ts'
old = """const candidateChildVisibleValues = (candidate: StoryCandidate): string[] => {
  const values = [candidate.title, candidate.story_text, candidate.nextEpisodePreview]
    .filter((item): item is string => typeof item === 'string')
  if (Array.isArray(candidate.choices)) {
    for (const choice of candidate.choices) {
      if (!isRecord(choice)) continue
      for (const field of ['text', 'resolution_text', 'tomorrow_seed'] as const) {
        if (typeof choice[field] === 'string') values.push(choice[field] as string)
      }
    }
  }
  if (Array.isArray(candidate.vocabulary)) {
    for (const item of candidate.vocabulary) {
      if (!isRecord(item)) continue
      if (typeof item.example === 'string') values.push(item.example)
    }
  }
  return values
}

const unicodeWordStart = '(?<![\\\\p{L}\\\\p{N}_])'
"""
new = """const candidateChildVisibleValues = (candidate: StoryCandidate): string[] => {
  const values = [candidate.title, candidate.story_text, candidate.nextEpisodePreview]
    .filter((item): item is string => typeof item === 'string')
  if (Array.isArray(candidate.choices)) {
    for (const choice of candidate.choices) {
      if (!isRecord(choice)) continue
      for (const field of ['text', 'resolution_text', 'tomorrow_seed'] as const) {
        if (typeof choice[field] === 'string') values.push(choice[field] as string)
      }
    }
  }
  if (Array.isArray(candidate.vocabulary)) {
    for (const item of candidate.vocabulary) {
      if (!isRecord(item)) continue
      if (typeof item.example === 'string') values.push(item.example)
    }
  }
  return values
}

const uzbekYoungChildAvoidPatterns = [
  /(?<![\\p{L}\\p{M}\\p{N}_])(?:ritm|pauza|sincap|mox|paporotnik|kapyushon|spiral|tantanali|chorraha|naqadar|minnatdor|mamnun|sukunat|hissa)[\\p{L}\\p{M}-]*(?![\\p{L}\\p{M}\\p{N}_])/iu,
]

export const uzbekChildLanguageNeedsRewrite = (
  context: Pick<NormalizedStoryContext, 'language' | 'ageGroup'>,
  candidate: StoryCandidate,
): boolean => {
  if (context.language !== 'uz' || context.ageGroup !== '5-7') return false
  const visibleText = [
    candidate.title,
    candidate.story_text,
    candidate.nextEpisodePreview,
    ...(Array.isArray(candidate.choices)
      ? candidate.choices.flatMap((choice) => [choice.text, choice.effect_summary, choice.resolution_text])
      : []),
    ...(Array.isArray(candidate.vocabulary)
      ? candidate.vocabulary.flatMap((item) => [item.word, item.translation, item.example])
      : []),
  ].filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .join(' ')
    .replace(/[\\u2018\\u2019\\u02BB`]/g, "'")
    .toLocaleLowerCase()
  return uzbekYoungChildAvoidPatterns.some((pattern) => pattern.test(visibleText))
}

const unicodeWordStart = '(?<![\\\\p{L}\\\\p{N}_])'
"""
replace_once(safety, old, new)
replace_once(
    safety,
    """  if (visibleSafetyLanguageNeedsRewrite(context.language, candidateChildVisibleValues(value).join(' '))) {
    errors.push('visible_safety_language')
  }

  if (context.language === 'ru') {
""",
    """  if (visibleSafetyLanguageNeedsRewrite(context.language, candidateChildVisibleValues(value).join(' '))) {
    errors.push('visible_safety_language')
  }
  if (uzbekChildLanguageNeedsRewrite(context, value)) errors.push('uzbek_child_language_requires_rewrite')

  if (context.language === 'ru') {
""",
)

# 2) Make Architect/Narrator continuity and Uzbek child-language guidance explicit.
architecture = 'supabase/functions/story-generate/story-architecture.ts'
replace_once(
    architecture,
    """      : 'Episode 2 has no child decision menu. Return choices as an empty array, decision_point as an empty string, and next_episode_preview as an empty string.',
""",
    """      : 'Episode 2 has no child decision menu. Return choices as an empty array, decision_point as an empty string, and next_episode_preview as an empty string. Do not introduce a new living character, named helper or group of helpers that is absent from compact memory; continue with the already-established cast only.',
""",
)
replace_once(
    architecture,
    """      ? 'For Uzbek ages 5-7, prefer common natural Uzbek words, short direct phrases and child-familiar speech. Any NEW ordinary supporting-character name or nickname must use Uzbek Latin spelling, sound natural when read aloud in Uzbek children stories, and be easy for a 5-7-year-old to hear and remember. Avoid unexplained imported-sounding names. Avoid bookish, formal, bureaucratic, scientific or translation-like wording merely to sound poetic.'
""",
    """      ? 'For Uzbek ages 5-7, prefer common natural Uzbek words, short direct phrases and child-familiar speech. Any NEW ordinary supporting-character name or nickname must use Uzbek Latin spelling, sound natural when read aloud in Uzbek children stories, and be easy for a 5-7-year-old to hear and remember. Avoid unexplained imported-sounding names. Avoid bookish, formal, bureaucratic, scientific or translation-like wording merely to sound poetic. Prefer xursand and rahmat over formal abstract wording. Avoid words such as ritm, pauza, sincap, mox, paporotnik, kapyushon, spiral, tantanali, chorraha, naqadar, minnatdorlik, mamnun, sukunat and hissa when a simple child-level phrase can say the same thing.'
""",
)
replace_once(
    architecture,
    """    'Character identity is immutable. Keep every supporting-character name exactly as written in the blueprint; never translate, transliterate or rename it while narrating.',
    'You may add ephemeral sensory detail, dialogue, reactions and gentle humor only when they do not create new persistent lore.',
""",
    """    'Character identity is immutable. Keep every supporting-character name exactly as written in the blueprint; never translate, transliterate or rename it while narrating.',
    'If a newly introduced supporting character has a name or nickname in the blueprint, make that identity clear at the first child-visible use. Do not suddenly switch from a species label to an unexplained nickname.',
    'You may add ephemeral sensory detail, dialogue, reactions and gentle humor only when they do not create new persistent lore.',
""",
)
replace_once(
    architecture,
    """      ? 'Write warm natural Uzbek for a young Uzbek-speaking child in Latin script. Prefer common spoken-and-read vocabulary and simple sentence structure; avoid Russian calques, formal written Uzbek and uncommon poetic words unless the story explains them through obvious action.'
""",
    """      ? 'Write warm natural Uzbek for a young Uzbek-speaking child in Latin script. Prefer common spoken-and-read vocabulary and simple sentence structure; avoid Russian calques, formal written Uzbek and uncommon poetic words. Do not use ritm, pauza, sincap, mox, paporotnik, kapyushon, spiral, tantanali, chorraha, naqadar, minnatdorlik, mamnun, sukunat or hissa when simpler child-level wording is available. Prefer xursand, rahmat, jim, bir oz to‘xtadi and other concrete everyday phrasing.'
""",
)
replace_once(
    architecture,
    """    'For Episode 2, begin immediately after the confirmed choice resolution already happened, in the same bedtime session. Do not replay that action and do not jump to tomorrow, morning or the next day. Treat any tomorrow_seed in memory as a deferred future-session hook, not as Episode 2 material. Resolve the same central goal and finish calmly without a cliffhanger.',
""",
    """    'For Episode 2, begin immediately after the confirmed choice resolution already happened, in the same bedtime session. Do not replay that action and do not jump to tomorrow, morning or the next day. Treat any tomorrow_seed in memory as a deferred future-session hook, not as Episode 2 material. Resolve the same central goal and finish calmly without a cliffhanger. Use only the already-established living cast from the immutable blueprint and memory; do not add a new animal, bird, insect, named helper, nickname or plural helper group, and do not replace one established character with a generic group.',
""",
)

# 3) Route child-language validation through bounded correction paths.
split = 'supabase/functions/story-generate/split-index.ts'
replace_once(
    split,
    """  'story_language_mismatch',
  'missing_hero_token',
""",
    """  'story_language_mismatch',
  'uzbek_child_language_requires_rewrite',
  'missing_hero_token',
""",
)
replace_once(
    split,
    """        'For story_language_mismatch, rewrite every natural-language field strictly in the requested story language. Do not translate machine keys or the {{HERO}} token.',
        'For story_repeats_choice_menu, end story_text with one neutral decision cue or question and remove every listing or paraphrase of the two structured choice actions from story_text.',
""",
    """        'For story_language_mismatch, rewrite every natural-language field strictly in the requested story language. Do not translate machine keys or the {{HERO}} token.',
        'For uzbek_child_language_requires_rewrite, replace bookish, borrowed, neighboring-language or adult-sounding words with simple natural Uzbek for ages 5-7. Do not use ritm, pauza, sincap, mox, paporotnik, kapyushon, spiral, tantanali, chorraha, naqadar, minnatdorlik, mamnun, sukunat or hissa when a simpler phrase exists.',
        'For story_repeats_choice_menu, end story_text with one neutral decision cue or question and remove every listing or paraphrase of the two structured choice actions from story_text.',
""",
)
replace_once(
    split,
    """          context.language === 'uz'
            ? 'Use natural Uzbek Latin script in all newly written prose. Do not emit Cyrillic characters unless they are part of an already-established recurring-character name supplied by memory.'
""",
    """          context.language === 'uz'
            ? 'Use natural Uzbek Latin script in all newly written prose. Do not emit Cyrillic characters unless they are part of an already-established recurring-character name supplied by memory. For ages 5-7 keep wording concrete and everyday; avoid ritm, pauza, sincap, mox, paporotnik, kapyushon, spiral, tantanali, chorraha, naqadar, minnatdorlik, mamnun, sukunat and hissa when a simpler phrase exists.'
""",
)

# 4) Keep text-length repair from reintroducing the same vocabulary.
prompt = 'supabase/functions/story-generate/prompt.ts'
replace_once(
    prompt,
    """      ? 'For Uzbek repair prose, use natural Uzbek Latin script. Do not introduce Cyrillic text. Existing recurring-character identity labels supplied by immutable context remain unchanged.'
""",
    """      ? 'For Uzbek repair prose, use natural Uzbek Latin script. Do not introduce Cyrillic text. Existing recurring-character identity labels supplied by immutable context remain unchanged. For ages 5-7 use simple everyday Uzbek and avoid ritm, pauza, sincap, mox, paporotnik, kapyushon, spiral, tantanali, chorraha, naqadar, minnatdorlik, mamnun, sukunat and hissa when a simpler child-level phrase exists.'
""",
)

# 5) Regression tests for real v70 defects and the new orchestration contract.
test = 'scripts/check-story-ai-safety.mjs'
replace_once(
    test,
    """import { branchingPreviewNeedsRewrite, choiceMenuScaffoldingNeedsRewrite, choiceResolutionDefersToFutureSession, newFriendIsAtomic, russianHeroTokenNeedsRewrite, scanRuleBasedSafety, storyRepeatsChoiceMenu, technicalPreviewLanguageNeedsRewrite, visibleSafetyLanguageNeedsRewrite } from '../supabase/functions/story-generate/safety.ts'
""",
    """import { branchingPreviewNeedsRewrite, choiceMenuScaffoldingNeedsRewrite, choiceResolutionDefersToFutureSession, newFriendIsAtomic, russianHeroTokenNeedsRewrite, scanRuleBasedSafety, storyRepeatsChoiceMenu, technicalPreviewLanguageNeedsRewrite, uzbekChildLanguageNeedsRewrite, visibleSafetyLanguageNeedsRewrite } from '../supabase/functions/story-generate/safety.ts'
""",
)
anchor = """requireRegression(
  !visibleSafetyLanguageNeedsRewrite('ru', 'Перед героем были две двери, и за каждой слышался тихий звон.'),
  'must not reject ordinary choice-scene prose without safety evaluation language',
)

const uzRuleContext = { storyMood: 'bedtime' }
"""
insert = """requireRegression(
  !visibleSafetyLanguageNeedsRewrite('ru', 'Перед героем были две двери, и за каждой слышался тихий звон.'),
  'must not reject ordinary choice-scene prose without safety evaluation language',
)

const uzChildContext = { language: 'uz', ageGroup: '5-7' }
const simpleUzCandidate = {
  title: 'Quyonchaning bayrami',
  story_text: '{{HERO}} quyoncha bilan kuldi. Olmaxon chapak chaldi, keyin bir oz to‘xtadi. Hamma rahmat aytdi va jim o‘tirdi.',
  choices: [],
  vocabulary: [],
  nextEpisodePreview: '',
}
requireRegression(!uzbekChildLanguageNeedsRewrite(uzChildContext, simpleUzCandidate), 'simple everyday Uzbek for ages 5-7 must remain allowed')
for (const badWord of ['ritmga', 'pauza', 'sincapchalar', 'mox', 'naqadar', 'minnatdorlik', 'mamnun', 'sukunat', 'hissasini']) {
  requireRegression(
    uzbekChildLanguageNeedsRewrite(uzChildContext, { ...simpleUzCandidate, story_text: `{{HERO}} ${badWord} haqida gapirdi.` }),
    `Uzbek ages 5-7 must reject avoidable advanced/borrowed wording: ${badWord}`,
  )
}

const uzRuleContext = { storyMood: 'bedtime' }
"""
replace_once(test, anchor, insert)

split_test = 'scripts/check-story-ai-split.mjs'
replace_once(
    split_test,
    """  'For Uzbek ages 5-7, prefer common natural Uzbek words',
  'Existing recurring-character names are canonical identity labels',
""",
    """  'For Uzbek ages 5-7, prefer common natural Uzbek words',
  'Avoid words such as ritm, pauza, sincap, mox',
  'Existing recurring-character names are canonical identity labels',
""",
)
replace_once(
    split_test,
    """  'For visible_safety_language',
  'For story_language_mismatch',
""",
    """  'For visible_safety_language',
  'For story_language_mismatch',
  'For uzbek_child_language_requires_rewrite',
""",
)
replace_once(
    split_test,
    """  'For Uzbek repair prose, use natural Uzbek Latin script',
])
""",
    """  'For Uzbek repair prose, use natural Uzbek Latin script',
  'avoid ritm, pauza, sincap, mox',
])
""",
)
