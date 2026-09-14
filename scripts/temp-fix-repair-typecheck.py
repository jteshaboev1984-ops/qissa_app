from pathlib import Path

p = Path('supabase/functions/story-generate/index.ts')
text = p.read_text()
old = """      const useLengthRepair = repairCandidate !== null
      const candidate = useLengthRepair
        ? await repairStoryCandidateLength(openAiApiKey, storyModel, context, repairCandidate, repairValidationErrors)
        : await generateStoryCandidate(openAiApiKey, storyModel, context, retryReason)
      if (useLengthRepair) {
        usedLengthRepair = true
        repairCandidate = null
        repairValidationErrors = []
      }

      const validationErrors = validateCandidate(context, candidate)"""
new = """      let candidate: StoryCandidate
      if (repairCandidate) {
        const candidateToRepair: StoryCandidate = repairCandidate
        candidate = await repairStoryCandidateLength(
          openAiApiKey,
          storyModel,
          context,
          candidateToRepair,
          repairValidationErrors,
        )
        usedLengthRepair = true
        repairCandidate = null
        repairValidationErrors = []
      } else {
        candidate = await generateStoryCandidate(openAiApiKey, storyModel, context, retryReason)
      }

      const validationErrors = validateCandidate(context, candidate)"""
if text.count(old) != 1:
    raise SystemExit(f'expected one target block, found {text.count(old)}')
p.write_text(text.replace(old, new))
for path in [
    Path('.github/workflows/temp-fix-targeted-repair-typecheck.yml'),
    Path('scripts/temp-fix-repair-typecheck.py'),
]:
    if path.exists():
        path.unlink()
