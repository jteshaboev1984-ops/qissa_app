import { readFileSync } from 'node:fs'

const app = readFileSync('src/App.tsx', 'utf8')
const main = readFileSync('src/main.tsx', 'utf8')
const seasons = readFileSync('src/data/sevenRoadsSeasons.ts', 'utf8')
const authoredStories = readFileSync('src/data/authoredStories.ts', 'utf8')
const authoredLocalization = readFileSync('src/features/authoredStory/localizePackage.ts', 'utf8')
const shell = readFileSync('src/components/PublishedStoriesShell.tsx', 'utf8')
const overview = readFileSync('src/components/SeasonOverview.tsx', 'utf8')
const consent = readFileSync('src/lib/publishedStoriesConsent.ts', 'utf8')
const welcome = readFileSync('src/components/PublishedStoriesWelcome.tsx', 'utf8')
const player = readFileSync('src/features/authoredStory/AuthoredStoryPlayer.tsx', 'utf8')
const readingPosition = readFileSync('src/lib/authoredReadingPosition.ts', 'utf8')
const authoredPersistence = readFileSync('src/lib/authoredStoryPersistence.ts', 'utf8')
const uiAssets = readFileSync('src/data/sevenRoadsUiAssets.ts', 'utf8')
const settings = readFileSync('src/components/SevenRoadsSettingsScreen.tsx', 'utf8')
const readerPreferences = readFileSync('src/lib/sevenRoadsReaderPreferences.ts', 'utf8')
const languagePreference = readFileSync('src/lib/sevenRoadsLanguagePreference.ts', 'utf8')
const copy = readFileSync('src/features/publishedStories/sevenRoadsCopy.ts', 'utf8')
const illustrationDiscovery = readFileSync('src/lib/authoredIllustrationDiscovery.ts', 'utf8')
const dictionaries = readFileSync('src/i18n/dictionaries.ts', 'utf8')

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
  'sevenRoadsLanguagePreference.load()',
  'getSevenRoadsSeason1(language)',
  'onLanguageChange={changeLanguage}',
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
requireText('season data', seasons, "getSevenRoadsSeason1")
requireText('season data', seasons, "prazdnikMuzhestvaV3ByLanguage[language]")
requireText('season data', seasons, "'Jasorat bayrami'")
requireText('season data', seasons, "'Sharqiy o‘rmon'")
requireText('season data', seasons, "'Qaytish'")
requireText('season data', seasons, '.map((title, index)')

requireText('authored stories', authoredStories, 'prazdnikMuzhestvaV3.uz.json')
requireText('authored stories', authoredStories, 'localizeAuthoredStoryPackage')
requireText('authored stories', authoredStories, 'prazdnikMuzhestvaV3ByLanguage')
requireText('authored localization', authoredLocalization, 'image_anchor_texts')
requireText('authored localization', authoredLocalization, 'localized image anchor must occur exactly once')
requireText('authored localization', authoredLocalization, 'last_event: localized.last_event')

requireText('Seven Roads copy', copy, "export type SevenRoadsLanguage = 'ru' | 'uz'")
requireText('Seven Roads copy', copy, "const ru =")
requireText('Seven Roads copy', copy, "const uz =")
requireText('Seven Roads copy', copy, "worldTitle: 'Yetti yo‘l qirolligi'")
requireText('Seven Roads copy', copy, "completionSummary: 'Temur va Samira qirollikning yosh bahodirlariga aylanishdi.'")
requireText('Seven Roads copy', copy, "consentTitle: 'Сохраняем прогресс и настройки на этом устройстве'")
requireText('Seven Roads copy', copy, "consentTitle: 'Jarayon va sozlamalarni shu qurilmada saqlaymiz'")
requireText('Seven Roads copy', copy, "episodesChoices: '6 qism · 4 tanlov'")
requireText('Seven Roads copy', copy, "progressAndChoices: 'O‘qish jarayoni va tanlovlar'")
requireText('Seven Roads copy', copy, "readingHint: 'Bu sozlamalar shu qurilmadagi “Yetti yo‘l qirolligi”ning barcha qismlariga qo‘llanadi.'")
forbidText('Seven Roads copy', copy, 'Faqat o‘qish jarayonini saqlaymiz')
forbidText('Seven Roads copy', copy, '6 qism · 4 qaror')
forbidText('Seven Roads copy', copy, 'Mavsum jarayonini tozalash')
forbidText('Seven Roads copy', copy, 'barcha Seven Roads qismlariga')

