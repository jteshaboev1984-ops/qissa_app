from pathlib import Path


def replace(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f'missing expected block in {path}: {old[:80]!r}')
    p.write_text(text.replace(old, new))

replace(
    'supabase/functions/story-generate/usage.ts',
    "// During active Story AI development, zero means accounting-only: provider-\n// eligible requests are still counted atomically, but no per-installation or\n// project-wide daily quota is enforced. QISSA_AI_ENABLED=false remains the\n// emergency provider kill switch. Positive limits keep their normal throttling\n// semantics and should be restored intentionally before external beta/launch.\nconst DEVELOPMENT_ACCOUNTING_ONLY_LIMIT = 0\nconst DAILY_STORY_GENERATION_LIMIT = DEVELOPMENT_ACCOUNTING_ONLY_LIMIT\nconst GLOBAL_DAILY_STORY_GENERATION_LIMIT = DEVELOPMENT_ACCOUNTING_ONLY_LIMIT",
    "// Launch-safe emergency ceilings. These are server-side spend guards, not a\n// product-facing family quota. They bound accidental/abusive provider spend even\n// when the browser has no visible throttle. Claims are still counted atomically.\n// Increase deliberately only after observing real closed-beta usage and cost.\nconst DAILY_STORY_GENERATION_LIMIT = 5\nconst GLOBAL_DAILY_STORY_GENERATION_LIMIT = 30",
)

replace('src/lib/storyRemoteClient.ts', 'const DEFAULT_TIMEOUT_MS = 12_000', 'const DEFAULT_TIMEOUT_MS = 130_000')
replace('src/lib/storyRemoteClient.ts', 'const MAX_TIMEOUT_MS = 90_000', 'const MAX_TIMEOUT_MS = 140_000')
replace('.github/workflows/deploy-pages.yml', 'VITE_QISSA_STORY_TIMEOUT_MS: 80000', 'VITE_QISSA_STORY_TIMEOUT_MS: 130000')
replace('.env.example', 'VITE_QISSA_STORY_TIMEOUT_MS=80000', 'VITE_QISSA_STORY_TIMEOUT_MS=130000')
replace(
    '.env.example',
    '# A configured key enables Story AI by default. Set this explicitly to false as an emergency kill switch.\n# QISSA_AI_ENABLED=false\n# OPENAI_STORY_MODEL=gpt-5.6-luna\n# OPENAI_SAFETY_MODEL=gpt-5.6-luna',
    '# Story AI is fail-closed: the reviewed production rollout gate must be enabled in code AND this must be explicitly true.\n# QISSA_AI_ENABLED=false\n# OPENAI_ARCHITECT_MODEL=gpt-5.6-luna\n# OPENAI_NARRATOR_MODEL=gpt-5.6-luna\n# OPENAI_SAFETY_MODEL=gpt-5.6-luna\n# OPENAI_NARRATOR_ESCALATION_MODEL=  # keep empty unless a reviewed escalation rollout is approved',
)
replace(
    'src/config/betaScope.ts',
    "  // Story AI remains under active development. Do not impose a product-facing\n  // daily quota while prompts, validators and continuity are still being tuned.\n  // Provider-eligible requests are still counted server-side for observability.\n  // Re-enable plan-aware quotas plus an emergency spend ceiling before launch.\n  storyGenerationThrottleEnabled: false,",
    "  // Do not expose a product-facing family quota during the closed beta. The\n  // backend still enforces a conservative emergency provider-spend ceiling and\n  // keeps private aggregate accounting. Any future visible quota is a product\n  // decision and should remain separate from this operational safety guard.\n  storyGenerationThrottleEnabled: false,",
)

