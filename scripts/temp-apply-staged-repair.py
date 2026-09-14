from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, got {count}: {old[:120]!r}')
    p.write_text(text.replace(old, new))


index = 'supabase/functions/story-generate/index.ts'
replace_once(index, 'const maxAttempts = 2', 'const maxAttempts = 3\nconst maxFullGenerationAttempts = 2')
replace_once(
    index,
    "  let attemptsUsed = 0\n  let lastFailureClass = 'unknown'",
    "  let attemptsUsed = 0\n  let fullGenerationAttempts = 0\n  let lastFailureClass = 'unknown'",
)
replace_once(
    index,
    "      } else {\n        candidate = await generateStoryCandidate(openAiApiKey, storyModel, context, retryReason)\n      }",
    "      } else {\n        if (fullGenerationAttempts >= maxFullGenerationAttempts) break\n        fullGenerationAttempts += 1\n        candidate = await generateStoryCandidate(openAiApiKey, storyModel, context, retryReason)\n      }",
)
replace_once(
    index,
    "        if (attempt < maxAttempts && isTextLengthOnlyFailure(validationErrors)) {\n          repairCandidate = candidate\n          repairValidationErrors = [...validationErrors]\n        } else {\n          repairCandidate = null\n          repairValidationErrors = []\n        }\n        continue",
    "        if (attempt < maxAttempts && isTextLengthOnlyFailure(validationErrors)) {\n          repairCandidate = candidate\n          repairValidationErrors = [...validationErrors]\n          continue\n        }\n\n        repairCandidate = null\n        repairValidationErrors = []\n        // At most two full generations are allowed. A third provider stage is\n        // reserved exclusively for deterministic text-length repair, never for\n        // another full rewrite of choices, state or canon.\n        if (!usedTextLengthRepair && fullGenerationAttempts < maxFullGenerationAttempts && attempt < maxAttempts) {\n          continue\n        }\n        break",
)
replace_once(
    index,
    "        failureTrace.push(`deterministic-safety:${flags.join(',') || 'flagged'}`)\n        continue",
    "        failureTrace.push(`deterministic-safety:${flags.join(',') || 'flagged'}`)\n        if (!usedTextLengthRepair && fullGenerationAttempts < maxFullGenerationAttempts && attempt < maxAttempts) continue\n        break",
)
replace_once(
    index,
    "        failureTrace.push(`semantic-safety:${flags.join(',') || safety.required_action}`)\n        continue",
    "        failureTrace.push(`semantic-safety:${flags.join(',') || safety.required_action}`)\n        if (!usedTextLengthRepair && fullGenerationAttempts < maxFullGenerationAttempts && attempt < maxAttempts) continue\n        break",
)
replace_once(
    index,
    "          'X-QISSA-Generation-Attempts': String(attempt),\n          'X-QISSA-Generation-Repair': usedTextLengthRepair ? 'text-length' : 'none',",
    "          'X-QISSA-Generation-Attempts': String(attempt),\n          'X-QISSA-Full-Generation-Attempts': String(fullGenerationAttempts),\n          'X-QISSA-Generation-Repair': usedTextLengthRepair ? 'text-length' : 'none',",
)
replace_once(
    index,
    "      'X-QISSA-Generation-Attempts': String(attemptsUsed),\n      'X-QISSA-Generation-Failure-Class': lastFailureClass,",
    "      'X-QISSA-Generation-Attempts': String(attemptsUsed),\n      'X-QISSA-Full-Generation-Attempts': String(fullGenerationAttempts),\n      'X-QISSA-Generation-Failure-Class': lastFailureClass,",
)

check = 'scripts/check-story-ai-safety.mjs'
replace_once(check, "  'maxAttempts = 2',", "  'maxAttempts = 3',\n  'maxFullGenerationAttempts = 2',")
replace_once(
    check,
    "  \"'X-QISSA-Generation-Repair'\",\n  \"'X-QISSA-Generation-Source': 'safe-fallback'\",",
    "  \"'X-QISSA-Generation-Repair'\",\n  \"'X-QISSA-Full-Generation-Attempts'\",\n  'fullGenerationAttempts >= maxFullGenerationAttempts',\n  'A third provider stage is',\n  'reserved exclusively for deterministic text-length repair',\n  \"'X-QISSA-Generation-Source': 'safe-fallback'\",",
)

for temp_path in [
    Path('scripts/temp-apply-staged-repair.py'),
    Path('.github/workflows/temp-apply-staged-repair.yml'),
]:
    if temp_path.exists():
        temp_path.unlink()
