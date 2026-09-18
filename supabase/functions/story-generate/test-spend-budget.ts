// Temporary, request-local spend controller for owner-approved QISSA synthetic tests.
// NOT an invoice or a replacement for the future family/global quota and billing system.
// Direct standard-tier GPT-5.6 Luna (2026-09-18): $0.20/M input, $0.25/M
// cache writes, $1.20/M output. Reserve the more expensive input rate.
// A 20% reserve margin covers possible pricing variance; no tools, fast tier,
// regional endpoints, escalation, or other billable models are allowed.
// The moderation endpoint is free. An unknown charge blocks further requests.
const MAX_NANODOLLARS = 50_000_000 // exactly USD $0.05
const INPUT_NANODOLLARS_PER_TOKEN = 250
const OUTPUT_NANODOLLARS_PER_TOKEN = 1_200
const RESERVE_MARGIN_NUM = 12
const RESERVE_MARGIN_DEN = 10
const TOKEN_OVERHEAD = 4096 // conservative allowance beyond UTF-8 JSON bytes
const textEncoder = new TextEncoder()

type Reservation = { reserved: number; model: string }
type Usage = { input_tokens?: unknown; output_tokens?: unknown }

export type StoryTestBudgetObserver = {
  reserve: (url: string, body: unknown, serializedBody: string) => number | null
  settle: (id: number | null, response: unknown) => void
  uncertain: (id: number | null) => void
  snapshot: () => { heldNanodollars: number; blocked: boolean; pending: number }
}

const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
const integer = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0

export const createFiveCentStoryTestBudget = (): StoryTestBudgetObserver => {
  let held = 0
  let blocked = false
  let nextId = 0
  const pending = new Map<number, Reservation>()
  return {
    reserve(url, body, serializedBody) {
      if (blocked) throw new Error('qissa_test_budget_blocked')
      if (url === 'https://api.openai.com/v1/moderations') return null
      if (url !== 'https://api.openai.com/v1/responses' || !record(body) || body.model !== 'gpt-5.6-luna') {
        blocked = true
        throw new Error('qissa_test_budget_model_or_endpoint')
      }
      const output = body.max_output_tokens
      if (!integer(output) || output < 1 || output > 4000) {
        blocked = true
        throw new Error('qissa_test_budget_output_uncapped')
      }
      const inputUpper = textEncoder.encode(serializedBody).length + TOKEN_OVERHEAD
      // Reject long-context pricing and unbounded narrative input rather than guessing.
      if (inputUpper >= 250_000) {
        blocked = true
        throw new Error('qissa_test_budget_input_too_large')
      }
      const estimate = Math.ceil((inputUpper * INPUT_NANODOLLARS_PER_TOKEN +
        output * OUTPUT_NANODOLLARS_PER_TOKEN) * RESERVE_MARGIN_NUM / RESERVE_MARGIN_DEN)
      if (!Number.isSafeInteger(estimate) || held + estimate > MAX_NANODOLLARS) {
        blocked = true
        throw new Error('qissa_test_budget_five_cent_limit')
      }
      held += estimate // synchronous reservation also handles Promise.all safety calls
      const id = ++nextId
      pending.set(id, { reserved: estimate, model: body.model })
      return id
    },
    settle(id, response) {
      if (id === null) return // free moderation
      const reservation = pending.get(id)
      if (!reservation || !record(response) || response.model !== reservation.model || !record(response.usage)) {
        blocked = true
        throw new Error('qissa_test_budget_usage_unavailable')
      }
      const usage = response.usage as Usage
      if (!integer(usage.input_tokens) || !integer(usage.output_tokens)) {
        blocked = true
        throw new Error('qissa_test_budget_usage_unavailable')
      }
      const actualUpper = Math.ceil((usage.input_tokens * INPUT_NANODOLLARS_PER_TOKEN +
        usage.output_tokens * OUTPUT_NANODOLLARS_PER_TOKEN) * RESERVE_MARGIN_NUM / RESERVE_MARGIN_DEN)
      if (actualUpper > reservation.reserved) {
        blocked = true
        throw new Error('qissa_test_budget_usage_exceeded_reservation')
      }
      held -= reservation.reserved - actualUpper
      pending.delete(id)
    },
    uncertain(id) {
      if (id !== null && id !== undefined && pending.has(id)) blocked = true
      // Preserve entire reservation: timed-out/failed calls might still be billed.
    },
    snapshot: () => ({ heldNanodollars: held, blocked, pending: pending.size }),
  }
}
