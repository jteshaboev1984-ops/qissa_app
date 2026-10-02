import { spawn, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'

const root = process.cwd()
const dist = path.join(root, 'dist')
if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error('[story2-resume-gallery] dist/index.html is missing; build the gated preview first')
  process.exit(2)
}

const story = JSON.parse(
  fs.readFileSync(
    path.join(root, 'src/data/authored/taynaVostochnogoKaravanaV4.ru.json'),
    'utf8',
  ),
)

const storyId = story.story_id
const storyVersion = story.story_version
const progressKey =
  `qissa:v1:authoredStoryProgress:${storyId}:${storyVersion}`
const readingKey =
  `qissa:v1:authoredReadingPosition:${storyId}:${storyVersion}`
const discoveryKey =
  `qissa:v1:authoredIllustrationDiscovery:${storyId}:${storyVersion}`

const choice = (decisionIndex, choiceIndex) =>
  story.parts
    .filter((part) => part.decision)
    [decisionIndex].decision.choices[choiceIndex]

const choice1a = choice(0, 0)
const choice2a = choice(1, 0)
const choice3a = choice(2, 0)
const choice3b = choice(2, 1)
const choice4a = choice(3, 0)
const choice4b = choice(3, 1)

const chosenChoice3Asset = choice3a.illustration.asset_id
const unchosenChoice3Asset = choice3b.illustration.asset_id
const chosenChoice4Asset = choice4b.illustration.asset_id
const unchosenChoice4Asset = choice4a.illustration.asset_id

const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

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
  console.error('[story2-resume-gallery] Chrome/Chromium executable not found')
  process.exit(2)
}

const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qissa-story2-chrome-'))
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
const devToolsDeadline = Date.now() + 15000
while (!fs.existsSync(devToolsActivePort) && Date.now() < devToolsDeadline) {
  if (chrome.exitCode != null) break
  await sleep(100)
}

if (!fs.existsSync(devToolsActivePort)) {
  const exitCode = chrome.exitCode
  try { chrome.kill('SIGTERM') } catch {}
  try { server.close() } catch {}
  try { fs.rmSync(profileDir, { recursive: true, force: true }) } catch {}
  console.error(
    '[story2-resume-gallery] Chrome DevTools endpoint did not start; exit=' +
      String(exitCode) +
      '; stderr=' +
      chromeStderr.slice(-4000),
  )
  process.exit(2)
}

