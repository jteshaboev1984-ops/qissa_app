from pathlib import Path

architecture_path = Path('supabase/functions/story-generate/story-architecture.ts')
split_check_path = Path('scripts/check-story-ai-split.mjs')

architecture = architecture_path.read_text()
split_check = split_check_path.read_text()

old_top = """  else {\n    if (!textContainsHeroToken(value.state_patch.last_event)) errors.push('blueprint_state_missing_hero_token')\n    if (typeof value.state_patch.new_friend === 'string' && (textContainsHeroToken(value.state_patch.new_friend) || genericHeroAliasNeedsRewrite(context, ['{{HERO}}', value.state_patch.new_friend]))) errors.push('blueprint_new_friend_is_hero')\n"""
new_top = """  else {\n    // last_event may describe a supporting-character-only event. Identity safety is enforced\n    // across all blueprint natural-language values above; require {{HERO}} only when a field\n    // contractually describes the protagonist rather than inventing hero participation here.\n    if (typeof value.state_patch.new_friend === 'string' && (textContainsHeroToken(value.state_patch.new_friend) || genericHeroAliasNeedsRewrite(context, ['{{HERO}}', value.state_patch.new_friend]))) errors.push('blueprint_new_friend_is_hero')\n"""
if architecture.count(old_top) != 1:
    raise SystemExit('top-level hero-state guard anchor mismatch')
architecture = architecture.replace(old_top, new_top)

old_choice = """      if (patchIsValid(typed.state_patch)) {\n        if (!textContainsHeroToken(typed.state_patch.last_event)) errors.push('blueprint_choice_state_missing_hero_token')\n        if (typeof typed.state_patch.new_friend === 'string' && (textContainsHeroToken(typed.state_patch.new_friend) || genericHeroAliasNeedsRewrite(context, ['{{HERO}}', typed.state_patch.new_friend]))) errors.push('blueprint_choice_new_friend_is_hero')\n      }\n"""
new_choice = """      if (patchIsValid(typed.state_patch)) {\n        if (typeof typed.state_patch.new_friend === 'string' && (textContainsHeroToken(typed.state_patch.new_friend) || genericHeroAliasNeedsRewrite(context, ['{{HERO}}', typed.state_patch.new_friend]))) errors.push('blueprint_choice_new_friend_is_hero')\n      }\n"""
if architecture.count(old_choice) != 1:
    raise SystemExit('choice hero-state guard anchor mismatch')
architecture = architecture.replace(old_choice, new_choice)

split_check = split_check.replace("requireFragments('hero identity continuity v76', architecture, [", "requireFragments('hero identity continuity v77', architecture, [")
old_fragment = "  \"errors.push('blueprint_state_missing_hero_token')\",\n"
if split_check.count(old_fragment) != 1:
    raise SystemExit('split-check obsolete hero-state fragment anchor mismatch')
split_check = split_check.replace(old_fragment, '')

anchor = """requireLanguageGuard(unsafeBlueprintErrors.includes('blueprint_rule_safety'), 'deterministic safety present in Architect output must fail before the paid Narrator stage')\n\n"""
if split_check.count(anchor) != 1:
    raise SystemExit('split-check regression insertion anchor mismatch')
regression = r"""requireLanguageGuard(unsafeBlueprintErrors.includes('blueprint_rule_safety'), 'deterministic safety present in Architect output must fail before the paid Narrator stage')

const heroNeutralStateContext = {
  language: 'uz', ageGroup: '5-7', episodeIndex: 1, storyMode: 'series', storyMood: 'bedtime',
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

"""
split_check = split_check.replace(anchor, regression)

architecture_path.write_text(architecture)
split_check_path.write_text(split_check)
