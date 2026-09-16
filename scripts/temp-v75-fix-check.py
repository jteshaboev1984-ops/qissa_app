from pathlib import Path

path = Path('scripts/check-story-ai-split.mjs')
text = path.read_text()
old = "requireFragments('repair contract observability', splitIndex, ["
new = "requireFragments('repair contract observability', orchestrator, ["
if old not in text:
    raise SystemExit('temporary split-check replacement target missing')
text = text.replace(old, new, 1)
old_block = """requireFragments('Episode 2 text repair provider', repairProvider, [
  'codaLengthFailure',
  'fullStoryRewrite',
  'openai_invalid_full_text_repair_rewrite',
])"""
new_block = """requireFragments('Episode 2 text repair routing', repairPrompt, [
  'codaTooShort',
  'codaTooLong',
  'textRepairRequiresFullStoryRewrite',
  'buildTextLengthRepairOutputSchema',
])
requireFragments('Episode 2 text repair provider', repairProvider, [
  'fullStoryRewrite',
  'openai_invalid_full_text_repair_rewrite',
])"""
if old_block not in text:
    raise SystemExit('Episode 2 repair-provider test block missing')
path.write_text(text.replace(old_block, new_block, 1))
