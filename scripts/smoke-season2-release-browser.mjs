import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'

const root = process.cwd()
const dist = path.join(root, 'dist')
if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('[season2-release-browser] dist/index.html is missing; build first')
  process.exit(2)
}

const readJson = (relative) =>
  JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'))

const season1 = readJson('src/data/authored/prazdnikMuzhestvaV3.ru.json')
const episode1 = readJson('src/data/authored/staging/season2Story1RoyalSilver.ru.json')
const episode2 = readJson('src/data/authored/taynaVostochnogoKaravanaV4.ru.json')
const episode3 = readJson('src/data/authored/staging/season2Story3TwoTowers.ru.json')
const episode4 = readJson('src/data/authored/staging/season2Story4WaitedMan.ru.json')
const episode5 = readJson('src/data/authored/staging/season2Story5FalseRoad.ru.json')
const episode6 = readJson('src/data/authored/staging/season2Story6TwoReinforcements.ru.json')
const episode7 = readJson('src/data/authored/staging/season2Story7BackToOrdan.ru.json')
const season2Episodes = [episode1, episode2, episode3, episode4, episode5, episode6, episode7]

const consentKey = 'qissa:v1:publishedStoriesConsent'
const languageKey = 'qissa:v1:sevenRoadsLanguage'
const progressKey = (story) =>
  `qissa:v1:authoredStoryProgress:${story.story_id}:${story.story_version}`
const readingKey = (story) =>
  `qissa:v1:authoredReadingPosition:${story.story_id}:${story.story_version}`
const discoveryKey = (story) =>
  `qissa:v1:authoredIllustrationDiscovery:${story.story_id}:${story.story_version}`

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const makeProgress = (
  story,
  {
    completed = false,
    currentPartIndex = 0,
    selectedChoices = {},
  } = {},
) => ({
  story_id: story.story_id,
  story_version: story.story_version,
  current_part_index: currentPartIndex,
  selected_choices: selectedChoices,
  shown_resolution_decisions: Object.keys(selectedChoices),
  choice_history: [],
  memory: {
    lastEvent: '',
    canonState: {},
    relationshipState: {},
  },
  completed,
  updated_at: '2026-10-05T00:00:00.000Z',
})

const contentTypeFor = (file) => {
  if (file.endsWith('.html')) return 'text/html; charset=utf-8'
  if (file.endsWith('.js')) return 'text/javascript; charset=utf-8'
  if (file.endsWith('.css')) return 'text/css; charset=utf-8'
  if (file.endsWith('.json')) return 'application/json; charset=utf-8'
  if (file.endsWith('.svg')) return 'image/svg+xml'
  if (file.endsWith('.webp')) return 'image/webp'
  if (file.endsWith('.png')) return 'image/png'
  return 'application/octet-stream'
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url ?? '/', 'http://127.0.0.1')
  let relative = decodeURIComponent(requestUrl.pathname)

  if (relative === '/qissa_app' || relative === '/qissa_app/') {
    relative = '/index.html'
  } else if (relative.startsWith('/qissa_app/')) {
    relative = relative.slice('/qissa_app'.length)
  }

  const candidate = path.normalize(path.join(dist, relative.replace(/^\/+/, '')))
  if (!candidate.startsWith(dist)) {
    res.writeHead(403).end('forbidden')
    return
  }

  const file = fs.existsSync(candidate) && fs.statSync(candidate).isFile()
    ? candidate
    : path.join(dist, 'index.html')

  res.writeHead(200, {
    'Content-Type': contentTypeFor(file),
    'Cache-Control': 'no-store',
  })
  fs.createReadStream(file).pipe(res)
})

await new Promise((resolve, reject) => {
  server.once('error', reject)
  server.listen(4173, '127.0.0.1', resolve)
})

const chromeCandidates = [
  process.env.CHROME_BIN,
  'google-chrome',
  'google-chrome-stable',
  'chromium',
  'chromium-browser',
].filter(Boolean)

let chromeBin = null
for (const candidate of chromeCandidates) {
  const probe = spawnSync('sh', ['-lc', `command -v "${candidate}"`], {
    encoding: 'utf8',
  })
  if (probe.status === 0 && probe.stdout.trim()) {
    chromeBin = probe.stdout.trim()
    break
  }
}

