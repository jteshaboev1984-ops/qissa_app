from pathlib import Path

source = Path('supabase/functions/story-generate/split-index.ts')
text = source.read_text(encoding='utf-8')

def replace_exact(original, updated, count=1):
    global text
    actual = text.count(original)
    if actual != count:
        raise SystemExit(f'PATCH_GUARD_FAILED occurrence count expected={count} actual={actual}')
    text = text.replace(original, updated)

replace_exact(
    "import { clearAdjudicatedNonSevereViolence, combineSafety, moderationNeedsFearAdjudication, scanRuleBasedSafety, validateCandidate } from './safety.ts'\n",
    "import { clearAdjudicatedNonSevereViolence, combineSafety, moderationNeedsFearAdjudication, scanRuleBasedSafety, validateCandidate } from './safety.ts'\nimport { candidateLanguageMismatchFieldCodes } from './language-diagnostics.ts'\n",
)
replace_exact(
    "const candidateValidationMetrics = (candidate: StoryCandidate): string[] => [\n  `story_words=${wordCount(candidate.story_text)}`,\n  ...candidate.choices.map((choice, index) => `choice_${index + 1}_resolution_words=${wordCount(choice.resolution_text)}`),\n]\n",
    "const candidateValidationMetrics = (\n  context: NonNullable<ReturnType<typeof normalizeStoryRequest>>,\n  candidate: StoryCandidate,\n): string[] => {\n  const languageFields = candidateLanguageMismatchFieldCodes(context, candidate)\n  return [\n    `story_words=${wordCount(candidate.story_text)}`,\n    ...candidate.choices.map((choice, index) => `choice_${index + 1}_resolution_words=${wordCount(choice.resolution_text)}`),\n    ...(languageFields.length > 0 ? [`language_fields=${languageFields.join('+')}`] : []),\n  ]\n}\n",
)
if text.count('candidateValidationMetrics(candidate)') != 5:
    raise SystemExit(f'PATCH_GUARD_FAILED metrics calls={text.count("candidateValidationMetrics(candidate)")}')
text = text.replace('candidateValidationMetrics(candidate)', 'candidateValidationMetrics(context, candidate)')
assert text.count('candidateValidationMetrics(context, candidate)') == 5
source.write_text(text, encoding='utf-8')

package = Path('package.json')
pkg = package.read_text(encoding='utf-8')
old = '"@types/react": "^18.3.0"'
if pkg.count(old) != 1:
    raise SystemExit('PATCH_GUARD_FAILED restore package metadata')
pkg = pkg.replace(old, '"@types/react": "^18.3.7"')
package.write_text(pkg, encoding='utf-8')

regression = Path('scripts/check-story-language-diagnostics.mjs')
code = regression.read_text(encoding='utf-8')
old_call = "buildTextLengthRepairOutputSchema(context, ['story_language_mismatch', 'story_too_short'])"
if code.count(old_call) != 1:
    raise SystemExit('PATCH_GUARD_FAILED candidate-scoped v92 schema test')
regression.write_text(code.replace(old_call, "buildTextLengthRepairOutputSchema(context, ['story_language_mismatch', 'story_too_short'], short)"), encoding='utf-8')

print('V93_SAFE_PATCH_COMPLETE: import, metrics, 5 calls, package restored, schema test corrected; no external provider.')
