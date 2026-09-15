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
        "const aiEnabled = Boolean(openAiApiKey) && aiEnabledSetting !== 'false'",
        "const aiEnabled = Boolean(openAiApiKey) && aiEnabledSetting === 'true'",
    )

replace_once(
    'supabase/functions/story-generate/index.ts',
    "  // A configured API key enables the provider path by default. Operators can\n  // still fail closed instantly with QISSA_AI_ENABLED=false. No usage claim or\n  // provider request is made while the provider path is disabled or keyless.\n",
    "  // Story AI is explicit opt-in: a provider key alone is never enough.\n  // Only QISSA_AI_ENABLED=true may enter the provider path; absent, false, or\n  // any other value fails closed before accounting or provider requests.\n",
)

p = ROOT / 'scripts/check-story-cost-guard.mjs'
text = p.read_text(encoding='utf-8')
old = "const storyIndex = read('supabase/functions/story-generate/index.ts')\n"
new = "const storyIndex = read('supabase/functions/story-generate/index.ts')\nconst splitStoryIndex = read('supabase/functions/story-generate/split-index.ts')\n"
if old not in text:
    raise SystemExit('story index declaration not found')
text = text.replace(old, new, 1)
old = "requireCondition(\n  /aiEnabledSetting !== 'false'/.test(storyIndex) && /Boolean\\(openAiApiKey\\)/.test(storyIndex),\n  'A configured provider key should enable Story AI by default while QISSA_AI_ENABLED=false remains an emergency kill switch.',\n)\n"
new = "requireCondition(\n  /aiEnabledSetting === 'true'/.test(storyIndex) &&\n    /aiEnabledSetting === 'true'/.test(splitStoryIndex) &&\n    /Boolean\\(openAiApiKey\\)/.test(storyIndex) &&\n    /Boolean\\(openAiApiKey\\)/.test(splitStoryIndex),\n  'Story AI must fail closed unless QISSA_AI_ENABLED=true is explicitly configured in both production entrypoints.',\n)\n"
if old not in text:
    raise SystemExit('old cost guard assertion not found')
p.write_text(text.replace(old, new, 1), encoding='utf-8')

print('Story AI explicit opt-in guard applied.')
