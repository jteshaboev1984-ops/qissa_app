import assert from 'node:assert/strict'
import { createFiveCentStoryTestBudget } from '../supabase/functions/story-generate/test-spend-budget.ts'

const url = 'https://api.openai.com/v1/responses'
const moderation = 'https://api.openai.com/v1/moderations'
const body = (output = 3200, model = 'gpt-5.6-luna') => ({model, max_output_tokens: output, input: [{role:'user',content:'short synthetic test only'}]})
const reserve = (budget, payload = body()) => budget.reserve(url, payload, JSON.stringify(payload))
const usage = (input_tokens = 500, output_tokens = 800) => ({model:'gpt-5.6-luna', usage:{input_tokens,output_tokens}})

{
  const budget = createFiveCentStoryTestBudget()
  const id = reserve(budget)
  assert.equal(id, 1)
  assert.ok(budget.snapshot().heldNanodollars > 0)
  budget.settle(id, usage())
  assert.equal(budget.snapshot().pending, 0)
  assert.equal(budget.snapshot().blocked, false)
  const second = reserve(budget, body(700))
  budget.settle(second, usage(300, 90))
  assert.ok(budget.snapshot().heldNanodollars < 50_000_000)
}
{
  const budget = createFiveCentStoryTestBudget()
  const free = budget.reserve(moderation, {model:'omni-moderation-latest'}, '{}')
  assert.equal(free, null)
  budget.settle(free, {})
  assert.equal(budget.snapshot().heldNanodollars, 0)
}
{
  const budget = createFiveCentStoryTestBudget()
  assert.throws(() => reserve(budget, body(3200,'gpt-5.6-sol')), /model_or_endpoint/)
  assert.equal(budget.snapshot().blocked, true)
}
{
  const budget = createFiveCentStoryTestBudget()
  assert.throws(() => reserve(budget, body(5000)), /output_uncapped/)
  assert.equal(budget.snapshot().blocked, true)
}
{
  const budget = createFiveCentStoryTestBudget()
  assert.throws(() => budget.reserve(url, body(), 'x'.repeat(250_000)), /input_too_large/)
}
{
  const budget = createFiveCentStoryTestBudget()
  assert.throws(() => budget.reserve(url, body(), 'x'.repeat(170_000)), /five_cent_limit/)
  assert.equal(budget.snapshot().pending, 0)
}
{
  const budget = createFiveCentStoryTestBudget()
  const first = reserve(budget, body(3200))
  const second = reserve(budget, body(3200))
  assert.notEqual(first, second, 'concurrent reservations are distinct')
  assert.equal(budget.snapshot().pending, 2)
  budget.settle(second, usage(100, 200))
  budget.settle(first, usage(100, 300))
  assert.equal(budget.snapshot().pending, 0)
}
{
  const budget = createFiveCentStoryTestBudget()
  const id = reserve(budget)
  budget.uncertain(id)
  assert.equal(budget.snapshot().blocked, true)
  assert.equal(budget.snapshot().pending, 1)
  assert.throws(() => reserve(budget), /budget_blocked/)
}
{
  const budget = createFiveCentStoryTestBudget()
  const id = reserve(budget)
  assert.throws(() => budget.settle(id, {model:'gpt-5.6-luna'}), /usage_unavailable/)
  assert.equal(budget.snapshot().blocked, true)
}
{
  const budget = createFiveCentStoryTestBudget()
  const id = reserve(budget)
  assert.throws(() => budget.settle(id, usage(1_000_000, 2_000)), /usage_exceeded_reservation/)
  assert.equal(budget.snapshot().blocked, true)
}
console.log('Five-cent Story AI budget regression PASS: model and output allowlist, concurrent reserve, usage settlement, failed/unknown charges, and pre-fetch ceiling; provider-free.')
