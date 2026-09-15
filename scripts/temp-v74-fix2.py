from pathlib import Path

path = Path('scripts/check-story-ai-safety.mjs')
text = path.read_text()
old = "  'isTextRepairEligibleFailure',\n  'deterministic-safety-pre-repair',\n  'nonrepairable-validation',\n"
new = "  'isTextLengthOnlyFailure',\n"
if old not in text:
    raise SystemExit('generated split-only expectations missing from legacy entrypoint contract')
path.write_text(text.replace(old, new, 1))
print('v74 legacy entrypoint contract kept separate from split pipeline checks')
