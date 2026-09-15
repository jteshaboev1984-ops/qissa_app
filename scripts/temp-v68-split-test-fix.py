from pathlib import Path

p = Path('scripts/check-story-ai-split.mjs')
text = p.read_text()
old = """requireFragments('interactive fear confirmation', repairProvider, [
  'needsInteractiveFearConfirmation',
  'previous internally consistent verdict flagged only excessive_fear',
  'Maximum semantic-safety calls on this path remain two',
  'Do not clear any real safety issue',
])
"""
new = """requireFragments('interactive fear adjudication', repairProvider, [
  'needsInteractiveFearConfirmation',
  'requestFearAdjudication',
  'narrow child-bedtime fear adjudicator',
  'fearAdjudicationConsistencyErrors(adjudication',
  'isolated excessive_fear was not confirmed by narrow fear adjudication',
])
"""
if text.count(old) != 1:
    raise SystemExit(f'expected one interactive fear confirmation block, got {text.count(old)}')
p.write_text(text.replace(old, new, 1))
