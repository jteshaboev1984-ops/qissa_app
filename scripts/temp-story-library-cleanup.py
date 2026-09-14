from pathlib import Path


def replace_once(path, old, new):
    p = Path(path)
    text = p.read_text(encoding='utf-8')
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')

replace_once(
    'src/contracts/storyContracts.ts',
    "export interface SeriesState {\n  id: string\n  /** Stable identity for the whole continuing series. */\n  childProfileId: string\n",
    "export interface SeriesState {\n  /** Stable identity for the whole continuing series. */\n  id: string\n  childProfileId: string\n",
)

replace_once(
    'supabase/functions/story-generate/story-architecture.ts',
    "    task: context.episodeIndex === 1\n      ? context.hasSeriesMemory\n        ? `Plan bedtime series session ${context.sessionIndex}, segment 1, using prior canon as continuity while starting one fresh story goal and two branch consequences.`\n        : 'Plan bedtime series session 1, segment 1 and its two branch consequences.'\n      : `Plan bedtime series session ${context.sessionIndex}, segment 2 after the confirmed choice consequence.`,\n",
    "    task: context.storyMode === 'one_time'\n      ? 'Plan one self-contained bedtime story with one gentle decision and its two safe branch consequences.'\n      : context.episodeIndex === 1\n        ? context.hasSeriesMemory\n          ? `Plan bedtime series session ${context.sessionIndex}, segment 1, using prior canon as continuity while starting one fresh story goal and two branch consequences.`\n          : 'Plan bedtime series session 1, segment 1 and its two branch consequences.'\n        : `Plan bedtime series session ${context.sessionIndex}, segment 2 after the confirmed choice consequence.`,\n",
)

print('Story Library cleanup patch applied.')