requireText('language preference', languagePreference, "qissa:v1:sevenRoadsLanguage")
requireText('language preference', languagePreference, "value === 'uz' || value === 'ru'")
requireText('language preference', languagePreference, 'window.localStorage.setItem')

requireText('public shell', shell, 'getSevenRoadsSeason1(language)')
requireText('public shell', shell, 'getSevenRoadsSeasons(language)')
requireText('public shell', shell, 'getSevenRoadsCopy(language)')
requireText('public shell', shell, 'sevenRoadsUiAssets.home')
requireText('public shell', shell, 'sevenRoadsUiAssets.library')
requireText('public shell', shell, 'sevenRoadsUiAssets.futureSeasonPlaceholder')
requireText('public shell', shell, 'onOpenSettings')
requireText('public shell', shell, 'aria-label={copy.settings}')
requireText('public shell', shell, "type LibraryView = 'seasons' | 'gallery'")
requireText('public shell', shell, 'authoredIllustrationDiscovery.buildGalleryEpisodes')
requireText('public shell', shell, "language === 'uz'")
requireText('public shell', shell, '{copy.seasons}')
requireText('public shell', shell, '{copy.library}')
requireText('public shell', shell, 'homeAction')
requireText('public shell', shell, 'h-[100dvh]')
requireText('public shell', shell, 'overflow-y-auto overscroll-contain')
requireText('public shell', shell, 'expandedGallerySeason')
requireText('public shell', shell, 'setExpandedGallerySeason(expanded ? null : season.number)')
requireText('public shell', shell, 'aria-expanded={expanded}')
requireText('public shell', shell, 'aria-controls={panelId}')
requireText('public shell', shell, 'buildSeasonGallery')
forbidText('public shell gallery old selector', shell, 'selectedGallerySeason')
requireText('public shell', shell, "type LibraryNotice =")
requireText('public shell', shell, "kind: 'coming-season'")
requireText('public shell', shell, "kind: 'locked-art'")
requireText('public shell', shell, "Сезон ${notice.seasonNumber} готовится")
requireText('public shell', shell, 'Сцена ещё скрыта')
requireText('public shell', shell, 'Lavha hali ochilmagan')
forbidText('public shell', shell, 'Lavha hali yashirin')
requireText('public shell', shell, 'Сцены сказки')
requireText('public shell', shell, 'Hikoya lavhalari')
requireText('public shell', shell, "season.status === 'published' && Boolean(season.story)")
requireText('public shell', shell, "expanded ? 'rotate-180' : ''")
forbidText('public shell gallery old selector', shell, 'seasonRomanNumeral')
forbidText('public shell gallery old selector', shell, 'min-w-[160px]')
forbidText('public shell gallery legacy copy', shell, 'Открытые иллюстрации')
forbidText('public shell gallery legacy copy', shell, 'Ochilgan illyustratsiyalar')
requireText('public shell', shell, 'sevenRoadsUiAssets.futureSeasonPlaceholder')
forbidText('public shell fixed world background', shell, 'fixed inset-y-0 left-1/2')

requireText('season overview', overview, 'getSevenRoadsCopy(language)')
requireText('season overview', overview, '{copy.openSeasonPath}')
requireText('season overview', overview, '{copy.sixEpisodes}')
requireText('season overview', overview, 'resolveAuthoredStoryAssetUrl')
requireText('season overview', overview, 'sticky top-0 z-30')
requireText('season overview', overview, 'onRead(episode.number)')
forbidText('season overview hero', overview, 'season.worldTitle')
forbidText('season overview hero', overview, 'для 8–9 лет')
forbidText('season overview hero', overview, '6 серий · 4 решения')

