from pathlib import Path

root = Path('.')

language = r'''export type StoryLanguage = 'ru' | 'uz' | 'kz'

const stripMachineTokens = (value: string): string => value
  .replace(/\{\{HERO\}\}/gu, ' ')
  .replace(/QISSA_HERO/gu, ' ')
  .replace(/\bQISSA\b/gu, ' ')

const wordCount = (value: string): number => value.trim().split(/\s+/u).filter(Boolean).length

export const hasSingleLanguageMismatch = (language: StoryLanguage, values: string[]): boolean => {
  const text = stripMachineTokens(values.filter(Boolean).join(' '))
  if (!text.trim()) return false

  const latinWords = text.match(/\b[A-Za-z]{2,}\b/gu) ?? []
  const hasCyrillic = /[А-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі]/u.test(text)
  const kazakhSpecificCount = (text.match(/[ӘәҒғҚқҢңӨөҰұҮүҺһІі]/gu) ?? []).length
  const words = wordCount(text)

  if (language === 'ru') {
    return latinWords.length > 0 || kazakhSpecificCount > 0
  }
  if (language === 'uz') {
    return hasCyrillic || (words >= 20 && !/[A-Za-z]/u.test(text))
  }
  return latinWords.length > 0 || (words >= 40 && kazakhSpecificCount < 2)
}
'''
(root / 'supabase/functions/story-generate/language.ts').write_text(language, encoding='utf-8')

safety_path = root / 'supabase/functions/story-generate/safety.ts'
safety = safety_path.read_text(encoding='utf-8')
if "from './language.ts'" not in safety:
    safety = safety.replace("import type { ModerationResult } from './openai.ts'\n", "import type { ModerationResult } from './openai.ts'\nimport { hasSingleLanguageMismatch } from './language.ts'\n")

needle = "const russianHeroTokenNeedsRewrite = (text: string) => {\n"
helper = r'''const patchLanguageValues = (patch: unknown): string[] => {
  if (!isRecord(patch)) return []
  const values: string[] = []
  for (const field of ['last_event', 'new_friend', 'hero_trait', 'open_arc'] as const) {
    if (typeof patch[field] === 'string') values.push(patch[field] as string)
  }
  for (const field of ['relationship_updates', 'canon_updates'] as const) {
    const entries = patch[field]
    if (!Array.isArray(entries)) continue
    for (const entry of entries) {
      if (isRecord(entry) && typeof entry.value === 'string') values.push(entry.value)
    }
  }
  return values
}

const candidateLanguageValues = (candidate: StoryCandidate): string[] => {
  const values = [candidate.title, candidate.story_text, candidate.nextEpisodePreview]
    .filter((item): item is string => typeof item === 'string')
  values.push(...patchLanguageValues(candidate.state_patch))
  if (Array.isArray(candidate.choices)) {
    for (const choice of candidate.choices) {
      if (!isRecord(choice)) continue
      for (const field of ['text', 'effect_summary', 'resolution_text', 'tomorrow_seed'] as const) {
        if (typeof choice[field] === 'string') values.push(choice[field] as string)
      }
      values.push(...patchLanguageValues(choice.state_patch))
    }
  }
  if (Array.isArray(candidate.vocabulary)) {
    for (const item of candidate.vocabulary) {
      if (!isRecord(item)) continue
      if (typeof item.word === 'string') values.push(item.word)
      if (typeof item.example === 'string') values.push(item.example)
    }
  }
  return values
}

'''
if 'const candidateLanguageValues' not in safety:
    safety = safety.replace(needle, helper + needle)

needle2 = "  const value = candidate as StoryCandidate\n\n"
insert2 = "  const value = candidate as StoryCandidate\n\n  if (hasSingleLanguageMismatch(context.language, candidateLanguageValues(value))) errors.push('story_language_mismatch')\n\n"
if "errors.push('story_language_mismatch')" not in safety:
    safety = safety.replace(needle2, insert2)
safety_path.write_text(safety, encoding='utf-8')

arch_path = root / 'supabase/functions/story-generate/story-architecture.ts'
arch = arch_path.read_text(encoding='utf-8')
if "from './language.ts'" not in arch:
    arch = arch.replace("} from './contracts.ts'\n", "} from './contracts.ts'\nimport { hasSingleLanguageMismatch } from './language.ts'\n", 1)

