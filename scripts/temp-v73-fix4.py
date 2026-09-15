from pathlib import Path

path = Path('scripts/check-story-ai-split.mjs')
text = path.read_text()

old = "const orchestrator = fs.readFileSync('supabase/functions/story-generate/split-index.ts', 'utf8')\n"
new = "const orchestrator = fs.readFileSync('supabase/functions/story-generate/split-index.ts', 'utf8')\nconst repairRouting = fs.readFileSync('supabase/functions/story-generate/repair-routing.ts', 'utf8')\n"
if old not in text:
    raise SystemExit('orchestrator source load fragment missing')
text = text.replace(old, new, 1)

text = text.replace("context.episodeIndex === 1 ? '350-390' : '430-490'", "context.episodeIndex === 1 ? '380-420' : '430-490'", 1)
text = text.replace("  'bedtime_coda_too_short',\n  'bedtime_coda_too_long',\n", "", 1)
text = text.replace("  'rewriteContinuation',\n", "  'fullStoryRewrite',\n", 1)
text = text.replace("  'rewriteContinuation',\n  'openai_invalid_continuation_text_repair_rewrite',\n", "  'fullStoryRewrite',\n  'openai_invalid_full_text_repair_rewrite',\n", 1)

anchor = "requireFragments('Episode 2 text repair prompt', repairPrompt, [\n"
block = "requireFragments('centralized repair routing', repairRouting, [\n  'bedtime_coda_too_short',\n  'bedtime_coda_too_long',\n  'uzbek_child_language_requires_rewrite',\n  'visible_safety_language',\n  'russian_hero_requires_rewrite',\n  'insufficient_narrative_beats',\n  'story_repeats_choice_menu',\n  'story_choice_menu_scaffolding',\n  'isTextRepairEligibleFailure',\n  'textRepairRequiresFullStoryRewrite',\n])\n\n"
if anchor not in text:
    raise SystemExit('Episode 2 repair prompt anchor missing')
text = text.replace(anchor, block + anchor, 1)
path.write_text(text)
print('v73 split contract aligned with centralized repair routing')
