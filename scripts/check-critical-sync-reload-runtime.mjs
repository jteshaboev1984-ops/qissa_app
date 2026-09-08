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
const STORY_PROVIDER_KEY = 'qissa:v1:storyProvider'
const INSTALLATION_ID_KEY = 'qissa:v1:installationId'
const PENDING_CHOICE_KEY = 'qissa:v1:pendingChoiceSync'
const RESET_REQUIRED_KEY = 'qissa:v1:remoteResetRequired'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const waitUntil = async (predicate, message) => {
  const deadline = Date.now() + 2_000
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error(message)
    await delay(5)
  }
}

const seedBrowserStorage = () => {
  const data = new Map()
  data.set(STORY_PROVIDER_KEY, JSON.stringify('remote'))
  data.set(INSTALLATION_ID_KEY, INSTALLATION_ID)
  return data
}

const installBrowserGlobals = (storage, requestLog, isOnline) => {
  globalThis.window = {
    localStorage: new MemoryStorage(storage),
    setTimeout,
    clearTimeout,
  }

  globalThis.fetch = async (_url, init = {}) => {
    const payload = JSON.parse(String(init.body ?? '{}'))
    requestLog.push(payload.action ?? 'unknown')

    if (!isOnline()) throw new Error('simulated offline network')

    const body = payload.action === 'load_current'
      ? { snapshot: null }
      : { ok: true }

    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  }
}

const makeSeriesState = (choiceHistory = []) => ({
  id: 'series-runtime-reload-proof',
  childProfileId: 'profile-runtime-reload-proof',
  stylePackId: 'cozy_forest',
  mainCharacter: 'Лея',
  recurringCharacters: [],
  lastEpisodeSummary: '',
  activeArc: 'quiet-light',
  relationshipState: {},
  choiceHistory,
  canonState: {},
  episodeCount: 1,
})

const buildRuntimeBundle = async (tempDir) => {
  const entryPath = path.join(tempDir, 'critical-sync-entry.ts')
  const repoRoot = process.cwd().replaceAll('\\', '/')

  await writeFile(
    entryPath,
    `export { localPersistence } from '${repoRoot}/src/lib/localPersistence.ts'\n` +
      `export { storyStateService } from '${repoRoot}/src/lib/storyStateService.ts'\n`,
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
          entryFileNames: 'critical-sync-runtime.mjs',
          chunkFileNames: 'critical-sync-[name]-[hash].mjs',
        },
      },
    },
  })

  return path.join(tempDir, 'dist', 'critical-sync-runtime.mjs')
}

const importFresh = (bundlePath, tag) => import(`${pathToFileURL(bundlePath).href}?reload=${tag}`)

const runChoiceReloadScenario = async (bundlePath) => {
  const storage = seedBrowserStorage()
  const firstPassRequests = []
  let online = false
  installBrowserGlobals(storage, firstPassRequests, () => online)

  const firstPage = await importFresh(bundlePath, 'choice-offline')
  const previous = makeSeriesState([])
  const next = makeSeriesState([
    {
      episode_id: 'ep-1-runtime',
      choice_id: 'choice-a',
      effect_summary: 'Лея сохранила тёплый фонарь.',
      state_patch: { keptLantern: true },
    },
  ])

  firstPage.localPersistence.saveSeriesState(previous)
  firstPage.localPersistence.saveSeriesState(next)

  await waitUntil(
    () => firstPassRequests.includes('confirm_choice'),
    'Offline choice sync was never attempted.',
  )
  await delay(10)

  assert.notEqual(
    storage.get(PENDING_CHOICE_KEY),
    undefined,
    'Failed choice sync must remain in the durable local outbox.',
  )
  assert.equal(firstPassRequests.includes('load_current'), false)

  const reloadRequests = []
  online = true
  installBrowserGlobals(storage, reloadRequests, () => online)

  const reloadedPage = await importFresh(bundlePath, 'choice-online')
  await reloadedPage.localPersistence.waitForPendingRemoteReset()
  await reloadedPage.localPersistence.waitForPendingChoiceSync()
  await reloadedPage.storyStateService.loadCurrent()

  assert.deepEqual(
    reloadRequests.slice(0, 2),
    ['confirm_choice', 'load_current'],
    'Reload must persist the queued choice before restoring server state.',
  )
  assert.equal(
    storage.has(PENDING_CHOICE_KEY),
    false,
    'Successful replay must clear the pending choice outbox entry.',
  )
}

const runResetReloadScenario = async (bundlePath) => {
  const storage = seedBrowserStorage()
  storage.set('qissa:v1:currentEpisode', JSON.stringify({ episode_id: 'ep-old' }))
  storage.set('qissa:v1:screen', JSON.stringify('story'))

  const firstPassRequests = []
  let online = false
  installBrowserGlobals(storage, firstPassRequests, () => online)

  const firstPage = await importFresh(bundlePath, 'reset-offline')
  firstPage.localPersistence.clearEpisodeAndScreen()

  await waitUntil(
    () => firstPassRequests.includes('reset_current'),
    'Offline remote reset was never attempted.',
  )
  await delay(10)

  assert.equal(
    JSON.parse(storage.get(RESET_REQUIRED_KEY)),
    true,
    'Failed remote reset must remain in the durable local outbox.',
  )
  assert.equal(storage.has('qissa:v1:currentEpisode'), false)
  assert.equal(storage.has('qissa:v1:screen'), false)

  const reloadRequests = []
  online = true
  installBrowserGlobals(storage, reloadRequests, () => online)

  const reloadedPage = await importFresh(bundlePath, 'reset-online')
  await reloadedPage.localPersistence.waitForPendingRemoteReset()
  await reloadedPage.localPersistence.waitForPendingChoiceSync()
  await reloadedPage.storyStateService.loadCurrent()

  assert.deepEqual(
    reloadRequests.slice(0, 2),
    ['reset_current', 'load_current'],
    'Reload must complete the queued reset before restoring server state.',
  )
  assert.equal(
    storage.has(RESET_REQUIRED_KEY),
    false,
    'Successful reset replay must clear the durable reset marker.',
  )
}

const main = async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'qissa-critical-sync-'))
  const originalConsoleError = console.error

  try {
    // Offline failures are intentional in this regression; keep CI output focused.
    console.error = (...args) => {
      if (String(args[0] ?? '').startsWith('Failed to sync story choice')) return
      if (String(args[0] ?? '').startsWith('Failed to reset remote story state')) return
      originalConsoleError(...args)
    }

    const bundlePath = await buildRuntimeBundle(tempDir)
    await runChoiceReloadScenario(bundlePath)
    await runResetReloadScenario(bundlePath)
  } finally {
    console.error = originalConsoleError
    await rm(tempDir, { recursive: true, force: true })
  }

  console.log('critical story sync reload runtime regression passed: offline choice/reset survive reload and replay before server restore.')
}

await main()
