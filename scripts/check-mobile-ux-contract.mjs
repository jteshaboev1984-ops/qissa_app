import fs from 'node:fs'

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const requireCondition = (condition, message) => {
  if (!condition) {
    console.error(`Mobile UX contract failed: ${message}`)
    process.exit(1)
  }
}

const html = read('index.html')
const css = read('src/index.css')
const bottomNav = read('src/components/AppBottomNav.tsx')
const storyScreen = read('src/screens/StoryScreen.tsx')
const listeningScene = read('src/components/ListeningScene.tsx')

requireCondition(
  /viewport-fit=cover/.test(html),
  'the viewport must opt into safe-area insets for modern mobile browsers',
)

requireCondition(
  /name="theme-color"/.test(html) && /#fcf9f2/.test(html),
  'the mobile browser chrome should inherit the QISSA surface color',
)

requireCondition(
  /100dvh/.test(css),
  'dynamic viewport height support is required so browser chrome does not hide content',
)

for (const inset of ['top', 'right', 'bottom', 'left']) {
  requireCondition(
    css.includes(`env(safe-area-inset-${inset})`),
    `safe-area-inset-${inset} must be handled`,
  )
}

requireCondition(
  /@media \(pointer: coarse\)/.test(css) && /min-height:\s*44px/.test(css),
  'coarse-pointer controls must preserve a 44px minimum touch target',
)

requireCondition(
  /input\[type='range'\]/.test(css),
  'the listening progress slider must receive the coarse-pointer touch target guard',
)

for (const inset of ['left', 'right', 'bottom']) {
  requireCondition(
    bottomNav.includes(`max(1rem, env(safe-area-inset-${inset}))`),
    `bottom navigation must clear safe-area-inset-${inset}`,
  )
}

requireCondition(
  /aria-current=\{active \? 'page' : undefined\}/.test(bottomNav),
  'bottom navigation should expose the active destination to assistive technology',
)

requireCondition(
  /max-h-\[min\(52vh,34rem\)\]/.test(storyScreen) &&
    /overflow-y-auto/.test(storyScreen) &&
    /overscroll-contain/.test(storyScreen),
  'the story must remain inside a bounded, independently scrollable reader on small screens',
)

requireCondition(
  /h-16 w-16/.test(listeningScene) && /min-h-12/.test(listeningScene),
  'primary listening controls must remain comfortably tappable',
)

console.log('Mobile UX contract passed: dynamic viewport, device safe areas, 44px touch targets, bounded reader, and listening controls are protected.')
