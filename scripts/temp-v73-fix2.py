from pathlib import Path

path = Path('scripts/check-story-ai-safety.mjs')
text = path.read_text()
old = "  'For story_too_short, do NOT rewrite the existing story.',\n"
new = "  'For a pure Episode 1 story_too_short failure, do NOT rewrite the existing story.',\n  'title_rewrite',\n  'vocabulary_rewrite',\n  'A deterministic prose or language defect is already present in the Narrator output',\n"
if old not in text:
    raise SystemExit('old text-repair contract expectation missing')
path.write_text(text.replace(old, new, 1))
print('v73 safety contract expectation aligned')
