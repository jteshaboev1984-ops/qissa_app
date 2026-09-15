from pathlib import Path

p = Path('scripts/check-story-safety-verdict.mjs')
text = p.read_text()
old = "const severeReturn = provider.indexOf('if (adjudication.excessive_fear) return first', adjudicationValidation)\n"
new = "const severeReturn = provider.indexOf('if (adjudication.excessive_fear) {', adjudicationValidation)\n"
if text.count(old) != 1:
    raise SystemExit(f'expected one old severe fear ordering marker, got {text.count(old)}')
p.write_text(text.replace(old, new, 1))