path = Path('scripts/check-story-cost-guard.mjs')
text = path.read_text()
text = text.replace(
    "const provider = read('supabase/functions/story-generate/openai.ts')\nconst usage = read('supabase/functions/story-generate/usage.ts')",
    "const provider = read('supabase/functions/story-generate/openai.ts')\nconst splitProvider = read('supabase/functions/story-generate/split-openai.ts')\nconst usage = read('supabase/functions/story-generate/usage.ts')\nconst pagesWorkflow = read('.github/workflows/deploy-pages.yml')\nconst envExample = read('.env.example')",
)
old = """requireCondition(\n  /storyGenerationThrottleEnabled:\\s*false/.test(betaScope) &&\n    /DEVELOPMENT_ACCOUNTING_ONLY_LIMIT\\s*=\\s*0/.test(usage) &&\n    /DAILY_STORY_GENERATION_LIMIT\\s*=\\s*DEVELOPMENT_ACCOUNTING_ONLY_LIMIT/.test(usage) &&\n    /GLOBAL_DAILY_STORY_GENERATION_LIMIT\\s*=\\s*DEVELOPMENT_ACCOUNTING_ONLY_LIMIT/.test(usage),\n  'Active Story AI development must use the explicit zero accounting-only sentinel rather than an invalid giant quota.',\n)\n"""
new = """requireCondition(\n  /storyGenerationThrottleEnabled:\\s*false/.test(betaScope) &&\n    /DAILY_STORY_GENERATION_LIMIT\\s*=\\s*5/.test(usage) &&\n    /GLOBAL_DAILY_STORY_GENERATION_LIMIT\\s*=\\s*30/.test(usage) &&\n    !/DEVELOPMENT_ACCOUNTING_ONLY_LIMIT/.test(usage),\n  'Launch-capable Story AI must keep an invisible server-side 5/install and 30/project emergency spend ceiling even when no product-facing quota is shown.',\n)\n"""
if old not in text:
    raise SystemExit('missing cost guard launch block')
text = text.replace(old, new)
anchor = """requireCondition(\n  /30_000/.test(provider) &&\n    /'qissa_story_candidate'[\\s\\S]*30_000[\\s\\S]*4000[\\s\\S]*'none'/.test(provider) &&\n    /'qissa_safety_evaluation'[\\s\\S]*12_000[\\s\\S]*700[\\s\\S]*'none'/.test(provider),\n  'Story generation must keep sufficient structured-output headroom while both structured calls use latency-aware timeouts and no reasoning.',\n)\n"""
addition = anchor + """\nrequireCondition(\n  /DEFAULT_TIMEOUT_MS = 130_000/.test(remoteClient) &&\n    /MAX_TIMEOUT_MS = 140_000/.test(remoteClient) &&\n    /VITE_QISSA_STORY_TIMEOUT_MS:\\s*130000/.test(pagesWorkflow) &&\n    /VITE_QISSA_STORY_TIMEOUT_MS=130000/.test(envExample) &&\n    /'qissa_story_blueprint'[\\s\\S]*18_000[\\s\\S]*1800[\\s\\S]*'none'/.test(splitProvider) &&\n    /'qissa_story_narration'[\\s\\S]*30_000[\\s\\S]*3200[\\s\\S]*'none'/.test(splitProvider) &&\n    /'qissa_text_length_repair'[\\s\\S]*30_000[\\s\\S]*3000[\\s\\S]*'none'/.test(provider) &&\n    /'qissa_safety_evaluation'[\\s\\S]*12_000[\\s\\S]*700[\\s\\S]*'none'/.test(provider),\n  'Browser timeout must cover the bounded 18s architect + 30s narrator + 30s narrator retry + 30s repair + 12s parallel safety envelope without exceeding the 150s hosted Edge Function ceiling.',\n)\n"""
if anchor not in text:
    raise SystemExit('missing provider timeout assertion block')
text = text.replace(anchor, addition)
text = text.replace(
    "console.log('Story AI accounting check passed: development uses explicit accounting-only mode, usage remains atomic and private, positive throttles remain available, and provider failures do not trigger blind paid retries.')",
    "console.log('Story AI launch guard passed: server spend is bounded, browser/server timeouts are aligned, usage remains atomic/private, and provider failures do not trigger blind paid retries.')",
)
path.write_text(text)
