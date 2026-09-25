import { readFileSync } from 'node:fs'

const app = readFileSync('src/App.tsx', 'utf8')
const main = readFileSync('src/main.tsx', 'utf8')
const seasons = readFileSync('src/data/sevenRoadsSeasons.ts', 'utf8')
const shell = readFileSync('src/components/PublishedStoriesShell.tsx', 'utf8')
const overview = readFileSync('src/components/SeasonOverview.tsx', 'utf8')
const consent = readFileSync('src/lib/publishedStoriesConsent.ts', 'utf8')
const welcome = readFileSync('src/components/PublishedStoriesWelcome.tsx', 'utf8')
const player = readFileSync('src/features/authoredStory/AuthoredStoryPlayer.tsx', 'utf8')
const readingPosition = readFileSync('src/lib/authoredReadingPosition.ts', 'utf8')
const uiAssets = readFileSync('src/data/sevenRoadsUiAssets.ts', 'utf8')
const settings = readFileSync('src/components/SevenRoadsSettingsScreen.tsx', 'utf8')
const readerPreferences = readFileSync('src/lib/sevenRoadsReaderPreferences.ts', 'utf8')

const failures = []
const requireText = (label, source, text) => {
  if (!source.includes(text)) failures.push(`${label} is missing: ${text}`)
}
const forbidText = (label, source, text) => {
  if (source.includes(text)) failures.push(`${label} must not contain: ${text}`)
}

for (const text of [
  'PublishedStoriesWelcome',
  'PublishedStoriesShell',
  'SeasonOverview',
  'publishedStoriesConsent',
  "type SevenRoadsView = 'shell' | 'season' | 'story' | 'settings'",
]) requireText('Seven Roads App', app, text)

for (const text of [
  'storyService',
  'OnboardingFlow',
  'HomeScreen',
  'LibraryScreen',
  'ParentScreen',
  'StoryScreen',
  'privacyConsent',
]) forbidText('Seven Roads App', app, text)

requireText('season data', seasons, "id: 'seven-roads-season-1'")
requireText('season data', seasons, "status: 'published'")
requireText('season data', seasons, "id: 'seven-roads-season-2'")
requireText('season data', seasons, "status: 'coming_soon'")

const episodeMatches = seasons.match(/\{ number: [1-6], title:/gu) ?? []
if (episodeMatches.length !== 6) {
  failures.push(`Season 1 must expose exactly 6 reader episodes, got ${episodeMatches.length}`)
}

requireText('public shell', shell, 'Сезон 1')
requireText('public shell', shell, 'Скоро')
requireText('public shell', shell, 'Следующая дорога')
requireText('public shell', shell, 'sevenRoadsUiAssets.home')
requireText('public shell', shell, 'sevenRoadsUiAssets.library')
requireText('public shell', shell, 'sevenRoadsUiAssets.futureSeasonPlaceholder')
requireText('public shell', shell, "find((season) => season.status === 'coming_soon')")
requireText('public shell', shell, 'onOpenSettings')
requireText('public shell', shell, 'aria-label="Настройки"')
requireText('season overview', overview, 'Путь сезона')
requireText('season overview', overview, 'resolveAuthoredStoryAssetUrl')
requireText('season overview', overview, '6 серий')

requireText('family consent', consent, 'progressStorageAccepted')
forbidText('family consent', consent, 'aiProcessingAccepted')
requireText('first-run flow', welcome, 'Аккаунт, email и пароль сейчас не нужны')
requireText('first-run flow', welcome, 'прогресс чтения и решения ребёнка')
requireText('first-run flow', welcome, 'sevenRoadsUiAssets.welcome')

for (const text of [
  'storyStateService',
  'localPersistence',
  'closedBetaMigration',
  'migratePersistedStoryIntoClosedBetaScope',
]) forbidText('Seven Roads bootstrap', main, text)

requireText('reader', player, 'Серия {readerProgress.current} из {readerProgress.total}')
requireText('reader', player, 'Сезон {seasonNumber} завершён')
requireText('reader', player, 'Следующий сезон — скоро')
requireText('reader', player, 'Коснитесь экрана, чтобы вернуться')
requireText('reader', player, 'Завершить на сегодня')
requireText('reader', player, 'Серия {readerProgress.current} завершена')
requireText('reader', player, 'Следующая серия')
requireText('reader', player, 'Завершить сезон')
requireText('reader', player, 'Закрыть')
requireText('reader', player, 'authoredReadingPosition.save')
requireText('reader', player, 'authoredReadingPosition.clear')
requireText('reader', player, 'Настройки чтения')
requireText('reader', player, 'aria-label="Настройки чтения"')
requireText('reader', player, 'getReaderTextStyle')
requireText('Seven Roads App', app, 'onFinishForToday')
requireText('Seven Roads App', app, "setView('shell')")
requireText('Seven Roads App', app, "setView('settings')")
requireText('Seven Roads settings', settings, 'Настройки')
requireText('Seven Roads settings', settings, 'Сбросить прогресс сезона')
requireText('Seven Roads settings', settings, 'ReaderSettingsPanel')
requireText('Seven Roads reader preferences', readerPreferences, 'sevenRoadsReaderPreferences')
requireText('reading position persistence', readingPosition, 'scroll_y')
requireText('reading position persistence', readingPosition, 'part_index')

for (const asset of [
  'seven_roads_welcome_world_v1.webp',
  'seven_roads_home_approach_v1.webp',
  'seven_roads_library_hall_v1.webp',
  'seven_roads_future_season_placeholder_v1.webp',
]) requireText('approved UI asset registry', uiAssets, asset)

if (failures.length > 0) {
  console.error('Seven Roads product shell check failed:')
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log('Seven Roads product shell check passed.')
