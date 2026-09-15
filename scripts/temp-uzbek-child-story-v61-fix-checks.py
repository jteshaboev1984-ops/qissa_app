from pathlib import Path


def replace_once(path: str, old: str, new: str):
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected exactly one match, got {count}: {old[:140]!r}')
    p.write_text(text.replace(old, new, 1))

# The legacy safety check intentionally inspects the legacy index/provider. Keep it unchanged;
# v61 production assertions belong in the split-pipeline contract check instead.
check = 'scripts/check-story-ai-safety.mjs'
replace_once(
    check,
    "  'choice_resolution_too_long',\n  'bedtime_coda_too_short',\n  'bedtime_coda_too_long',\n  'repairStoryCandidateTextLengths',",
    "  'choice_resolution_too_long',\n  'repairStoryCandidateTextLengths',",
)
replace_once(
    check,
    "  'buildTextLengthRepairPrompts',\n  'rewriteContinuation',\n  'final_bedtime_coda_words',\n  'textLengthRepairOutputSchema',",
    "  'buildTextLengthRepairPrompts',\n  'textLengthRepairOutputSchema',",
)

split_check = 'scripts/check-story-ai-split.mjs'
p = Path(split_check)
text = p.read_text()
marker = "const safety = fs.readFileSync('supabase/functions/story-generate/safety.ts', 'utf8')\nconst languageGuard = fs.readFileSync('supabase/functions/story-generate/language.ts', 'utf8')"
new = "const safety = fs.readFileSync('supabase/functions/story-generate/safety.ts', 'utf8')\nconst repairPrompt = fs.readFileSync('supabase/functions/story-generate/prompt.ts', 'utf8')\nconst repairProvider = fs.readFileSync('supabase/functions/story-generate/openai.ts', 'utf8')\nconst localization = fs.readFileSync('supabase/functions/story-generate/localization.ts', 'utf8')\nconst languageGuard = fs.readFileSync('supabase/functions/story-generate/language.ts', 'utf8')"
if text.count(marker) != 1:
    raise SystemExit('split check source marker mismatch')
text = text.replace(marker, new, 1)

marker = "  'repairStoryCandidateTextLengths',\n  'evaluateStorySafety',"
if text.count(marker) != 1:
    raise SystemExit('split orchestrator marker mismatch')
text = text.replace(marker, "  'repairStoryCandidateTextLengths',\n  'bedtime_coda_too_short',\n  'bedtime_coda_too_long',\n  'evaluateStorySafety',", 1)

marker = "requireFragments('scaling architecture doc', scalingDoc, ["
addition = """requireFragments('Episode 2 text repair prompt', repairPrompt, [
  'rewriteContinuation',
  'final_bedtime_coda_words',
  '60-120 words in the final paragraph',
  'same Episode 2 plot, same selected-choice consequence',
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

""" + marker
if text.count(marker) != 1:
    raise SystemExit('split scaling marker mismatch')
p.write_text(text.replace(marker, addition, 1))
