from pathlib import Path


def change(text, old, new, label):
    n = text.count(old)
    if n != 1:
        raise SystemExit(f'v92 anchor {label}: expected 1, found {n}')
    return text.replace(old, new)

prompt_path = Path('supabase/functions/story-generate/prompt.ts')
s = prompt_path.read_text()
s = change(s,
    'export const buildTextLengthRepairOutputSchema = (\n  context: NormalizedStoryContext,\n  validationErrors: string[],\n) => {',
    'export const buildTextLengthRepairOutputSchema = (\n  context: NormalizedStoryContext,\n  validationErrors: string[],\n  candidate: StoryCandidate,\n) => {', 'schema signature')
s = change(s,
    "  const insertionOnly = validationErrors.includes('story_too_short') && !fullStoryRewrite\n  const vocabularyItemSchema = {",
    """  const insertionOnly = validationErrors.includes('story_too_short') && !fullStoryRewrite
  const expectedChoices = context.episodeIndex === 1 ? 2 : 0
  if (candidate.choices.length !== expectedChoices) throw new Error('repair_invalid_choice_count')
  const resolutionTargets = new Set(repairChoiceResolutionTargets(context, candidate, validationErrors))
  const vocabularyItemSchema = {""", 'schema targets')
s = change(s,
    """      choice_resolutions: {
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
      },""",
    """      // Fixed required slots are supported by strict structured outputs. Unlike an
      // unconstrained array they cannot silently omit or duplicate a branch.
      choice_resolutions: {
        type: 'object',
        additionalProperties: false,
        required: ['choice_1', 'choice_2'],
        properties: {
          choice_1: { type: candidate.choices[0] && resolutionTargets.has(candidate.choices[0].choice_id) ? 'string' : 'null' },
          choice_2: { type: candidate.choices[1] && resolutionTargets.has(candidate.choices[1].choice_id) ? 'string' : 'null' },
        },
      },""", 'schema fixed slots')
helper_anchor = "export const buildTextLengthRepairPrompts = (\n"
assert s.count(helper_anchor) == 1
s = s.replace(helper_anchor, """// One target selection shared by JSON schema, Repair prompt and server merger.
// Branch order is immutable: choice_1 always means candidate.choices[0].
export const repairChoiceResolutionTargets = (
  context: NormalizedStoryContext,
  candidate: StoryCandidate,
  validationErrors: string[],
): string[] => {
  const rewriteAll = textRepairShouldRepairAllChoiceResolutions(validationErrors) ||
    validationErrors.includes('choice_resolution_defers_to_future_session')
  return candidate.choices
    .filter((choice) => rewriteAll || choiceNeedsResolutionLengthRepair(context, choice.resolution_text))
    .map((choice) => choice.choice_id)
}

""" + helper_anchor)
s = change(s,
    "  const repairAllChoiceResolutions = textRepairShouldRepairAllChoiceResolutions(validationErrors) || validationErrors.includes('choice_resolution_defers_to_future_session')\n",
    "  const resolutionTargetIds = new Set(repairChoiceResolutionTargets(context, candidate, validationErrors))\n", 'prompt choice target helper')
s = change(s,
    """  const resolutionTargets = candidate.choices
    .filter((choice) => repairAllChoiceResolutions || choiceNeedsResolutionLengthRepair(context, choice.resolution_text))
    .map((choice) => ({
      choice_id: choice.choice_id,""",
    """  const resolutionTargets = candidate.choices
    .map((choice, index) => ({
      slot: `choice_${index + 1}`,
      choice_id: choice.choice_id,""", 'prompt choice slots')
s = change(s,
    """      immutable_state_patch: choice.state_patch,
    }))
  const storyParagraphs""",
    """      immutable_state_patch: choice.state_patch,
    }))
    .filter((choice) => resolutionTargetIds.has(choice.choice_id))
  const storyParagraphs""", 'prompt choice slot filtering')
s = change(s,
    "'choice_resolutions must contain exactly the choice_ids listed in repair_plan.choice_resolutions, no missing ids and no extras.',",
    "'choice_resolutions is an object with required choice_1 and choice_2 slots. repair_plan.choice_resolutions lists the slot-to-choice_id mapping. Write one non-empty resolution_text string in each targeted slot, and null in each untargeted slot (both null for Episode 2). Never omit a slot, swap the branches or change a choice_id.',", 'prompt strict slot instruction')
prompt_path.write_text(s)

provider_path = Path('supabase/functions/story-generate/openai.ts')
s = provider_path.read_text()
s = change(s,
    'buildTextLengthRepairOutputSchema, buildTextLengthRepairPrompts, safetyOutputSchema',
    'buildTextLengthRepairOutputSchema, buildTextLengthRepairPrompts, repairChoiceResolutionTargets, safetyOutputSchema', 'provider imports')
s = change(s,
    "  choice_resolutions: Array<{ choice_id: string; resolution_text: string }>",
    "  choice_resolutions: { choice_1: string | null; choice_2: string | null }", 'provider structured type')