const [debugPortLine] = fs.readFileSync(devToolsActivePort, 'utf8').trim().split(/\r?\n/)
const debugPort = Number(debugPortLine)
if (!Number.isInteger(debugPort) || debugPort <= 0) {
  try { chrome.kill('SIGTERM') } catch {}
  try { server.close() } catch {}
  try { fs.rmSync(profileDir, { recursive: true, force: true }) } catch {}
  console.error('[story2-resume-gallery] Invalid DevToolsActivePort: ' + debugPortLine)
  process.exit(2)
}

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

  const waitFor = async (expression, label, timeoutMs = 15000) => {
    const deadline = Date.now() + timeoutMs
    while (Date.now() < deadline) {
      if (await evaluate(expression)) return
      await sleep(100)
    }
    throw new Error(`Timed out waiting for ${label}`)
  }

  const bodyHas = (text) =>
    `document.body?.innerText.toLowerCase().includes(${JSON.stringify(text.toLowerCase())}) === true`

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

  const readJsonStorage = async (key) =>
    evaluate(`(() => {
      const raw = localStorage.getItem(${JSON.stringify(key)})
      return raw ? JSON.parse(raw) : null
    })()`)

  const waitPart = async (partNumber) => {
    await waitFor(
      bodyHas(`Часть ${partNumber} / 10`),
      `Story 2 part ${partNumber}`,
    )
  }

  const waitProgressIndex = async (index) => {
    await waitFor(
      `(() => {
        const raw = localStorage.getItem(${JSON.stringify(progressKey)})
        if (!raw) return false
        try { return JSON.parse(raw).current_part_index === ${index} } catch { return false }
      })()`,
      `persisted current_part_index=${index}`,
    )
  }

  const choose = async (choiceText) => {
    await clickExactButton(choiceText)
    await clickExactButton('Подтвердить выбор')
    await waitFor(
      bodyHas('Выбор сохранён'),
      `saved choice: ${choiceText}`,
    )
  }

  const continueToPart = async (partNumber) => {
    await clickExactButton('Продолжить')
    await waitPart(partNumber)
    await waitProgressIndex(partNumber - 1)
  }

  const scrollAssetIntoView = async (assetId) => {
    await waitFor(
      `[...document.images].some((img) => img.src.includes(${JSON.stringify(assetId)}))`,
      `rendered image ${assetId}`,
    )
    await evaluate(`(() => {
      const image = [...document.images].find(
        (candidate) => candidate.src.includes(${JSON.stringify(assetId)})
      )
      if (!image) return false
      image.scrollIntoView({ block: 'center', behavior: 'instant' })
      return true
    })()`)
    await waitFor(
      `(() => {
        const raw = localStorage.getItem(${JSON.stringify(discoveryKey)})
        if (!raw) return false
        try { return JSON.parse(raw).includes(${JSON.stringify(assetId)}) } catch { return false }
      })()`,
      `gallery discovery ${assetId}`,
    )
  }

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', {
    width: 430,
    height: 932,
    deviceScaleFactor: 1,
    mobile: true,
  })

  const previewUrl =
    'http://127.0.0.1:4173/qissa_app/?authoredStory=tayna-vostochnogo-karavana'
  await send('Page.navigate', { url: previewUrl })
  await waitFor(
    `document.readyState === 'complete'`,
    'initial document load',
  )
  try {
    await waitFor(
      bodyHas('Тайна восточного каравана'),
      'Story 2 preview',
      20000,
    )
  } catch (error) {
    const diagnostic = await evaluate(`({
      href: location.href,
      title: document.title,
      readyState: document.readyState,
      body: document.body?.innerText?.slice(0, 2000) ?? '',
      scripts: [...document.scripts].map((script) => script.src),
    })`)
    console.error('[story2-resume-gallery] preview diagnostic:', JSON.stringify(diagnostic))
    console.error('[story2-resume-gallery] runtime exceptions:', browserErrors.join(' | '))
    throw error
  }

  await evaluate(`(() => {
    localStorage.removeItem(${JSON.stringify(progressKey)})
    localStorage.removeItem(${JSON.stringify(readingKey)})
    localStorage.removeItem(${JSON.stringify(discoveryKey)})
    location.reload()
    return true
  })()`)
  await waitPart(1)
  await waitProgressIndex(0)

  await continueToPart(2)
  await continueToPart(3)
  await continueToPart(4)
  await continueToPart(5)

  await choose(choice1a.text)
  await continueToPart(6)

  await choose(choice2a.text)
  await continueToPart(7)

  await choose(choice3a.text)
  await scrollAssetIntoView(chosenChoice3Asset)

  let discovery = await readJsonStorage(discoveryKey)
  assert(
    Array.isArray(discovery) && discovery.includes(chosenChoice3Asset),
    'Chosen Choice 3 illustration was not discovered',
  )
  assert(
    !discovery.includes(unchosenChoice3Asset),
    'Unchosen Choice 3 illustration leaked into discovery storage',
  )

  await evaluate('window.scrollTo({ top: Math.max(250, document.body.scrollHeight * 0.55), behavior: "instant" })')
  await waitFor(
    `(() => {
      const raw = localStorage.getItem(${JSON.stringify(readingKey)})
      if (!raw) return false
      try {
        const value = JSON.parse(raw)
        return value.part_index === 6 && value.scroll_y > 0
      } catch { return false }
    })()`,
    'non-zero Story 2 reading position',
  )

  const savedReadingBeforeReload = await readJsonStorage(readingKey)
  const progressBeforeReload = await readJsonStorage(progressKey)

  await send('Page.reload', { ignoreCache: true })
  await waitPart(7)
  await waitFor(bodyHas('Выбор сохранён'), 'restored Choice 3 selection')
  await waitFor(
    bodyHas(choice3a.text),
    'restored Choice 3 text',
  )
  await sleep(700)

  const progressAfterReload = await readJsonStorage(progressKey)
  const readingAfterReload = await readJsonStorage(readingKey)
  discovery = await readJsonStorage(discoveryKey)
  const restoredScrollY = await evaluate('window.scrollY')

  assert(
    progressAfterReload.current_part_index === progressBeforeReload.current_part_index,
    'Story 2 current part changed across reload',
  )
  assert(
    progressAfterReload.selected_choices.story2_choice_3_sarvan_check ===
      choice3a.choice_id,
    'Choice 3 selection was not restored across reload',
  )
  assert(
    readingAfterReload.part_index === 6 && savedReadingBeforeReload.part_index === 6,
    'Reading position part index did not persist across reload',
  )
  assert(
    restoredScrollY > 0,
    'Stable-origin reload did not restore a non-zero reader scroll position',
  )
  assert(
    discovery.includes(chosenChoice3Asset) &&
      !discovery.includes(unchosenChoice3Asset),
    'Choice 3 gallery discovery state did not survive reload cleanly',
  )

  await clickExactButton('Продолжить')
  await waitPart(8)
  await waitProgressIndex(7)

  await choose(choice4b.text)
  await scrollAssetIntoView(chosenChoice4Asset)

  discovery = await readJsonStorage(discoveryKey)
  assert(
    discovery.includes(chosenChoice4Asset),
    'Chosen Choice 4 illustration was not discovered',
  )
  assert(
    !discovery.includes(unchosenChoice4Asset),
    'Unchosen Choice 4 illustration leaked into discovery storage',
  )

  const progressBeforeSecondReload = await readJsonStorage(progressKey)
  await send('Page.reload', { ignoreCache: true })
  await waitPart(8)
  await waitFor(bodyHas('Выбор сохранён'), 'restored Choice 4 selection')

  const progressAfterSecondReload = await readJsonStorage(progressKey)
  discovery = await readJsonStorage(discoveryKey)

  assert(
    progressAfterSecondReload.selected_choices.story2_choice_4_stop_nadir ===
      choice4b.choice_id,
    'Choice 4 selection was not restored across reload',
  )
  assert(
    progressAfterSecondReload.current_part_index ===
      progressBeforeSecondReload.current_part_index,
    'Story 2 part changed across second reload',
  )
  assert(
    discovery.includes(chosenChoice3Asset) &&
      discovery.includes(chosenChoice4Asset),
    'Selected-only gallery discovery did not persist across second reload',
  )
  assert(
    !discovery.includes(unchosenChoice3Asset) &&
      !discovery.includes(unchosenChoice4Asset),
    'Unchosen selected-only branch art leaked into gallery discovery',
  )

  assert(
    browserErrors.length === 0,
    `Browser runtime exceptions: ${browserErrors.join(' | ')}`,
  )

  console.log('[story2-resume-gallery] PASS')
  console.log('[story2-resume-gallery] stable origin: http://127.0.0.1:4173/qissa_app/')
  console.log('[story2-resume-gallery] viewport: 430x932')
  console.log('[story2-resume-gallery] Choice 3A progress + non-zero reading position survived reload')
  console.log('[story2-resume-gallery] Choice 4B progress survived reload')
  console.log('[story2-resume-gallery] selected-only discovery persisted: ' + [
    chosenChoice3Asset,
    chosenChoice4Asset,
  ].join(', '))
  console.log('[story2-resume-gallery] unchosen branch art remained locked: ' + [
    unchosenChoice3Asset,
    unchosenChoice4Asset,
  ].join(', '))
} finally {
  cleanup()
}