anchor = "const textContainsHeroToken = (value: string): boolean => value.includes('{{HERO}}') || value.includes('QISSA_HERO')\n\n"
blueprint_helper = r'''const patchNaturalLanguageValues = (patch: unknown): string[] => {
  if (!isRecord(patch)) return []
  const values: string[] = []
  for (const field of ['last_event', 'new_friend', 'hero_trait', 'open_arc'] as const) {
    if (typeof patch[field] === 'string') values.push(patch[field] as string)
  }
  for (const field of ['relationship_updates', 'canon_updates'] as const) {
    const entries = patch[field]
    if (!Array.isArray(entries)) continue
    for (const entry of entries) {
      if (isRecord(entry) && typeof entry.value === 'string') values.push(entry.value)
    }
  }
  return values
}

const blueprintNaturalLanguageValues = (blueprint: StoryBlueprint): string[] => {
  const values: string[] = []
  for (const field of ['central_goal', 'setting_anchor', 'decision_point', 'next_episode_preview'] as const) {
    if (typeof blueprint[field] === 'string') values.push(blueprint[field])
  }
  if (Array.isArray(blueprint.continuity_callbacks)) values.push(...blueprint.continuity_callbacks.filter((item): item is string => typeof item === 'string'))
  if (Array.isArray(blueprint.beats)) values.push(...blueprint.beats.filter((item): item is string => typeof item === 'string'))
  values.push(...patchNaturalLanguageValues(blueprint.state_patch))
  if (Array.isArray(blueprint.choices)) {
    for (const choice of blueprint.choices) {
      if (!isRecord(choice)) continue
      for (const field of ['text', 'effect_summary', 'resolution_goal', 'tomorrow_seed'] as const) {
        if (typeof choice[field] === 'string') values.push(choice[field] as string)
      }
      values.push(...patchNaturalLanguageValues(choice.state_patch))
    }
  }
  return values
}

'''
if 'const blueprintNaturalLanguageValues' not in arch:
    arch = arch.replace(anchor, anchor + blueprint_helper)

needle3 = "  const errors: string[] = []\n\n"
insert3 = "  const errors: string[] = []\n\n  if (hasSingleLanguageMismatch(context.language, blueprintNaturalLanguageValues(value))) errors.push('blueprint_language_mismatch')\n\n"
if "errors.push('blueprint_language_mismatch')" not in arch:
    arch = arch.replace(needle3, insert3, 1)

old_prompt = "    'Write only in the requested language and for the requested age.',\n"
new_prompt = "    'Write only in the requested language and for the requested age. Never switch languages inside dialogue, signs, inscriptions, narration, choice resolutions or examples.',\n"
arch = arch.replace(old_prompt, new_prompt)
arch_path.write_text(arch, encoding='utf-8')

index_path = root / 'supabase/functions/story-generate/split-index.ts'
index = index_path.read_text(encoding='utf-8')
old = "        'For russian_hero_requires_rewrite, keep {{HERO}} only as nominative subject or direct address and rewrite every case/preposition or gendered-past-tense construction around the token.',\n"
new = old + "        'For story_language_mismatch, rewrite every natural-language field strictly in the requested story language. Do not translate machine keys or the {{HERO}} token.',\n"
if 'For story_language_mismatch' not in index:
    index = index.replace(old, new)
index_path.write_text(index, encoding='utf-8')

check_path = root / 'scripts/check-story-ai-split.mjs'
check = check_path.read_text(encoding='utf-8')
if "const languageGuard =" not in check:
    check = check.replace("const orchestrator = fs.readFileSync('supabase/functions/story-generate/split-index.ts', 'utf8')\n", "const orchestrator = fs.readFileSync('supabase/functions/story-generate/split-index.ts', 'utf8')\nconst safety = fs.readFileSync('supabase/functions/story-generate/safety.ts', 'utf8')\nconst languageGuard = fs.readFileSync('supabase/functions/story-generate/language.ts', 'utf8')\n")
    marker = "requireFragments('split provider', provider, [\n"
    checks = "requireFragments('language guard', languageGuard, [\n  'hasSingleLanguageMismatch',\n  \"language === 'ru'\",\n  \"language === 'uz'\",\n  'kazakhSpecificCount',\n])\n\nrequireFragments('candidate language validation', safety, [\n  \"errors.push('story_language_mismatch')\",\n  'candidateLanguageValues',\n])\n\n"
    check = check.replace(marker, checks + marker)
    arch_frag = "  'paragraph_budget: paragraphBudget',\n"
    check = check.replace(arch_frag, arch_frag + "  \"errors.push('blueprint_language_mismatch')\",\n")
    retry_frag = "  'Previous narration failed deterministic validation',\n"
    check = check.replace(retry_frag, retry_frag + "  'For story_language_mismatch',\n")
check_path.write_text(check, encoding='utf-8')
