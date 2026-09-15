from pathlib import Path

path = Path('scripts/check-story-ai-split.mjs')
text = path.read_text()
old = """  'make living forest characters drive the story',
  'central goal must stay warm, social or playful',
  'Do not center the plot on finding the way home',
  'For Uzbek ages 5-7, prefer common natural Uzbek words',
  'prefer words common in everyday family speech',
  'chorraha, paporotnik, kapyushon, ritm, spiral and tantanali',
"""
new = """  'make living forest characters drive the story',
  'central goal must stay warm, social or playful',
  'Do not center the plot on finding the way home',
  'For Uzbek ages 5-7, prefer common natural Uzbek words',
"""
if text.count(old) != 1:
    raise SystemExit('architecture language-fragment cleanup marker mismatch')
text = text.replace(old, new, 1)
marker = "const continuationBlueprint = enforceStoryBlueprintContextContract("
addition = """requireFragments('Uzbek child language prompt', repairPrompt, [
  'prefer words common in everyday family speech',
  'chorraha, paporotnik, kapyushon, ritm, spiral and tantanali',
])

""" + marker
if text.count(marker) != 1:
    raise SystemExit('Uzbek prompt contract insertion marker mismatch')
path.write_text(text.replace(marker, addition, 1))