if (!chromeBin) {
  server.close()
  console.error('[season2-release-browser] Chrome/Chromium executable not found')
  process.exit(2)
}

const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qissa-season2-release-'))
const chrome = spawn(
  chromeBin,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--remote-debugging-address=127.0.0.1',
    '--remote-debugging-port=0',
    `--user-data-dir=${profileDir}`,
    '--window-size=430,932',
    'about:blank',
  ],
  { stdio: ['ignore', 'ignore', 'pipe'] },
)

let chromeStderr = ''
chrome.stderr?.on('data', (chunk) => {
  chromeStderr += chunk.toString()
  if (chromeStderr.length > 8000) chromeStderr = chromeStderr.slice(-8000)
})

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const devToolsActivePort = path.join(profileDir, 'DevToolsActivePort')
const deadline = Date.now() + 15000
while (!fs.existsSync(devToolsActivePort) && Date.now() < deadline) {
  if (chrome.exitCode != null) break
  await sleep(100)
}

if (!fs.existsSync(devToolsActivePort)) {
  try { chrome.kill('SIGTERM') } catch {}
  try { server.close() } catch {}
  try { fs.rmSync(profileDir, { recursive: true, force: true }) } catch {}
  console.error(
    '[season2-release-browser] Chrome DevTools endpoint did not start; stderr=' +
      chromeStderr.slice(-4000),
  )
  process.exit(2)
}

const [debugPortLine] = fs.readFileSync(devToolsActivePort, 'utf8').trim().split(/\r?\n/)
const debugPort = Number(debugPortLine)
assert(Number.isInteger(debugPort) && debugPort > 0, 'invalid Chrome DevTools port')

let ws
let serverClosed = false
const cleanup = () => {
  try { ws?.close() } catch {}
  try { chrome.kill('SIGTERM') } catch {}
  if (!serverClosed) {
    serverClosed = true
    try { server.close() } catch {}
  }
  try { fs.rmSync(profileDir, { recursive: true, force: true }) } catch {}
}