requireText('family consent', consent, 'progressStorageAccepted')
forbidText('family consent', consent, 'aiProcessingAccepted')
requireText('first-run flow', welcome, 'LanguageSwitcher')
requireText('first-run flow', welcome, 'sevenRoadsLanguages.map')
requireText('first-run flow', welcome, 'onLanguageChange(option)')
requireText('first-run flow', welcome, 'copy.consentAccountNote')
requireText('first-run flow', welcome, 'copy.consentCheckbox')
requireText('first-run flow', welcome, 'sevenRoadsUiAssets.welcome')

for (const text of [
  'storyStateService',
  'localPersistence',
  'closedBetaMigration',
  'migratePersistedStoryIntoClosedBetaScope',
]) forbidText('Seven Roads bootstrap', main, text)

requireText('reader', player, "story.language === 'uz' ? 'uz' : 'ru'")
requireText('reader', player, 'getSevenRoadsCopy(language)')
requireText('reader', player, 'language={language}')
requireText('reader', player, '{copy.episode} {readerProgress.current} / {readerProgress.total}')
requireText('reader', player, '{copy.season} {seasonNumber} {copy.seasonCompleted}')
requireText('reader', player, '{copy.nextSeasonSoon}')
requireText('reader', player, '{copy.tapToReturn}')
requireText('reader', player, '{copy.finishToday}')
requireText('reader', player, '{copy.nextEpisode}')
requireText('reader', player, 'part.is_final ? copy.finishSeason : copy.continue')
requireText('reader', player, '{copy.close}')
requireText('reader', player, 'authoredReadingPosition.save')
requireText('reader', player, 'authoredReadingPosition.clear')
requireText('reader', player, 'aria-label={copy.readerSettings}')
requireText('reader', player, 'getReaderTextStyle')
requireText('reader', player, 'historicalReplay')
requireText('reader', player, '{copy.returnToSeason}')
requireText('reader', player, 'sticky top-0 z-40')
requireText('reader', player, 'authoredIllustrationDiscovery.markSeen')
requireText('reader', player, 'IntersectionObserver')
requireText('reader', player, 'discoverable={false}')
requireText('reader', player, 'episodeNumber={readerProgress.current}')
requireText('reader', player, '-qism lavhasi')
forbidText('reader scene alt', player, 'alt={block.slot.scene_key}')

requireText('Seven Roads settings', settings, 'getSevenRoadsCopy(language)')
requireText('Seven Roads settings', settings, 'sevenRoadsLanguages.map')
requireText('Seven Roads settings', settings, 'onLanguageChange(option)')
requireText('Seven Roads settings', settings, 'language={language}')
requireText('Seven Roads settings', settings, '{copy.resetSeason}')
requireText('Seven Roads settings', settings, 'ReaderSettingsPanel')
requireText('Seven Roads reader preferences', readerPreferences, 'sevenRoadsReaderPreferences')

requireText('authored progress persistence', authoredPersistence, 'story.story_id')
requireText('authored progress persistence', authoredPersistence, 'story.story_version')
forbidText('authored progress persistence key', authoredPersistence, 'story.language')
requireText('reading position persistence', readingPosition, 'scroll_y')
requireText('reading position persistence', readingPosition, 'part_index')
requireText('reading position persistence', readingPosition, 'story.story_id')
requireText('reading position persistence', readingPosition, 'story.story_version')
forbidText('reading position persistence key', readingPosition, 'story.language')

requireText('illustration discovery', illustrationDiscovery, 'authoredIllustrationDiscovery')
requireText('illustration discovery', illustrationDiscovery, 'seedFromProgress')
requireText('illustration discovery', illustrationDiscovery, 'buildGalleryEpisodes')
requireText('illustration discovery', illustrationDiscovery, 'selected_choices')
requireText('illustration discovery', illustrationDiscovery, 'episodeNumberForPart')
requireText('illustration discovery', illustrationDiscovery, '(partIndex) => partIndex + 1')
requireText('illustration discovery', illustrationDiscovery, "story.language === 'uz'")
requireText('illustration discovery', illustrationDiscovery, '-qism lavhasi')
requireText('reader settings copy', dictionaries, "'reader.theme':'Fon'")
requireText('reader settings copy', dictionaries, "'reader.line_spacing.relaxed':'Kengroq'")
forbidText('reader settings copy', dictionaries, "'reader.theme':'Mavzu'")

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
console.log('Seven Roads Russian/Uzbek language switch contract passed.')