s = change(s,
    """const repairWordCount = (text: string): number => text.trim().split(/\\s+/u).filter(Boolean).length

""", '', 'obsolete word helper')
s = change(s,
    """const needsChoiceResolutionRepair = (context: NormalizedStoryContext, resolutionText: string): boolean => {
  if (!(context.ageGroup === '5-7' && context.storyMode === 'series' && context.storyMood === 'bedtime' && context.episodeIndex === 1)) {
    return false
  }
  const words = repairWordCount(resolutionText)
  return resolutionText.length > 360 || words < 25 || words > 60
}

""", '', 'obsolete duplicate targeting')
s = change(s,
    "buildTextLengthRepairOutputSchema(context, validationErrors),",
    "buildTextLengthRepairOutputSchema(context, validationErrors, candidate),", 'provider schema candidate')
s = change(s,
    "  const repairAllChoiceResolutions = textRepairShouldRepairAllChoiceResolutions(validationErrors) || validationErrors.includes('choice_resolution_defers_to_future_session')\n",
    '', 'obsolete provider all choices logic')
s = change(s,
    """  const targetChoiceIds = new Set(
    candidate.choices
      .filter((choice) => repairAllChoiceResolutions || needsChoiceResolutionRepair(context, choice.resolution_text))
      .map((choice) => choice.choice_id),
  )
  const repairedByChoiceId = new Map<string, string>()
  for (const item of repair.choice_resolutions) {
    if (!targetChoiceIds.has(item.choice_id)) continue
    if (repairedByChoiceId.has(item.choice_id) || !item.resolution_text.trim()) {
      throw new Error('openai_invalid_text_repair_choice')
    }
    repairedByChoiceId.set(item.choice_id, item.resolution_text)
  }
  if (repairedByChoiceId.size !== targetChoiceIds.size) throw new Error('openai_incomplete_text_repair_choices')
""",
    """  const targetChoiceIds = new Set(repairChoiceResolutionTargets(context, candidate, validationErrors))
  const slots = repair.choice_resolutions
  if (!slots || typeof slots !== 'object' || Array.isArray(slots) ||
    Object.keys(slots).sort().join(',') !== 'choice_1,choice_2') {
    throw new Error('openai_invalid_text_repair_choice_slots')
  }
  const repairedByChoiceId = new Map<string, string>()
  for (const [index, choice] of candidate.choices.entries()) {
    if (index >= 2) throw new Error('openai_invalid_text_repair_choice_slots')
    const text = index === 0 ? slots.choice_1 : slots.choice_2
    if (targetChoiceIds.has(choice.choice_id)) {
      if (typeof text !== 'string' || !text.trim()) throw new Error('openai_incomplete_text_repair_choices')
      repairedByChoiceId.set(choice.choice_id, text)
    } else if (text !== null) {
      throw new Error('openai_unexpected_text_repair_choice')
    }
  }
  if (candidate.choices.length < 2 && slots.choice_2 !== null) throw new Error('openai_unexpected_text_repair_choice')
  if (candidate.choices.length === 0 && slots.choice_1 !== null) throw new Error('openai_unexpected_text_repair_choice')
  if (repairedByChoiceId.size !== targetChoiceIds.size) throw new Error('openai_incomplete_text_repair_choices')
""", 'provider slot merge')
# Retain the import only if it is used elsewhere. The shared helper replaces it here.
s = change(s,
    "import { textRepairRequiresFullStoryRewrite, textRepairShouldRepairAllChoiceResolutions } from './repair-routing.ts'",
    "import { textRepairRequiresFullStoryRewrite } from './repair-routing.ts'", 'remove unused provider import') if "import { textRepairRequiresFullStoryRewrite, textRepairShouldRepairAllChoiceResolutions } from './repair-routing.ts'" in s else s
provider_path.write_text(s)

for filename in ('scripts/check-story-resolution-only-repair.mjs', 'scripts/check-story-cross-layer-contracts.mjs'):
    p = Path(filename)
    text = p.read_text()
    text = text.replace('buildTextLengthRepairOutputSchema(context, errors)', 'buildTextLengthRepairOutputSchema(context, errors, candidate)')
    text = text.replace('buildTextLengthRepairOutputSchema(context, lengthOnly)', 'buildTextLengthRepairOutputSchema(context, lengthOnly, candidate)')
    p.write_text(text)

p = Path('scripts/check-story-ai-safety.mjs')
s = p.read_text()
s = change(s,
    "'choice_resolutions must contain exactly the choice_ids listed in repair_plan.choice_resolutions',",
    "'choice_resolutions is an object with required choice_1 and choice_2 slots',", 'safety source assertion')
p.write_text(s)

print('V92_PATCH_APPLIED: schema fixes A/B slots; shared targeting, immutable untargeted branches and fail-closed structural parser; no providers contacted.')
