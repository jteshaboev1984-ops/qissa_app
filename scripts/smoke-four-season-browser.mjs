import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'

const root = process.cwd()
const dist = path.join(root, 'dist')
if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('[four-season-browser] dist/index.html is missing; build first')
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
  console.error('[four-season-browser] Chrome/Chromium executable not found')
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
    '[four-season-browser] Chrome DevTools endpoint did not start; stderr=' +
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

  const setViewport = async (width, height) => {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: true,
    })
    await sleep(80)
  }

  const assertViewportFits = async (label) => {
    const metrics = await evaluate(`(() => ({
      innerWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      overflowingButtons: [...document.querySelectorAll('button')].filter((button) => {
        const style = getComputedStyle(button)
        if (style.display === 'none' || style.visibility === 'hidden') return false
        const rect = button.getBoundingClientRect()
        return rect.width > 0 && (rect.left < -1 || rect.right > window.innerWidth + 1)
      }).map((button) => button.textContent?.trim().slice(0, 80) ?? '')
    }))()`)
    assert(
      metrics.documentWidth <= metrics.innerWidth + 1 &&
        metrics.bodyWidth <= metrics.innerWidth + 1 &&
        metrics.overflowingButtons.length === 0,
      `${label}: horizontal overflow at ${metrics.innerWidth}px; document=${metrics.documentWidth}, body=${metrics.bodyWidth}, buttons=${metrics.overflowingButtons.join(' | ')}`,
    )
  }

  const assertViewportMatrix = async (label) => {
    for (const [width, height] of [[360, 800], [390, 844], [430, 932]]) {
      await setViewport(width, height)
      await assertViewportFits(`${label} ${width}x${height}`)
    }
  }


  // Series are chronological, except that a started legacy package may resume.
  const season3StoryTitlesRu = ['Тайна восточного каравана', 'Две башни']
  const season4StoryTitlesRu = [
    'Человек, которого ждут',
    'Ложная дорога',
    'Две подмоги',
    'Обратно в Ордан',
  ]
  const assertStoryAccess = async (titles, expected, label) => {
    const actual = await evaluate(
      '(() => { const titles = ' + JSON.stringify(titles) +
        '; return titles.map((title) => { ' +
        'const text = [...document.querySelectorAll("p")].find(' +
        '(node) => node.textContent?.trim() === title); ' +
        'const card = text?.closest("button, [aria-disabled=true]"); ' +
        'return card ? card.tagName === "BUTTON" && !card.disabled : null;' +
        ' }); })()',
    )
    assert(
      JSON.stringify(actual) === JSON.stringify(expected),
      label + ': expected ' + JSON.stringify(expected) +
        ', got ' + JSON.stringify(actual),
    )
  }

  const assertSeason3StoryAccess = (expected, label) =>
    assertStoryAccess(season3StoryTitlesRu, expected, label)
  const assertSeason4StoryAccess = (expected, label) =>
    assertStoryAccess(season4StoryTitlesRu, expected, label)

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
  await setViewport(430, 932)

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

  await setJson(progressKey(season1), makeProgress(season1, {
    completed: true, currentPartIndex: season1.parts.length - 1,
  }))
  await reloadAndWait()
  await waitFor(bodyHas('Королевское серебро'), 'Season 2 Royal Silver home unlocked')
  await clickButtonContaining('Библиотека')
  await waitFor(bodyHas('Тайна восточного каравана'), 'four season cards')
  await waitFor(bodyHas('Королевский пленник'), 'Season 4 card')
  await assertViewportMatrix('four-season library')
  assert(await evaluate(bodyHas('После сезона 2')), 'locked Season 3 label must name its actual prerequisite')
  assert(await evaluate(bodyHas('После сезона 3')), 'locked Season 4 label must name its actual prerequisite')
  await clickButtonContaining('Тайна восточного каравана')
  await waitFor(bodyHas('Этот сезон откроется после завершения предыдущего сезона.'),
    'Season 3 Caravan locked for a new reader before Season 2 completion')
  await clickExactButton('Понятно')

  // Previously saved Caravan progress remains accessible even when its
  // new Season 2 prerequisite (Royal Silver) has not yet been completed.
  await setJson(progressKey(episode2), makeProgress(episode2, {
    currentPartIndex: 7,
    selectedChoices: {
      story2_choice_3_sarvan_check: 'story2_choice_3a_old_sarvan_yard',
    },
  }))
  const legacyProgressBefore = await evaluate(
    `localStorage.getItem(${JSON.stringify(progressKey(episode2))})`,
  )
  await reloadAndWait()
  await waitFor(bodyHas('Королевское серебро'), 'Season 2 still leads on Home')
  await clickButtonContaining('Библиотека')
  await clickButtonContaining('Тайна восточного каравана')
  await waitFor(bodyHas('2 серии'), 'Season 3 Caravan and Two Towers overview')
  assert(await evaluate(bodyHas('10 глав')), 'Caravan series must display 10 chapters')
  assert(await evaluate(bodyHas('3 главы')), 'Two Towers series must display 3 chapters')
  await assertSeason3StoryAccess([true, false], 'Two Towers locked before Caravan completion')
  await assertViewportMatrix('Season 3 Caravan ten-part overview')
  await clickButtonContaining('Продолжить')
  await waitFor(bodyHas('8 / 10'), 'resume legacy Caravan part 8 in Season 3')
  assert((await evaluate(`localStorage.getItem(${JSON.stringify(progressKey(episode2))})`)) === legacyProgressBefore,
    'opening migrated Caravan changed its persisted progress')
  await assertViewportMatrix('Season 3 resumed reader')

  // Royal Silver is Season 2 again, with its original week-after-Festival
  // opening in both languages (no artificial post-Caravan timing rewrite).
  await reloadAndWait()
  await clickButtonContaining('Библиотека')
  await clickButtonContaining('Королевское серебро')
  await waitFor(bodyHas('3 серии'), 'Season 2 Royal Silver uses unified series label')
  await clickButtonContaining('Начать сезон')
  await waitFor(bodyHas('Прошла примерно неделя после Праздника мужества.'),
    'Russian Season 2 original Royal Silver opening')

  await evaluate(`localStorage.setItem(${JSON.stringify(languageKey)}, 'uz')`)
  await reloadAndWait()
  await waitFor(bodyHas('Qirollik kumushi'), 'Season 2 Royal Silver Uzbek home')
  await clickButtonContaining('Qirollik kumushi')
  await clickButtonContaining('Davom etish')
  await waitFor(bodyHas('Jasorat bayramidan taxminan bir hafta o‘tdi.'),
    'Uzbek Season 2 original Royal Silver opening')

  // Finishing Season 2 correctly makes Season 3 the next reading step.
  await evaluate(`localStorage.setItem(${JSON.stringify(languageKey)}, 'ru')`)
  await setJson(progressKey(episode1), makeProgress(episode1, {
    completed: true, currentPartIndex: episode1.parts.length - 1,
  }))
  await reloadAndWait()
  await waitFor(bodyHas('Тайна восточного каравана'), 'Season 3 home unlocked')
  await clickButtonContaining('Тайна восточного каравана')
  await waitFor(bodyHas('2 серии'), 'Season 3 two-series overview after Season 2')
  await clickButtonContaining('Продолжить')
  await waitFor(bodyHas('8 / 10'), 'Season 3 Caravan resumes saved part 8')
  await reloadAndWait()


  await setJson(progressKey(episode2), makeProgress(episode2, {
    completed: true, currentPartIndex: episode2.parts.length - 1,
    selectedChoices: {
      story2_choice_3_sarvan_check: 'story2_choice_3a_old_sarvan_yard',
    },
  }))
  await reloadAndWait()
  await clickButtonContaining('Библиотека')
  await waitFor(bodyHas('После сезона 3'), 'Season 4 waits for Sarvan investigation')
  await clickButtonContaining('Тайна восточного каравана')
  await waitFor(bodyHas('2 серии'), 'Caravan and Two Towers now form Season 3')
  await assertSeason3StoryAccess([true, true], 'Caravan completion unlocks Two Towers')
  await assertViewportMatrix('two-series Caravan overview')
  await clickButtonContaining('Две башни')
  await waitFor(bodyHas('На третий день после отъезда из Араса'),
    'Russian Two Towers in Season 3')
  const inheritedProgress = await evaluate(
    'localStorage.getItem(' + JSON.stringify(progressKey(episode3)) + ')',
  )
  assert(inheritedProgress?.includes('"story2_choice_3_sarvan_check"'),
    'Two Towers lost the saved Caravan choice in Season 3')

  await evaluate('localStorage.setItem(' + JSON.stringify(languageKey) + ', "uz")')
  await reloadAndWait()
  await clickButtonContaining('Kutubxona')
  await clickButtonContaining('Sharqiy karvon siri')
  await clickButtonContaining('Ikki minora')
  await waitFor(bodyHas('Arasdan jo‘nab ketganlarining uchinchi kuni'),
    'Uzbek Two Towers in Season 3')
  const inheritedChoiceAfterLocale = await evaluate(
    '(() => { const raw = localStorage.getItem(' +
      JSON.stringify(progressKey(episode3)) +
      '); return raw && JSON.parse(raw).selected_choices.story2_choice_3_sarvan_check; })()',
  )
  assert(inheritedChoiceAfterLocale === 'story2_choice_3a_old_sarvan_yard',
    'switching RU/UZ removed the Caravan choice from Two Towers')

  await evaluate('localStorage.setItem(' + JSON.stringify(languageKey) + ', "ru")')
  await setJson(progressKey(episode3), makeProgress(episode3, {
    completed: true, currentPartIndex: episode3.parts.length - 1,
    selectedChoices: {
      story2_choice_3_sarvan_check: 'story2_choice_3a_old_sarvan_yard',
    },
  }))
  await reloadAndWait()
  await waitFor(bodyHas('Королевский пленник'), 'Season 4 unlocked after Two Towers')
  await clickButtonContaining('Королевский пленник')
  await waitFor(bodyHas('4 серии'), 'four-series prisoner season overview')
  await assertSeason4StoryAccess([true, false, false, false],
    'only Waited Man available at the start of Season 4')
  await assertViewportMatrix('Season 4 four-series overview')
  await clickButtonContaining('Начать сезон')
  await waitFor(bodyHas('На следующий день после событий в Сарване'),
    'Russian prisoner arc begins with Waited Man')

  await evaluate('localStorage.setItem(' + JSON.stringify(languageKey) + ', "uz")')
  await reloadAndWait()
  await clickButtonContaining('Qirollik asiri')
  await clickButtonContaining('Kutilayotgan odam')
  await waitFor(bodyHas('Sarvandagi voqealardan keyingi kuni'),
    'Uzbek prisoner arc begins with Waited Man')
  await evaluate('localStorage.setItem(' + JSON.stringify(languageKey) + ', "ru")')

  // Finishing the first prisoner series unlocks only False Road.
  await setJson(progressKey(episode4), makeProgress(episode4, {
    completed: true, currentPartIndex: episode4.parts.length - 1,
  }))
  await reloadAndWait()
  await clickButtonContaining('Библиотека')
  await clickButtonContaining('Королевский пленник')
  await waitFor(bodyHas('4 серии'), 'Season 4 after Waited Man')
  await assertSeason4StoryAccess([true, true, false, false],
    'finishing Waited Man unlocks only False Road')

  // Preexisting final-story reading position remains available in the new
  // four-series layout, even if earlier prerequisites were not completed.
  await setJson(progressKey(episode7), makeProgress(episode7, { currentPartIndex: 0 }))
  const legacyFinalBefore = await evaluate(
    'localStorage.getItem(' + JSON.stringify(progressKey(episode7)) + ')',
  )
  await reloadAndWait()
  await clickButtonContaining('Библиотека')
  await clickButtonContaining('Королевский пленник')
  await assertSeason4StoryAccess([true, true, false, true],
    'old Back to Ordan progress still allows resume')
  assert((await evaluate('localStorage.getItem(' + JSON.stringify(progressKey(episode7)) + ')')) === legacyFinalBefore,
    'moving a season changed historical final-story progress')
  await evaluate('localStorage.removeItem(' + JSON.stringify(progressKey(episode7)) + ')')

  // Both False Road choices must carry into Two Reinforcements.
  await setJson(progressKey(episode5), makeProgress(episode5, {
    completed: true, currentPartIndex: episode5.parts.length - 1,
    selectedChoices: {
      story5_choice_1_road_post_approach: 'story5_choice_1a_forest_edge',
    },
  }))
  await reloadAndWait()
  await clickButtonContaining('Библиотека')
  await clickButtonContaining('Королевский пленник')
  await assertSeason4StoryAccess([true, true, true, false],
    'Two Reinforcements unlocked without exposing finale')
  await clickButtonContaining('Две подмоги')
  const inheritedFalseRoad = '(() => { const raw = localStorage.getItem(' +
    JSON.stringify(progressKey(episode6)) +
    '); return raw && JSON.parse(raw).selected_choices.story5_choice_1_road_post_approach; })()'
  await waitFor(inheritedFalseRoad + ' === "story5_choice_1a_forest_edge"',
    'Two Reinforcements inherited forest-edge route choice')

  await setJson(progressKey(episode5), makeProgress(episode5, {
    completed: true, currentPartIndex: episode5.parts.length - 1,
    selectedChoices: {
      story5_choice_1_road_post_approach: 'story5_choice_1b_open_ridge',
    },
  }))
  await evaluate('localStorage.removeItem(' + JSON.stringify(progressKey(episode6)) + ')')
  await reloadAndWait()
  await clickButtonContaining('Библиотека')
  await clickButtonContaining('Королевский пленник')
  await clickButtonContaining('Две подмоги')
  await waitFor(inheritedFalseRoad + ' === "story5_choice_1b_open_ridge"',
    'Two Reinforcements inherited open-ridge route choice')

  // Gallery must restore scenes from completed historical Caravan progress while
  // keeping unseen Season 4 finale art behind spoiler placeholders.
  await reloadAndWait()
  await clickButtonContaining('Библиотека')
  await clickButtonContaining('Галерея')
  await waitFor(bodyHas('Тайна восточного каравана'), 'four-season gallery titles')
  await clickButtonContaining('Тайна восточного каравана')
  await waitFor('document.getElementById("gallery-season-3") !== null',
    'Season 3 Caravan gallery expanded')
  const caravanFirstPart = await evaluate(
    'document.querySelector(\'[aria-controls="gallery-season-3-story-1-episode-1"]\')?.innerText',
  )
  const caravanSceneCount = episode2.parts[0].image_slots.length
  assert(caravanFirstPart?.includes(caravanSceneCount + ' / ' + caravanSceneCount),
    'completed legacy Caravan Part 1 images were not restored in gallery')
  await evaluate(
    'document.querySelector(\'[aria-controls="gallery-season-3-story-1-episode-1"]\').click()',
  )
  await waitFor('document.getElementById("gallery-season-3-story-1-episode-1") !== null',
    'Caravan gallery Part 1 expanded')
  const caravanVisibleScenes = await evaluate(
    '[...document.querySelectorAll("#gallery-season-3-story-1-episode-1 img")].filter(' +
    '(image) => image.src.includes("/story2_v2/")).length',
  )
  assert(caravanVisibleScenes === caravanSceneCount,
    'completed Caravan gallery images are missing from their original public asset paths')

  await clickButtonContaining('Королевский пленник')
  await waitFor('document.getElementById("gallery-season-4") !== null',
    'Season 4 gallery expanded')
  const lastGalleryRow = await evaluate(
    'document.querySelector(\'[aria-controls="gallery-season-4-story-4-episode-1"]\')?.innerText',
  )
  const finalPart = episode7.parts[0]
  const finaleSceneCount = finalPart.image_slots.length +
    (finalPart.decision?.choices?.filter((choice) => choice.illustration).length ?? 0)
  assert(finaleSceneCount > 0 && lastGalleryRow?.includes('0 / ' + finaleSceneCount),
    'unread final story must show zero unlocked gallery illustrations')
  await evaluate(
    'document.querySelector(\'[aria-controls="gallery-season-4-story-4-episode-1"]\').click()',
  )
  await waitFor('document.getElementById("gallery-season-4-story-4-episode-1") !== null',
    'unread final story gallery placeholders expanded')
  const finaleLockedItems = await evaluate(
    '(() => { const panel = document.getElementById("gallery-season-4-story-4-episode-1"); ' +
      'return [...panel.querySelectorAll("button")].filter((button) => ' +
      'button.getAttribute("aria-label")?.includes("ещё не открыта")).length; })()',
  )
  assert(finaleLockedItems === finaleSceneCount,
    'final story gallery leaked art before the reader reached it')
  await clickAriaButton('Сцена главы 1 ещё не открыта')
  await waitFor(bodyHas('Сцена ещё скрыта'), 'locked illustration explains spoiler protection')




  assert(browserErrors.length === 0,
    'browser runtime exceptions: ' + browserErrors.join(' | '))
  console.log('[four-season-browser] PASS: 4 seasons with 6/3/2/4 series, Sarvan conclusion moved into Caravan season, RU+UZ')
  console.log('[four-season-browser] accurate prerequisite labels, four-series prisoner unlocks, late legacy resume, both False Road choices, RU/UZ persistence, migrated gallery art and finale spoiler locks verified')
} finally {
  cleanup()
}
