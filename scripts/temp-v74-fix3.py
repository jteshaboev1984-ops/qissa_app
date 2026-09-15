from pathlib import Path

path = Path('scripts/check-story-ai-split.mjs')
text = path.read_text()
start = text.find("requireFragments('split orchestrator', orchestrator, [")
if start < 0:
    raise SystemExit('split orchestrator contract block missing')
end = text.find('\n])', start)
if end < 0:
    raise SystemExit('split orchestrator contract block terminator missing')
block = text[start:end]
obsolete = [
    "  'For missing_hero_token',\n",
    "  'For choice_resolution_defers_to_future_session',\n",
    "  'For visible_safety_language',\n",
    "  'For story_language_mismatch',\n",
    "  'For uzbek_child_language_requires_rewrite',\n",
    "  'For story_repeats_choice_menu',\n",
    "  'For technical_preview_language',\n",
    "  'For story_choice_menu_scaffolding',\n",
    "  'For branching_preview_language',\n",
]
for item in obsolete:
    block = block.replace(item, '')
text = text[:start] + block + text[end:]
path.write_text(text)
print('v74 split contract aligned with direct deterministic repair routing')
