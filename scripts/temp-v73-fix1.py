from pathlib import Path

path = Path('scripts/check-story-core-proof.mjs')
text = path.read_text()
old = "  seriesId: 'story-editorial-proof', episodeIndex: 1, isContinuation: false,\n  recurringCharacters: [], lastEpisodeSummary: '', activeArc: '',\n  relationshipState: {}, canonState: {}, choiceHistory: [],\n"
new = "  seriesId: 'story-editorial-proof', sessionId: 'story-editorial-proof-session', sessionIndex: 1,\n  seriesSessionsRemaining: 10, isFinalSeriesSession: false, episodeIndex: 1, isContinuation: false, hasSeriesMemory: false,\n  recurringCharacters: [], lastEpisodeSummary: '', activeArc: '',\n  relationshipState: {}, canonState: {}, choiceHistory: [],\n"
if old not in text:
    raise SystemExit('baseContext fixture fragment missing')
path.write_text(text.replace(old, new, 1))
print('v73 fixture completed')
