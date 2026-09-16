from pathlib import Path

path = Path('scripts/check-story-ai-split.mjs')
text = path.read_text()
old = "requireFragments('repair contract observability', splitIndex, ["
new = "requireFragments('repair contract observability', orchestrator, ["
if old not in text:
    raise SystemExit('temporary split-check replacement target missing')
path.write_text(text.replace(old, new, 1))
