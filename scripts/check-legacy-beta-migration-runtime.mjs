import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'vite'

class MemoryStorage {
  constructor(seed = new Map()) {
    this.data = seed
  }

  getItem(key) {
    return this.data.has(key) ? this.data.get(key) : null
  }

  setItem(key, value) {
    this.data.set(key, String(value))
  }

  removeItem(key) {
    this.data.delete(key)
  }

  clear() {
    this.data.clear()
  }
}

const INSTALLATION_ID = '123e4567-e89b-42d3-a456-426614174000'
const INSTALLATION_AUTH = 'a'.repeat(64)
const STORY_PROVIDER_KEY = 'qissa:v1:storyProvider'
const INSTALLATION_ID_KEY = 'qissa:v1:installationId'
const INSTALLATION_AUTH_KEY = 'qissa:v1:installationAuth'
const SELECTIONS_KEY = 'qissa:v1:onboardingSelections'
const SERIES_KEY = 'qissa:v1:seriesState'
const EPISODE_KEY = 'qissa:v1:currentEpisode'
const SCREEN_KEY = 'qissa:v1:screen'
const ARCHIVE_KEY = 'qissa:v1:storyArchive'

const betaSelections = {
  ageGroup: '5-7',
  language: 'ru',
  heroType: 'boy_hero',
  stylePackId: 'cozy_forest',
  storyMode: 'series',
  storyMood: 'bedtime',
}

const legacySelections = {
  ageGroup: '3-4',
  language: 'kz',
  heroType: 'animal',
  stylePackId: 'animal_world',
  storyMode: 'series',
  storyMood: 'kind_adventure',
}

const makeSeriesState = (selections, id = 'legacy-series') => ({
  id,
  childProfileId: 'legacy-profile',
  stylePackId: selections.stylePackId,
  mainCharacter: 'Legacy Hero',
  recurringCharacters: [],
  lastEpisodeSummary: '',
  activeArc: 'legacy-arc',
  relationshipState: {},
  choiceHistory: [],
  canonState: {},
  episodeCount: 1,
})

const makeEpisode = (selections, id = 'ep-1-legacy') => ({
  episode_id: id,
  series_id: 'legacy-series',
  title: 'Legacy story',
  story_text: 'A preserved story from an earlier QISSA setup.',
  mode: selections.storyMode,
  mood: selections.storyMood,
  stylePackId: selections.stylePackId,
  choices: [],
  state_patch: {},
  vocabulary: [],
  nextEpisodePreview: '',
  safety_self_check: {
    approved: true,
    risk_level: 'low',
    flags: {},
    required_action: 'fallback',
  },
})

const seedRemoteBrowserStorage = () => {
  const data = new Map()
  data.set(STORY_PROVIDER_KEY, JSON.stringify('remote'))
  data.set(INSTALLATION_ID_KEY, INSTALLATION_ID)
  data.set(INSTALLATION_AUTH_KEY, INSTALLATION_AUTH)
  return data
}

const seedStory = (storage, selections) => {
  storage.set(SELECTIONS_KEY, JSON.stringify(selections))
  storage.set(SERIES_KEY, JSON.stringify(makeSeriesState(selections)))
  storage.set(EPISODE_KEY, JSON.stringify(makeEpisode(selections)))
  storage.set(SCREEN_KEY, JSON.stringify('story'))
}

const installBrowserGlobals = (storage, requests) => {
  globalThis.window = {
    localStorage: new MemoryStorage(storage),
    setTimeout,
    clearTimeout,
  }

  globalThis.fetch = async (_url, init = {}) => {
    const payload = JSON.parse(String(init.body ?? '{}'))
    requests.push(payload.action ?? 'unknown')

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }
}

