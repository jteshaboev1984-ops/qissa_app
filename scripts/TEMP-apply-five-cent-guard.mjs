import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'

const patch = (path, before, after) => {
  const source = readFileSync(path, 'utf8')
  assert.equal(source.split(before).length, 2, `Expected exactly one original segment in ${path}`)
  writeFileSync(path, source.replace(before, after))
}

const budgetImport = "import type { StoryTestBudgetObserver } from './test-spend-budget.ts'\n"
for (const path of ['supabase/functions/story-generate/openai.ts', 'supabase/functions/story-generate/split-openai.ts']) {
  const content = readFileSync(path, 'utf8')
  assert.ok(content.startsWith('import '), `${path}: missing imports`)
  writeFileSync(path, budgetImport + content)
  const url = path.endsWith('/openai.ts') ? 'url' : 'RESPONSES_URL'
  patch(path,
    '  const controller = new AbortController()\n  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)\n  try {\n    const serializedBody = JSON.stringify(body)\n    onRequestAttempt?.()\n',
    `  const controller = new AbortController()\n  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)\n  const observer = onRequestAttempt as unknown as Partial<StoryTestBudgetObserver> | undefined\n  let budgetReservation: number | null | undefined\n  try {\n    const serializedBody = JSON.stringify(body)\n    budgetReservation = observer?.reserve?.(${url}, body, serializedBody)\n    onRequestAttempt?.()\n`)
  patch(path,
    '    return response.json()\n  } catch (error) {\n',
    '    const payload = await response.json()\n    observer?.settle?.(budgetReservation ?? null, payload)\n    return payload\n  } catch (error) {\n    observer?.uncertain?.(budgetReservation ?? null)\n')
}

const indexPath = 'supabase/functions/story-generate/split-index.ts'
let index = readFileSync(indexPath, 'utf8')
index = "import { createFiveCentStoryTestBudget } from './test-spend-budget.ts'\n" + index
assert.equal(index.split('  const onRequestAttempt = () => { providerCalls += 1 }').length, 2)
index = index.replace('  const onRequestAttempt = () => { providerCalls += 1 }',
  '  const onRequestAttempt = Object.assign(() => { providerCalls += 1 }, createFiveCentStoryTestBudget())')
writeFileSync(indexPath, index)

patch('.github/workflows/ci.yml',
  '      - name: Validate Story AI cost guard\n        run: npm run check:story-cost-guard\n',
  '      - name: Validate Story AI cost guard\n        run: npm run check:story-cost-guard\n\n      - name: Validate 5-cent per-story budget and fail-closed reservations\n        run: node scripts/check-story-test-spend-budget.mjs\n')
console.log('Budget patch applied deterministically to both outgoing HTTP boundaries, split orchestrator and CI; zero provider requests.')
