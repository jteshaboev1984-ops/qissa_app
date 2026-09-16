from pathlib import Path
import re


def replace_once(path: str, old: str, new: str, label: str) -> None:
    p = Path(path)
    s = p.read_text()
    if old not in s:
        raise SystemExit(f'{label}: target not found')
    p.write_text(s.replace(old, new, 1))


prompt = Path('supabase/functions/story-generate/prompt.ts')
s = prompt.read_text()
replacement = '''export const buildTextLengthRepairOutputSchema = (
  context: NormalizedStoryContext,
  validationErrors: string[],
) => {
  const fullStoryRewrite = textRepairRequiresFullStoryRewrite(context, validationErrors)
  const insertionOnly = validationErrors.includes('story_too_short') && !fullStoryRewrite
  const vocabularyItemSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['word', 'translation', 'example'],
    properties: {
      word: { type: 'string' },
      translation: { type: 'string' },
      example: { type: 'string' },
    },
  } as const

  return {
    type: 'object',
    additionalProperties: false,
    required: ['title_rewrite', 'story_rewrite', 'story_expansion', 'choice_resolutions', 'vocabulary_rewrite'],
    properties: {
      title_rewrite: { type: fullStoryRewrite ? 'string' : 'null' },
      story_rewrite: { type: fullStoryRewrite ? 'string' : 'null' },
      story_expansion: { type: insertionOnly ? 'string' : 'null' },
      choice_resolutions: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['choice_id', 'resolution_text'],
          properties: {
            choice_id: { type: 'string' },
            resolution_text: { type: 'string' },
          },
        },
      },
      vocabulary_rewrite: {
        type: 'array',
        items: vocabularyItemSchema,
      },
    },
  } as const
}'''
pattern = r"export const textLengthRepairOutputSchema = \{[\s\S]*?\n\} as const\n\nexport const safetyOutputSchema"
updated, count = re.subn(pattern, replacement + "\n\nexport const safetyOutputSchema", s, count=1)
if count != 1:
    raise SystemExit(f'prompt repair schema replacement count={count}')
prompt.write_text(updated)

openai = 'supabase/functions/story-generate/openai.ts'
replace_once(
    openai,
    "buildSafetyPrompts, buildStoryPrompts, buildTextLengthRepairPrompts, safetyOutputSchema, storyOutputSchema, textLengthRepairOutputSchema",
    "buildSafetyPrompts, buildStoryPrompts, buildTextLengthRepairOutputSchema, buildTextLengthRepairPrompts, safetyOutputSchema, storyOutputSchema",
    'openai schema import',
)
replace_once(
    openai,
    "    textLengthRepairOutputSchema,\n    localizedSystem,",
    "    buildTextLengthRepairOutputSchema(context, validationErrors),\n    localizedSystem,",
    'openai dynamic repair schema call',
)
replace_once(
    openai,
    "  const storyTooShort = validationErrors.includes('story_too_short')\n  const storyTooLong = validationErrors.includes('story_too_long')\n  const codaLengthFailure = validationErrors.includes('bedtime_coda_too_short') || validationErrors.includes('bedtime_coda_too_long')",
    "  const storyTooShort = validationErrors.includes('story_too_short')",
    'remove unused generic repair mode flags',
)
old_validation = """  if (fullStoryRewrite && (typeof repair.title_rewrite !== 'string' || !repair.title_rewrite.trim() || typeof repair.story_rewrite !== 'string' || !repair.story_rewrite.trim() || repair.story_expansion !== null)) {
    throw new Error('openai_invalid_full_text_repair_rewrite')
  }
  if (!fullStoryRewrite && repair.title_rewrite !== null) throw new Error('openai_unexpected_text_repair_title')
  if (!fullStoryRewrite && storyTooShort && (typeof repair.story_expansion !== 'string' || !repair.story_expansion.trim() || repair.story_rewrite !== null)) {
    throw new Error('openai_invalid_text_repair_expansion')
  }
  if (!fullStoryRewrite && !storyTooShort && !storyTooLong && !codaLengthFailure && (repair.story_rewrite !== null || repair.story_expansion !== null)) {
    throw new Error('openai_unexpected_text_repair_story')
  }
  if (fullStoryRewrite) {
    if (context.language === 'ru' && (repair.vocabulary_rewrite.length < 2 || repair.vocabulary_rewrite.length > 3)) throw new Error('openai_invalid_text_repair_vocabulary')
    if (context.language !== 'ru' && repair.vocabulary_rewrite.length !== 0) throw new Error('openai_unexpected_text_repair_vocabulary')
  } else if (repair.vocabulary_rewrite.length !== 0) {
    throw new Error('openai_unexpected_text_repair_vocabulary')
  }
"""
new_validation = """  if (fullStoryRewrite && (typeof repair.title_rewrite !== 'string' || !repair.title_rewrite.trim() || typeof repair.story_rewrite !== 'string' || !repair.story_rewrite.trim())) {
    throw new Error('openai_invalid_full_text_repair_rewrite')
  }
  if (!fullStoryRewrite && storyTooShort && (typeof repair.story_expansion !== 'string' || !repair.story_expansion.trim())) {
    throw new Error('openai_invalid_text_repair_expansion')
  }
  if (fullStoryRewrite && context.language === 'ru' && (repair.vocabulary_rewrite.length < 2 || repair.vocabulary_rewrite.length > 3)) {
    throw new Error('openai_invalid_text_repair_vocabulary')
  }
"""
replace_once(openai, old_validation, new_validation, 'repair output validation hardening')
replace_once(
    openai,
    "  for (const item of repair.choice_resolutions) {\n    if (!targetChoiceIds.has(item.choice_id) || repairedByChoiceId.has(item.choice_id) || !item.resolution_text.trim()) {\n      throw new Error('openai_invalid_text_repair_choice')\n    }\n    repairedByChoiceId.set(item.choice_id, item.resolution_text)\n  }",
    "  for (const item of repair.choice_resolutions) {\n    if (!targetChoiceIds.has(item.choice_id)) continue\n    if (repairedByChoiceId.has(item.choice_id) || !item.resolution_text.trim()) {\n      throw new Error('openai_invalid_text_repair_choice')\n    }\n    repairedByChoiceId.set(item.choice_id, item.resolution_text)\n  }",
    'ignore harmless non-target choice repair output',
)
replace_once(
    openai,
    "    vocabulary: fullStoryRewrite ? repair.vocabulary_rewrite : candidate.vocabulary,",
    "    vocabulary: fullStoryRewrite\n      ? (context.language === 'ru' ? repair.vocabulary_rewrite : [])\n      : candidate.vocabulary,",
    'discard non-Russian repair vocabulary output',
)

