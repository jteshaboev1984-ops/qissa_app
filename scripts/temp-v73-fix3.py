from pathlib import Path

path = Path('scripts/check-story-ai-split.mjs')
text = path.read_text()
old = "const badBlueprintErrors = validateStoryBlueprint({ language: 'uz', ageGroup: '5-7', episodeIndex: 1, storyMode: 'series', isFinalSeriesSession: false, recurringCharacters: [] }, badImmutableUzBlueprint)\n"
new = "const badBlueprintErrors = validateStoryBlueprint({ language: 'uz', ageGroup: '5-7', episodeIndex: 1, storyMode: 'series', storyMood: 'bedtime', isFinalSeriesSession: false, recurringCharacters: [], canonState: {}, relationshipState: {} }, badImmutableUzBlueprint)\n"
if old not in text:
    raise SystemExit('bad blueprint validator fixture fragment missing')
path.write_text(text.replace(old, new, 1))
print('v73 blueprint validator fixture completed')
