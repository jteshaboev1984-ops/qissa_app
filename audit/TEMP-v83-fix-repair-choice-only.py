from pathlib import Path
path = Path('supabase/functions/story-generate/prompt.ts')
data = path.read_text(encoding='utf-8')
lines = data.splitlines(keepends=True)
prefix = "      : 'For a pure Episode 1 story_too_short failure,"
indexes = [index for index, line in enumerate(lines) if line.startswith(prefix)]
if len(indexes) != 1:
    raise SystemExit(f'Expected exactly one existing contradictory choice-only repair instruction, found {len(indexes)}')
index = indexes[0]
original = lines[index].strip()
if not original.startswith(': ') or not original.endswith("',"):
    raise SystemExit('Unexpected original Repair conditional format')
original_prose = original[2:-1]
lines[index] = (
    '      : storyTooShort\n'
    f'        ? {original_prose}\n'
    "        : 'For a choice-resolution-only repair, return title_rewrite, story_rewrite and story_expansion as null. Return only the exact choice_resolutions listed in repair_plan; do not insert into, rewrite or otherwise alter story_text.',\n"
)
path.write_text(''.join(lines), encoding='utf-8')
print('C6 source prompt now has distinct full-rewrite / short-insertion / choice-only branches.')