split = 'supabase/functions/story-generate/split-index.ts'
provider_block = """const providerFailureClass = (reason: string): string => {
  if (reason === 'openai_timeout') return 'provider-timeout'
  if (reason.startsWith('openai_http_')) return 'provider-http'
  if (reason === 'openai_incomplete_response') return 'provider-incomplete'
  if (reason.startsWith('openai_response_failed:')) return 'provider-failed'
  return 'provider-error'
}
"""
provider_new = provider_block + """
const repairContractFailureCodes = new Set([
  'openai_text_repair_story_structure',
  'openai_invalid_full_text_repair_rewrite',
  'openai_invalid_text_repair_expansion',
  'openai_invalid_text_repair_vocabulary',
  'openai_invalid_text_repair_choice',
  'openai_incomplete_text_repair_choices',
])

const repairContractFailureDetail = (reason: string): string | null =>
  repairContractFailureCodes.has(reason) ? reason.replace(/^openai_/u, '') : null
"""
replace_once(split, provider_block, provider_new, 'repair contract failure diagnostic helper')
replace_once(
    split,
    "      const reason = error instanceof Error ? error.message.slice(0, 240) : 'provider_error'\n      lastFailureClass = providerFailureClass(reason)\n      trace.push(`${repairRetryUsed ? 'repair-retry' : 'repair'}:${lastFailureClass}`)",
    "      const reason = error instanceof Error ? error.message.slice(0, 240) : 'provider_error'\n      const repairContractDetail = repairContractFailureDetail(reason)\n      lastFailureClass = repairContractDetail ? 'repair-contract' : providerFailureClass(reason)\n      trace.push(`${repairRetryUsed ? 'repair-retry' : 'repair'}:${lastFailureClass}${repairContractDetail ? `:${repairContractDetail}` : ''}`)",
    'repair catch diagnostic classification',
)

safety_test = 'scripts/check-story-ai-safety.mjs'
replace_once(safety_test, "'textLengthRepairOutputSchema',", "'buildTextLengthRepairOutputSchema',", 'safety contract dynamic schema marker')

split_test = Path('scripts/check-story-ai-split.mjs')
s = split_test.read_text()
marker = "if (failures.length > 0) {"
if marker not in s:
    raise SystemExit('split test final marker missing')
block = """requireFragments('repair contract observability', splitIndex, [
  'repairContractFailureCodes',
  'repairContractFailureDetail',
  \"lastFailureClass = repairContractDetail ? 'repair-contract' : providerFailureClass(reason)\",
  'repair-contract',
])

"""
split_test.write_text(s.replace(marker, block + marker, 1))

print('v75 repair-contract hardening applied')
