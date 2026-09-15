from pathlib import Path

for name in [
    'supabase/functions/story-generate/index.ts',
    'supabase/functions/story-generate/split-index.ts',
]:
    path = Path(name)
    text = path.read_text()
    old = 'const STORY_AI_PRODUCTION_ROLLOUT_ENABLED = false'
    new = 'const STORY_AI_PRODUCTION_ROLLOUT_ENABLED = true'
    if old not in text:
        raise SystemExit(f'missing rollout gate in {name}')
    path.write_text(text.replace(old, new, 1))

path = Path('scripts/check-story-cost-guard.mjs')
text = path.read_text()
old = """  /STORY_AI_PRODUCTION_ROLLOUT_ENABLED = false/.test(storyIndex) &&
    /STORY_AI_PRODUCTION_ROLLOUT_ENABLED = false/.test(splitStoryIndex) &&"""
new = """  /STORY_AI_PRODUCTION_ROLLOUT_ENABLED = true/.test(storyIndex) &&
    /STORY_AI_PRODUCTION_ROLLOUT_ENABLED = true/.test(splitStoryIndex) &&"""
if old not in text:
    raise SystemExit('missing rollout gate assertion')
text = text.replace(old, new, 1)
text = text.replace(
    'Story AI must remain behind a code-reviewed false production rollout gate plus explicit QISSA_AI_ENABLED=true in both entrypoints.',
    'Story AI rollout must be explicitly code-reviewed ON and still require QISSA_AI_ENABLED=true plus a configured key in both entrypoints.',
)
path.write_text(text)