const buildRuntimeBundle = async (tempDir) => {
  const entryPath = path.join(tempDir, 'legacy-beta-migration-entry.ts')
  const repoRoot = process.cwd().replaceAll('\\', '/')

  await writeFile(
    entryPath,
    `export { migratePersistedStoryIntoClosedBetaScope } from '${repoRoot}/src/lib/closedBetaMigration.ts'\n` +
      `export { isClosedBetaSelections, normalizeSelectionsForClosedBeta } from '${repoRoot}/src/lib/closedBetaScope.ts'\n` +
      `export { localPersistence } from '${repoRoot}/src/lib/localPersistence.ts'\n` +
      `export { storyArchive } from '${repoRoot}/src/lib/storyArchive.ts'\n` +
      `export { storyService } from '${repoRoot}/src/lib/storyService.ts'\n`,
    'utf8',
  )

  await build({
    configFile: false,
    logLevel: 'silent',
    root: process.cwd(),
    define: {
      'import.meta.env.VITE_QISSA_STORY_PROVIDER': JSON.stringify('remote'),
      'import.meta.env.VITE_QISSA_STORY_ENDPOINT': JSON.stringify('https://qissa.invalid/functions/v1/story-generate'),
      'import.meta.env.VITE_QISSA_STATE_ENDPOINT': JSON.stringify('https://qissa.invalid/functions/v1/story-state'),
      'import.meta.env.VITE_QISSA_SUPABASE_PUBLISHABLE_KEY': JSON.stringify('runtime-test-key'),
      'import.meta.env.VITE_QISSA_STORY_TIMEOUT_MS': JSON.stringify('1000'),
      'import.meta.env.VITE_QISSA_STORY_FALLBACK_TO_LOCAL': JSON.stringify('false'),
    },
    build: {
      ssr: entryPath,
      outDir: path.join(tempDir, 'dist'),
      emptyOutDir: true,
      minify: false,
      rollupOptions: {
        output: {
          format: 'es',
          entryFileNames: 'legacy-beta-migration-runtime.mjs',
          chunkFileNames: 'legacy-beta-migration-[name]-[hash].mjs',
        },
      },
    },
  })

  return path.join(tempDir, 'dist', 'legacy-beta-migration-runtime.mjs')
}

const importFresh = (bundlePath, tag) => import(`${pathToFileURL(bundlePath).href}?scenario=${tag}`)

const assertNormalizedClosedBetaState = (runtime, storage) => {
  const selections = runtime.localPersistence.loadOnboardingSelections()
  assert.ok(selections, 'Migrated selections must remain available.')
  assert.equal(runtime.isClosedBetaSelections(selections), true)
  assert.equal(selections.ageGroup, '5-7')
  assert.equal(selections.language, 'ru')
  assert.equal(selections.stylePackId, 'cozy_forest')
  assert.equal(selections.storyMode, 'series')
  assert.equal(selections.storyMood, 'bedtime')
  assert.equal(storage.has(EPISODE_KEY), false, 'Legacy episode must stop being the active episode.')
  assert.equal(storage.has(SCREEN_KEY), false, 'Legacy story screen must stop being the active screen.')

  const seriesState = runtime.localPersistence.loadSeriesState()
  assert.ok(seriesState, 'A fresh closed-beta series state must be prepared.')
  assert.equal(seriesState.stylePackId, 'cozy_forest')
  assert.equal(seriesState.episodeCount, 0)
}

const runCurrentBetaNoopScenario = async (bundlePath) => {
  const storage = seedRemoteBrowserStorage()
  seedStory(storage, betaSelections)
  const requests = []
  installBrowserGlobals(storage, requests)

  const runtime = await importFresh(bundlePath, 'current-beta')
  const result = runtime.migratePersistedStoryIntoClosedBetaScope()

  assert.deepEqual(result, { migrated: false, archivedLegacyStory: false })
  assert.deepEqual(requests, [])
  assert.equal(storage.has(ARCHIVE_KEY), false)
  assert.equal(storage.has(EPISODE_KEY), true)
  assert.equal(runtime.isClosedBetaSelections(runtime.localPersistence.loadOnboardingSelections()), true)
}

