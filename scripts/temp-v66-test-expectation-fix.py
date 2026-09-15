from pathlib import Path
p = Path('scripts/check-story-ai-split.mjs')
text = p.read_text()
old = "  'For Episode 2, continue after the already-confirmed resolution bridge',\n"
new = "  'For Episode 2, continue immediately after the already-confirmed resolution bridge',\n"
if text.count(old) != 1:
    raise SystemExit(f'old Episode 2 architecture expectation count={text.count(old)}')
p.write_text(text.replace(old, new, 1))
