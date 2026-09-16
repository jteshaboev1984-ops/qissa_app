from pathlib import Path

path = Path('scripts/check-story-ai-safety.mjs')
text = path.read_text()
old = "  'const entriesToRecord = (entries: unknown)',"
new = "  \"const entriesToRecord = (entries: unknown, heroName = '')\"," 
if old not in text:
    raise SystemExit('entriesToRecord contract marker missing')
text = text.replace(old, new, 1)
old = "  'export const finalPatchFromCandidate = (patch: unknown)',"
new = "  \"export const finalPatchFromCandidate = (patch: unknown, heroName = '')\"," 
if old not in text:
    raise SystemExit('finalPatchFromCandidate contract marker missing')
path.write_text(text.replace(old, new, 1))
