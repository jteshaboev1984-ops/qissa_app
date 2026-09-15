from pathlib import Path


def replace_once(path_name, old, new, label):
    path = Path(path_name)
    text = path.read_text()
    if old not in text:
        raise SystemExit(f'{label} fragment missing')
    path.write_text(text.replace(old, new, 1))


replace_once(
    'scripts/check-story-core-proof.mjs',
    "  seriesId: 'story-editorial-proof', episodeIndex: 1, isContinuation: false,\n  recurringCharacters: [], lastEpisodeSummary: '', activeArc: '',\n  relationshipState: {}, canonState: {}, choiceHistory: [],\n",
    "  seriesId: 'story-editorial-proof', sessionId: 'story-editorial-proof-session', sessionIndex: 1,\n  seriesSessionsRemaining: 10, isFinalSeriesSession: false, episodeIndex: 1, isContinuation: false, hasSeriesMemory: false,\n  recurringCharacters: [], lastEpisodeSummary: '', activeArc: '',\n  relationshipState: {}, canonState: {}, choiceHistory: [],\n",
    'story-core baseContext fixture',
)

replace_once(
    'scripts/report-bedtime-duration.mjs',
    "  seriesId: `duration-${language}-${stylePackId}`,\n  episodeIndex: 1,\n  isContinuation: false,\n  recurringCharacters: [],\n",
    "  seriesId: `duration-${language}-${stylePackId}`,\n  sessionId: `duration-${language}-${stylePackId}-session`,\n  sessionIndex: 1,\n  seriesSessionsRemaining: 10,\n  isFinalSeriesSession: false,\n  episodeIndex: 1,\n  isContinuation: false,\n  hasSeriesMemory: false,\n  recurringCharacters: [],\n",
    'duration baseContext fixture',
)

print('v73 direct story context fixtures completed')