try {
  const targetsResponse = await fetch(`http://127.0.0.1:${debugPort}/json/list`)
  assert(targetsResponse.ok, `DevTools target list returned HTTP ${targetsResponse.status}`)
  const targets = await targetsResponse.json()
  const target = targets.find((item) => item.type === 'page')
  assert(target?.webSocketDebuggerUrl, 'No debuggable page target was found')

  ws = new WebSocket(target.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true })
    ws.addEventListener('error', reject, { once: true })
  })

  let nextId = 1
  const pending = new Map()
  const browserErrors = []
  let pageLoadEvents = 0

  ws.addEventListener('message', (event) => {
    const raw =
      typeof event.data === 'string'
        ? event.data
        : event.data instanceof ArrayBuffer
          ? Buffer.from(event.data).toString('utf8')
          : String(event.data)
    const message = JSON.parse(raw)

    if (message.id) {
      const waiter = pending.get(message.id)
      if (!waiter) return
      pending.delete(message.id)
      if (message.error) waiter.reject(new Error(JSON.stringify(message.error)))
      else waiter.resolve(message.result)
      return
    }

    if (message.method === 'Page.loadEventFired') pageLoadEvents += 1
    if (message.method === 'Runtime.exceptionThrown') {
      browserErrors.push(
        message.params?.exceptionDetails?.exception?.description ??
          message.params?.exceptionDetails?.text ??
          'runtime exception',
      )
    }
  })

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = nextId++
      pending.set(id, { resolve, reject })
      ws.send(JSON.stringify({ id, method, params }))
    })

  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    })
    if (result.exceptionDetails) {
      throw new Error(
        result.exceptionDetails.exception?.description ??
          result.exceptionDetails.text ??
          'Runtime.evaluate failed',
      )
    }
    return result.result?.value
  }

  const waitFor = async (expression, label, timeoutMs = 20000) => {
    const end = Date.now() + timeoutMs
    while (Date.now() < end) {
      if (await evaluate(expression)) return
      await sleep(100)
    }
    throw new Error(`Timed out waiting for ${label}`)
  }

  const bodyHas = (text) =>
    `document.body?.innerText.includes(${JSON.stringify(text)}) === true`

  const clickButtonContaining = async (text) => {
    const clicked = await evaluate(`(() => {
      const wanted = ${JSON.stringify(text)}
      const button = [...document.querySelectorAll('button')].find(
        (candidate) => candidate.textContent?.includes(wanted)
      )
      if (!button) return false
      button.click()
      return true
    })()`)
    assert(clicked, `Button containing text not found: ${text}`)
  }

  const clickExactButton = async (text) => {
    const clicked = await evaluate(`(() => {
      const wanted = ${JSON.stringify(text)}
      const button = [...document.querySelectorAll('button')].find(
        (candidate) => candidate.textContent?.trim() === wanted
      )
      if (!button) return false
      button.click()
      return true
    })()`)
    assert(clicked, `Button not found: ${text}`)
  }

  const clickAriaButton = async (label) => {
    const clicked = await evaluate(`(() => {
      const wanted = ${JSON.stringify(label)}
      const button = [...document.querySelectorAll('button')].find(
        (candidate) => candidate.getAttribute('aria-label') === wanted
      )
      if (!button) return false
      button.click()
      return true
    })()`)
    assert(clicked, `Button with aria-label not found: ${label}`)
  }

  const season2CoverPresentExpression = `(() => {
    const token = 'seven_roads_season2_cover_v1'
    const imageMatch = [...document.images].some((img) => img.src.includes(token))
    const backgroundMatch = [...document.querySelectorAll('*')].some((node) => {
      const inline = node.getAttribute?.('style') ?? ''
      const computed = getComputedStyle(node).backgroundImage ?? ''
      return inline.includes(token) || computed.includes(token)
    })
    return imageMatch || backgroundMatch
  })()`

  const reloadAndWait = async () => {
    const before = pageLoadEvents
    await send('Page.reload', { ignoreCache: true })
    const end = Date.now() + 15000
    while (pageLoadEvents <= before && Date.now() < end) await sleep(100)
    assert(pageLoadEvents > before, 'reload did not produce a page load event')
    await waitFor("document.readyState === 'complete'", 'document ready')
  }

  const setJson = async (key, value) =>
    evaluate(`localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(JSON.stringify(value))})`)

  const clearSeason2State = async () => {
    for (const story of season2Episodes) {
      await evaluate(`localStorage.removeItem(${JSON.stringify(progressKey(story))})`)
      await evaluate(`localStorage.removeItem(${JSON.stringify(readingKey(story))})`)
      await evaluate(`localStorage.removeItem(${JSON.stringify(discoveryKey(story))})`)
    }
  }

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', {
    width: 430,
    height: 932,
    deviceScaleFactor: 1,
    mobile: true,
  })

  await send('Page.navigate', {
    url: 'http://127.0.0.1:4173/qissa_app/',
  })
  await waitFor("document.readyState === 'complete'", 'initial page load')

  await setJson(consentKey, {
    version: '2026-09-25-v1',
    acceptedAt: '2026-10-05T00:00:00.000Z',
    parentOrGuardianConfirmed: true,
    progressStorageAccepted: true,
  })
  await evaluate(`localStorage.setItem(${JSON.stringify(languageKey)}, 'ru')`)
  await clearSeason2State()
  await setJson(
    progressKey(season1),
    makeProgress(season1, {
      completed: true,
      currentPartIndex: season1.parts.length - 1,
    }),
  )
  await setJson(
    progressKey(episode2),
    makeProgress(episode2, {
      completed: false,
      currentPartIndex: 7,
      selectedChoices: {
        story2_choice_3_sarvan_check: 'story2_choice_3a_old_sarvan_yard',
      },
    }),
  )

  await reloadAndWait()
  await waitFor(bodyHas('Тайна восточного каравана'), 'Russian Home legacy Episode 2 resume')
  await waitFor(bodyHas('Сезон 2 · серия 2 / 7'), 'Russian Home Season 2 episode context')

  await clickButtonContaining('Тайна восточного каравана')
  await waitFor(bodyHas('7 серий'), 'Season 2 Russian overview')

  for (const title of [
    'Королевское серебро',
    'Тайна восточного каравана',
    'Две башни',
    'Человек, которого ждут',
    'Ложная дорога',
    'Две подмоги',
    'Обратно в Ордан',
  ]) {
    await waitFor(bodyHas(title), `Russian Season 2 row: ${title}`)
  }

  await waitFor(
    `[...document.querySelectorAll('section')].some((node) =>
      node.getAttribute('style')?.includes('seven_roads_season2_cover_v1')
    )`,
    'shared Season 2 cover on overview',
  )

  await clickButtonContaining('Тайна восточного каравана')
  await waitFor(bodyHas('Часть 8 / 10'), 'legacy Episode 2 resume at part 8')
  const coverLeakedIntoEpisodeReader = await evaluate(
    season2CoverPresentExpression,
  )
  assert(
    !coverLeakedIntoEpisodeReader,
    'shared Season 2 cover leaked into resumed Episode 2 reader',
  )

  await clickExactButton('Закрыть')
  await waitFor(bodyHas('7 серий'), 'return from Episode 2 reader to Season 2 overview')

  await evaluate(`localStorage.setItem(${JSON.stringify(languageKey)}, 'uz')`)
  await reloadAndWait()
  await waitFor(bodyHas('Sharqiy karvon siri'), 'Uzbek Home Episode 2 resume')
  await waitFor(bodyHas('2-mavsum · 2-qism / 7'), 'Uzbek Home Season 2 episode context')
  await clickButtonContaining('Sharqiy karvon siri')
  await waitFor(bodyHas('7 qism'), 'Season 2 Uzbek overview')

  for (const title of [
    'Qirollik kumushi',
    'Sharqiy karvon siri',
    'Ikki minora',
    'Kutilayotgan odam',
    'Soxta yo‘l',
    'Ikki yordam guruhi',
    'Ordanga qaytish',
  ]) {
    await waitFor(bodyHas(title), `Uzbek Season 2 row: ${title}`)
  }

  await setJson(
    progressKey(episode1),
    makeProgress(episode1, {
      completed: true,
      currentPartIndex: episode1.parts.length - 1,
    }),
  )
  await setJson(
    progressKey(episode2),
    makeProgress(episode2, {
      completed: true,
      currentPartIndex: episode2.parts.length - 1,
      selectedChoices: {
        story2_choice_3_sarvan_check: 'story2_choice_3a_old_sarvan_yard',
      },
    }),
  )
  await evaluate(`localStorage.removeItem(${JSON.stringify(progressKey(episode3))})`)

  await reloadAndWait()
  await waitFor(bodyHas('Ikki minora'), 'Uzbek Home next Episode 3')
  await waitFor(bodyHas('2-mavsum · 3-qism / 7'), 'Uzbek next Episode 3 context')
  await clickButtonContaining('Ikki minora')
  await waitFor(bodyHas('7 qism'), 'Uzbek overview before Episode 3')
  await clickButtonContaining('Ikki minora')

  await waitFor(bodyHas('1-qism / 3'), 'Episode 3 fresh reader part 1')
  const coverLeakedIntoFreshEpisodeReader = await evaluate(
    season2CoverPresentExpression,
  )
  assert(
    !coverLeakedIntoFreshEpisodeReader,
    'shared Season 2 cover leaked into fresh Episode 3 reader',
  )

  await waitFor(
    bodyHas('Samira darrov janubiy minoraga bordi.'),
    'Episode 3 inherited Episode 2 choice payoff',
  )
  await waitFor(
    `[...document.images].some((img) =>
      img.src.includes('seven_roads_s2_story3_two_towers_niche_discovery_01_APPROVED')
    )`,
    'Episode 3 hosted Tier A image in Uzbek reader',
  )
  await evaluate(`(() => {
    const image = [...document.images].find((img) =>
      img.src.includes('seven_roads_s2_story3_two_towers_niche_discovery_01_APPROVED')
    )
    if (!image) return false
    image.scrollIntoView({ block: 'center', behavior: 'auto' })
    return true
  })()`)
  await waitFor(
    `(() => {
      const raw = localStorage.getItem(${JSON.stringify(discoveryKey(episode3))})
      if (!raw) return false
      try {
        return JSON.parse(raw).includes(
          'seven_roads_s2_story3_two_towers_niche_discovery_01_APPROVED'
        )
      } catch {
        return false
      }
    })()`,
    'Episode 3 gallery discovery after image enters viewport',
  )
  await waitFor(
    `(() => {
      const raw = localStorage.getItem(${JSON.stringify(progressKey(episode3))})
      if (!raw) return false
      try {
        return JSON.parse(raw).selected_choices.story2_choice_3_sarvan_check ===
          'story2_choice_3a_old_sarvan_yard'
      } catch {
        return false
      }
    })()`,
    'Episode 3 persisted inherited Episode 2 choice',
  )

  await setJson(
    progressKey(episode7),
    makeProgress(episode7, {
      completed: true,
      currentPartIndex: episode7.parts.length - 1,
    }),
  )
  await clickExactButton('Yopish')
  await waitFor(bodyHas('7 qism'), 'return from Episode 3 to Season 2 overview')
  await clickButtonContaining('Ordanga qaytish')
  await waitFor(bodyHas('7-qism tugadi'), 'Episode 7 completion screen')
  const coverLeakedIntoEpisodeCompletion = await evaluate(
    season2CoverPresentExpression,
  )
  assert(
    !coverLeakedIntoEpisodeCompletion,
    'shared Season 2 cover leaked into Episode 7 completion screen',
  )

  const episode3DiscoveryBeforeReset = await evaluate(
    `localStorage.getItem(${JSON.stringify(discoveryKey(episode3))})`,
  )
  assert(
    episode3DiscoveryBeforeReset?.includes(
      'seven_roads_s2_story3_two_towers_niche_discovery_01_APPROVED',
    ),
    'Episode 3 gallery discovery was not persisted before reset',
  )

  const staleKeys = [
    'qissa:v1:authoredStoryProgress:retired_seven_roads_story:old-version',
    'qissa:v1:authoredReadingPosition:retired_seven_roads_story:old-version',
    'qissa:v1:authoredIllustrationDiscovery:retired_seven_roads_story:old-version',
  ]
  for (const key of staleKeys) {
    await evaluate(
      `localStorage.setItem(${JSON.stringify(key)}, '{"legacy":true}')`,
    )
  }

  await clickExactButton('Hozircha to‘xtash')
  await waitFor(bodyHas('Yetti yo‘l qirolligi'), 'Uzbek Home before reset')
  await clickAriaButton('Sozlamalar')
  await waitFor(bodyHas('Hikoyalar jarayoni'), 'Uzbek settings progress section')
  await clickExactButton('Hikoyalar jarayonini tozalash')
  await clickExactButton('Ha, jarayonni tozalash')
  await waitFor(bodyHas('Jasorat bayrami'), 'Home after full story reset')

  for (const story of [season1, ...season2Episodes]) {
    const storedProgress = await evaluate(
      `localStorage.getItem(${JSON.stringify(progressKey(story))})`,
    )
    const storedReading = await evaluate(
      `localStorage.getItem(${JSON.stringify(readingKey(story))})`,
    )
    const storedDiscovery = await evaluate(
      `localStorage.getItem(${JSON.stringify(discoveryKey(story))})`,
    )
    assert(storedProgress === null, `progress survived reset for ${story.story_id}`)
    assert(storedReading === null, `reading position survived reset for ${story.story_id}`)
    assert(storedDiscovery === null, `gallery discovery survived reset for ${story.story_id}`)
  }

  for (const key of staleKeys) {
    const staleValue = await evaluate(
      `localStorage.getItem(${JSON.stringify(key)})`,
    )
    assert(staleValue === null, `stale authored-story data survived reset: ${key}`)
  }

  assert(
    browserErrors.length === 0,
    `Browser runtime exceptions: ${browserErrors.join(' | ')}`,
  )

  console.log('[season2-release-browser] PASS')
  console.log('[season2-release-browser] viewport 430x932')
  console.log('[season2-release-browser] legacy Episode 2 progress resumed at part 8 under the new seven-episode season')
  console.log('[season2-release-browser] one shared Season 2 cover rendered on overview and stayed out of fresh/resumed readers and episode completion')
  console.log('[season2-release-browser] all seven RU and UZ episode titles rendered')
  console.log('[season2-release-browser] completed Episodes 1+2 unlocked Episode 3')
  console.log('[season2-release-browser] Episode 3 inherited and persisted Episode 2 Sarvan choice')
  console.log('[season2-release-browser] Episode 3 Uzbek reader resolved its hosted Tier A image')
  console.log('[season2-release-browser] progress reset clears current and stale-version progress, reading position, and gallery discovery')
} finally {
  cleanup()
}