const runLocalHydrationMigrationScenario = async (bundlePath) => {
  const storage = seedRemoteBrowserStorage()
  seedStory(storage, legacySelections)
  const requests = []
  installBrowserGlobals(storage, requests)

  const runtime = await importFresh(bundlePath, 'local-hydration')
  const hydratedLegacySelections = runtime.localPersistence.loadOnboardingSelections()

  assert.deepEqual(
    hydratedLegacySelections,
    legacySelections,
    'Local hydration must preserve the legacy story setup until the explicit migration step archives it.',
  )
  assert.equal(runtime.isClosedBetaSelections(hydratedLegacySelections), false)

  const result = runtime.migratePersistedStoryIntoClosedBetaScope()
  assert.deepEqual(result, { migrated: true, archivedLegacyStory: true })
  await runtime.localPersistence.waitForPendingRemoteReset()

  assert.deepEqual(requests, ['reset_current'])
  assertNormalizedClosedBetaState(runtime, storage)

  const archive = runtime.storyArchive.load()
  assert.equal(archive.length, 1)
  assert.deepEqual(archive[0].selections, legacySelections)
  assert.equal(archive[0].episode?.title, 'Legacy story')
}

const runRemoteRestoreMigrationScenario = async (bundlePath) => {
  const storage = seedRemoteBrowserStorage()
  const requests = []
  installBrowserGlobals(storage, requests)

  const runtime = await importFresh(bundlePath, 'remote-restore')
  runtime.localPersistence.restoreRemoteSnapshot({
    selections: legacySelections,
    seriesState: makeSeriesState(legacySelections, 'remote-legacy-series'),
    episode: {
      ...makeEpisode(legacySelections, 'ep-1-remote-legacy'),
      series_id: 'remote-legacy-series',
    },
    readerPreferences: {
      textSize: 'medium',
      fontMode: 'standard',
      lineSpacing: 'relaxed',
      theme: 'warm',
      showTextWithAudio: true,
      audioOnlyNightMode: true,
      voicePresetId: 'neutral_storyteller',
      defaultPlaybackMode: 'read',
    },
  })

  const restoredLegacySelections = runtime.localPersistence.loadOnboardingSelections()
  assert.deepEqual(
    restoredLegacySelections,
    legacySelections,
    'Remote restore must preserve the legacy snapshot before migration archives it.',
  )
  assert.equal(runtime.isClosedBetaSelections(restoredLegacySelections), false)

  const result = runtime.migratePersistedStoryIntoClosedBetaScope()
  assert.deepEqual(result, { migrated: true, archivedLegacyStory: true })
  await runtime.localPersistence.waitForPendingRemoteReset()

  assert.deepEqual(requests, ['reset_current'])
  assertNormalizedClosedBetaState(runtime, storage)

  const archive = runtime.storyArchive.load()
  assert.equal(archive.length, 1)
  assert.equal(archive[0].episode?.series_id, 'remote-legacy-series')
}

const runGenerationGuardScenario = async (bundlePath) => {
  const storage = seedRemoteBrowserStorage()
  const requests = []
  installBrowserGlobals(storage, requests)

  const runtime = await importFresh(bundlePath, 'generation-guard')
  await assert.rejects(
    runtime.storyService.generateEpisode({
      selections: legacySelections,
      seriesState: makeSeriesState(legacySelections),
    }),
    /restricted to the current closed-beta scope/,
  )
  assert.deepEqual(requests, [], 'Out-of-scope generation must fail before any provider or persistence request.')

  assert.deepEqual(
    runtime.normalizeSelectionsForClosedBeta(betaSelections, betaSelections.language),
    betaSelections,
    'Normal current-beta selections must remain unchanged by normalization.',
  )
}

const main = async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'qissa-legacy-beta-migration-'))

  try {
    const bundlePath = await buildRuntimeBundle(tempDir)
    await runCurrentBetaNoopScenario(bundlePath)
    await runLocalHydrationMigrationScenario(bundlePath)
    await runRemoteRestoreMigrationScenario(bundlePath)
    await runGenerationGuardScenario(bundlePath)
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }

  console.log('legacy closed-beta migration runtime regression passed: local hydration and remote restore preserve legacy history, archive it before reset, normalize future setup, and block out-of-scope generation.')
}

await main()
