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

split = Path('scripts/check-story-ai-split.mjs')
text = split.read_text()
invalid = "  'identity_token: '{{HERO}}'',"
valid = '  "identity_token: \'{{HERO}}\'",'
if invalid not in text:
    raise SystemExit('identity token fragment quote marker missing')
text = text.replace(invalid, valid, 1)
old = "  'For Episode 2, continue immediately after the already-confirmed resolution bridge',"
new = "  'For Episode 2, the confirmed resolution_text in memory has ALREADY been shown to the child before this segment starts.',"
if old not in text:
    raise SystemExit('legacy Episode 2 bridge fragment missing')
split.write_text(text.replace(old, new, 1))
