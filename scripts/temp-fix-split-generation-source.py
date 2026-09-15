from pathlib import Path

ROOT = Path('.')

def replace_once(path: str, old: str, new: str) -> None:
    p = ROOT / path
    text = p.read_text(encoding='utf-8')
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')

replace_once(
    'supabase/functions/story-generate/split-index.ts',
    "  { episode: buildSafeFallback(context) },\n",
    "  { episode: { ...buildSafeFallback(context), generationSource: 'safe-fallback' } },\n",
)

replace_once(
    'supabase/functions/story-generate/split-index.ts',
    "      { episode },\n      200,\n",
    "      { episode: { ...episode, generationSource: 'openai-structured' } },\n      200,\n",
)

p = ROOT / 'scripts/check-story-library-persistence.mjs'
text = p.read_text(encoding='utf-8')
old = "const storyGenerate = read('supabase/functions/story-generate/index.ts')\nconst storyRemote = read('src/lib/storyRemoteClient.ts')\n"
new = "const storyGenerate = read('supabase/functions/story-generate/index.ts')\nconst storyGenerateSplit = read('supabase/functions/story-generate/split-index.ts')\nconst storyRemote = read('src/lib/storyRemoteClient.ts')\n"
if old not in text:
    raise SystemExit('story library contract source declarations not found')
text = text.replace(old, new, 1)
old = "requireCondition(/generationSource: 'safe-fallback'/.test(storyGenerate) && /generationSource: 'openai-structured'/.test(storyGenerate), 'Story Edge Function must stamp the actual generation source into episode payloads.')\n"
new = "requireCondition(/generationSource: 'safe-fallback'/.test(storyGenerate) && /generationSource: 'openai-structured'/.test(storyGenerate), 'Legacy Story Edge Function must stamp the actual generation source into episode payloads.')\nrequireCondition(/generationSource: 'safe-fallback'/.test(storyGenerateSplit) && /generationSource: 'openai-structured'/.test(storyGenerateSplit), 'Deployed split Story Edge Function must stamp the actual generation source into episode payloads.')\n"
if old not in text:
    raise SystemExit('generation source regression assertion not found')
p.write_text(text.replace(old, new, 1), encoding='utf-8')

print('Split pipeline generationSource stamping applied.')
