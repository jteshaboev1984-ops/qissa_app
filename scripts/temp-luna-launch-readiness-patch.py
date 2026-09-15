from pathlib import Path

path = Path('scripts/check-story-cost-guard.mjs')
text = path.read_text()
text = text.replace(
    "const provider = read('supabase/functions/story-generate/openai.ts')\nconst usage = read('supabase/functions/story-generate/usage.ts')",
    "const provider = read('supabase/functions/story-generate/openai.ts')\nconst splitProvider = read('supabase/functions/story-generate/split-openai.ts')\nconst usage = read('supabase/functions/story-generate/usage.ts')\nconst pagesWorkflow = read('.github/workflows/deploy-pages.yml')\nconst envExample = read('.env.example')",
)
old = """requireCondition(\n  /storyGenerationThrottleEnabled:\\s*false/.test(betaScope) &&\n    /DEVELOPMENT_ACCOUNTING_ONLY_LIMIT\\s*=\\s*0/.test(usage) &&\n    /DAILY_STORY_GENERATION_LIMIT\\s*=\\s*DEVELOPMENT_ACCOUNTING_ONLY_LIMIT/.test(usage) &&\n    /GLOBAL_DAILY_STORY_GENERATION_LIMIT\\s*=\\s*DEVELOPMENT_ACCOUNTING_ONLY_LIMIT/.test(usage),\n  'Active Story AI development must use the explicit zero accounting-only sentinel rather than an invalid giant quota.',\n)\n"""
new = """requireCondition(\n  /storyGenerationThrottleEnabled:\\s*false/.test(betaScope) &&\n    /DAILY_STORY_GENERATION_LIMIT\\s*=\\s*5/.test(usage) &&\n    /GLOBAL_DAILY_STORY_GENERATION_LIMIT\\s*=\\s*30/.test(usage) &&\n    !/DEVELOPMENT_ACCOUNTING_ONLY_LIMIT/.test(usage),\n  'Launch-capable Story AI must keep an invisible server-side 5/install and 30/project emergency spend ceiling even when no product-facing quota is shown.',\n)\n"""
if old not in text:
    raise SystemExit('missing old launch quota assertion')
text = text.replace(old, new)
anchor = """requireCondition(\n  /30_000/.test(provider) &&\n    /'qissa_story_candidate'[\\s\\S]*30_000[\\s\\S]*4000[\\s\\S]*'none'/.test(provider) &&\n    /'qissa_safety_evaluation'[\\s\\S]*12_000[\\s\\S]*700[\\s\\S]*'none'/.test(provider),\n  'Story generation must keep sufficient structured-output headroom while both structured calls use latency-aware timeouts and no reasoning.',\n)\n"""
if anchor not in text:
    raise SystemExit('missing provider timeout assertion')
addition = anchor + """\nrequireCondition(\n  /DEFAULT_TIMEOUT_MS = 130_000/.test(remoteClient) &&\n    /MAX_TIMEOUT_MS = 140_000/.test(remoteClient) &&\n    /VITE_QISSA_STORY_TIMEOUT_MS:\\s*130000/.test(pagesWorkflow) &&\n    /VITE_QISSA_STORY_TIMEOUT_MS=130000/.test(envExample) &&\n    /'qissa_story_blueprint'[\\s\\S]*18_000[\\s\\S]*1800[\\s\\S]*'none'/.test(splitProvider) &&\n    /'qissa_story_narration'[\\s\\S]*30_000[\\s\\S]*3200[\\s\\S]*'none'/.test(splitProvider) &&\n    /'qissa_text_length_repair'[\\s\\S]*30_000[\\s\\S]*3000[\\s\\S]*'none'/.test(provider) &&\n    /'qissa_safety_evaluation'[\\s\\S]*12_000[\\s\\S]*700[\\s\\S]*'none'/.test(provider),\n  'Browser timeout must cover the bounded 18s architect + 30s narrator + 30s narrator retry + 30s repair + 12s parallel safety envelope without exceeding the 150s hosted Edge Function ceiling.',\n)\n"""
text = text.replace(anchor, addition)
text = text.replace(
    "console.log('Story AI accounting check passed: development uses explicit accounting-only mode, usage remains atomic and private, positive throttles remain available, and provider failures do not trigger blind paid retries.')",
    "console.log('Story AI launch guard passed: server spend is bounded, browser/server timeouts are aligned, usage remains atomic/private, and provider failures do not trigger blind paid retries.')",
)
path.write_text(text)
trigger = Path('scripts/temp-luna-launch-trigger.txt')
if trigger.exists():
    trigger.unlink()
