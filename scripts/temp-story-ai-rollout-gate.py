from pathlib import Path

ROOT = Path('.')

def replace_once(path: str, old: str, new: str) -> None:
    p = ROOT / path
    text = p.read_text(encoding='utf-8')
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')

for path in [
    'supabase/functions/story-generate/index.ts',
    'supabase/functions/story-generate/split-index.ts',
]:
    replace_once(
        path,
        "const aiEnabledSetting = Deno.env.get('QISSA_AI_ENABLED')?.trim().toLowerCase()\nconst aiEnabled = Boolean(openAiApiKey) && aiEnabledSetting === 'true'",
        "const STORY_AI_PRODUCTION_ROLLOUT_ENABLED = false\nconst aiEnabledSetting = Deno.env.get('QISSA_AI_ENABLED')?.trim().toLowerCase()\nconst aiEnabled = STORY_AI_PRODUCTION_ROLLOUT_ENABLED && Boolean(openAiApiKey) && aiEnabledSetting === 'true'",
    )

replace_once(
    'supabase/functions/story-generate/index.ts',
    "  // Story AI is explicit opt-in: a provider key alone is never enough.\n  // Only QISSA_AI_ENABLED=true may enter the provider path; absent, false, or\n  // any other value fails closed before accounting or provider requests.\n",
    "  // Story AI is fail-closed behind a code-reviewed production rollout gate.\n  // Even QISSA_AI_ENABLED=true cannot enter the provider path while the rollout\n  // gate is false. Enabling paid generation therefore requires an explicit code change.\n",
)

p = ROOT / 'scripts/check-story-cost-guard.mjs'
text = p.read_text(encoding='utf-8')
old = "requireCondition(\n  /aiEnabledSetting === 'true'/.test(storyIndex) &&\n    /aiEnabledSetting === 'true'/.test(splitStoryIndex) &&\n    /Boolean\\(openAiApiKey\\)/.test(storyIndex) &&\n    /Boolean\\(openAiApiKey\\)/.test(splitStoryIndex),\n  'Story AI must fail closed unless QISSA_AI_ENABLED=true is explicitly configured in both production entrypoints.',\n)\n"
new = "requireCondition(\n  /STORY_AI_PRODUCTION_ROLLOUT_ENABLED = false/.test(storyIndex) &&\n    /STORY_AI_PRODUCTION_ROLLOUT_ENABLED = false/.test(splitStoryIndex) &&\n    /STORY_AI_PRODUCTION_ROLLOUT_ENABLED && Boolean\\(openAiApiKey\\) && aiEnabledSetting === 'true'/.test(storyIndex) &&\n    /STORY_AI_PRODUCTION_ROLLOUT_ENABLED && Boolean\\(openAiApiKey\\) && aiEnabledSetting === 'true'/.test(splitStoryIndex),\n  'Story AI must remain behind a code-reviewed false production rollout gate plus explicit QISSA_AI_ENABLED=true in both entrypoints.',\n)\n"
if old not in text:
    raise SystemExit('strict opt-in cost guard assertion not found')
p.write_text(text.replace(old, new, 1), encoding='utf-8')

print('Story AI compile-time production rollout gate applied.')
