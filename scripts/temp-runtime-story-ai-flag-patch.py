from pathlib import Path
import re


def must_replace(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f'missing expected block in {path}: {old[:120]!r}')
    p.write_text(text.replace(old, new))

usage = Path('supabase/functions/story-generate/usage.ts')
text = usage.read_text()
needle = """export type GenerationClaim = {\n  allowed: boolean\n  reason: string\n  used: number\n  limit: number\n  globalUsed: number\n  globalLimit: number\n}\n"""
if needle not in text:
    raise SystemExit('missing GenerationClaim type')
text = text.replace(needle, needle + """\nexport type StoryAiRuntimeState = {\n  enabled: boolean\n  reason: 'runtime-enabled' | 'runtime-disabled' | 'runtime-config-unavailable' | 'runtime-config-check-failed'\n}\n""")
anchor = """const deniedClaim = (reason: string): GenerationClaim => ({\n  allowed: false,\n  reason,\n  used: 0,\n  limit: DAILY_STORY_GENERATION_LIMIT,\n  globalUsed: 0,\n  globalLimit: GLOBAL_DAILY_STORY_GENERATION_LIMIT,\n})\n\n"""
if anchor not in text:
    raise SystemExit('missing deniedClaim anchor')
text = text.replace(anchor, anchor + """export const readStoryAiRuntimeState = async (): Promise<StoryAiRuntimeState> => {\n  const admin = adminClient()\n  if (!admin) return { enabled: false, reason: 'runtime-config-unavailable' }\n\n  const { data, error } = await admin\n    .from('qissa_runtime_flags')\n    .select('enabled')\n    .eq('flag', 'story_ai_enabled')\n    .maybeSingle()\n\n  if (error) {\n    console.error('QISSA Story AI runtime flag check failed', error)\n    return { enabled: false, reason: 'runtime-config-check-failed' }\n  }\n\n  if (!isRecord(data) || data.enabled !== true) {\n    return { enabled: false, reason: 'runtime-disabled' }\n  }\n\n  return { enabled: true, reason: 'runtime-enabled' }\n}\n\n""")
usage.write_text(text)

runtime_gate = """  if (!STORY_AI_PRODUCTION_ROLLOUT_ENABLED || !openAiApiKey) {\n    return safeFallback(context, origin, !openAiApiKey ? 'api-key-missing' : 'ai-disabled', providerMetadata())\n  }\n\n  const runtimeState = await readStoryAiRuntimeState()\n  const runtimeMetadata = { 'X-QISSA-Runtime-AI': runtimeState.enabled ? 'enabled' : runtimeState.reason }\n  if (!runtimeState.enabled) {\n    return safeFallback(context, origin, runtimeState.reason, { ...providerMetadata(), ...runtimeMetadata })\n  }\n\n  if (!hasValidPrivacyConsent(input)) {\n    return json({ error: 'privacy_consent_required' }, 403, origin, { ...providerMetadata(), ...runtimeMetadata })\n  }\n"""

for path in ['supabase/functions/story-generate/index.ts', 'supabase/functions/story-generate/split-index.ts']:
    p = Path(path)
    text = p.read_text()
    old_import = "import { claimStoryGeneration, isInstallationId, type GenerationClaim } from './usage.ts'"
    if old_import not in text:
        raise SystemExit(f'missing usage import in {path}')
    text = text.replace(old_import, "import { claimStoryGeneration, isInstallationId, readStoryAiRuntimeState, type GenerationClaim } from './usage.ts'")
    old_constants = "const STORY_AI_PRODUCTION_ROLLOUT_ENABLED = true\nconst aiEnabledSetting = Deno.env.get('QISSA_AI_ENABLED')?.trim().toLowerCase()\nconst aiEnabled = STORY_AI_PRODUCTION_ROLLOUT_ENABLED && Boolean(openAiApiKey) && aiEnabledSetting === 'true'"
    if old_constants not in text:
        raise SystemExit(f'missing legacy env gate constants in {path}')
    text = text.replace(old_constants, "const STORY_AI_PRODUCTION_ROLLOUT_ENABLED = true")

    if path.endswith('split-index.ts'):
        old_gate = """  if (!aiEnabled || !openAiApiKey) {\n    return safeFallback(context, origin, !openAiApiKey ? 'api-key-missing' : 'ai-disabled', providerMetadata())\n  }\n\n  if (!hasValidPrivacyConsent(input)) {\n    return json({ error: 'privacy_consent_required' }, 403, origin, providerMetadata())\n  }\n"""
        if old_gate not in text:
            raise SystemExit('missing split request gate')
        text = text.replace(old_gate, runtime_gate)
    else:
        pattern = re.compile(
            r"  // Story AI is fail-closed behind a code-reviewed production rollout gate\.\n"
            r"  // Even QISSA_AI_ENABLED=true cannot enter the provider path while the rollout\n"
            r"  // gate is false\. Enabling paid generation therefore requires an explicit code change\.\n"
            r"  if \(!aiEnabled \|\| !openAiApiKey\) \{\n"
            r"    return safeFallback\(context, origin, !openAiApiKey \? 'api-key-missing' : 'ai-disabled'\)\n"
            r"  \}\n\n"
            r"  if \(!hasValidPrivacyConsent\(input\)\) \{\n"
            r"    // Model identifiers are operational metadata, not secrets\. Returning them\n"
            r"    // here lets operators verify the effective provider configuration without\n"
            r"    // spending a generation claim or sending story content to the provider\.\n"
            r"    return json\(\{ error: 'privacy_consent_required' \}, 403, origin, providerMetadata\(\)\)\n"
            r"  \}\n"
        )
        if not pattern.search(text):
            raise SystemExit('missing legacy request gate')
        text = pattern.sub(runtime_gate, text, count=1)
    p.write_text(text)

Path('docs/qissa/backend/migrations/20260915_000017_add_story_ai_runtime_flag.sql').write_text("""create table if not exists public.qissa_runtime_flags (\n  flag text primary key,\n  enabled boolean not null default false,\n  updated_at timestamptz not null default now(),\n  constraint qissa_runtime_flags_flag_format check (flag ~ '^[a-z0-9_]{1,64}$')\n);\n\nalter table public.qissa_runtime_flags enable row level security;\n\nrevoke all on table public.qissa_runtime_flags from public;\nrevoke all on table public.qissa_runtime_flags from anon;\nrevoke all on table public.qissa_runtime_flags from authenticated;\ngrant select, update on table public.qissa_runtime_flags to service_role;\n\ninsert into public.qissa_runtime_flags (flag, enabled)\nvalues ('story_ai_enabled', false)\non conflict (flag) do nothing;\n""")

must_replace(
    '.env.example',
    "# Story AI is fail-closed: the reviewed production rollout gate must be enabled in code AND this must be explicitly true.\n# QISSA_AI_ENABLED=false\n# OPENAI_ARCHITECT_MODEL=gpt-5.6-luna",
    "# Story AI is fail-closed: the reviewed production rollout gate must be ON and the service-role-only\n# qissa_runtime_flags.story_ai_enabled flag must be true. The legacy QISSA_AI_ENABLED secret is no longer used.\n# OPENAI_ARCHITECT_MODEL=gpt-5.6-luna",
)

must_replace(
    'scripts/check-story-ai-safety.mjs',
    "  \"Deno.env.get('QISSA_AI_ENABLED')\",\n  \"Deno.env.get('OPENAI_API_KEY')\",",
    "  'readStoryAiRuntimeState',\n  \"Deno.env.get('OPENAI_API_KEY')\",",
)

# Privacy regression still needs to prove consent is checked after all non-provider gates and before accounting/provider work.
p = Path('scripts/check-privacy-contract.mjs')
text = p.read_text()
old_privacy = """const aiDisabledGuardPosition = storyGenerate.indexOf('if (!aiEnabled || !openAiApiKey)')\nconst aiConsentGuardPosition = storyGenerate.indexOf('if (!hasValidPrivacyConsent(input))')\nconst usageClaimPosition = storyGenerate.indexOf('claimStoryGeneration(installationId)')\nrequireCondition(\n  /privacy_consent_required/.test(storyGenerate) &&\n    aiDisabledGuardPosition >= 0 &&\n    aiConsentGuardPosition > aiDisabledGuardPosition &&\n    usageClaimPosition > aiConsentGuardPosition,\n  'Real AI processing must require valid consent before usage is claimed or any provider work can begin.',\n)\n"""
new_privacy = """const aiDisabledGuardPosition = storyGenerate.indexOf('if (!STORY_AI_PRODUCTION_ROLLOUT_ENABLED || !openAiApiKey)')\nconst aiRuntimeGuardPosition = storyGenerate.indexOf('readStoryAiRuntimeState()')\nconst aiConsentGuardPosition = storyGenerate.indexOf('if (!hasValidPrivacyConsent(input))')\nconst usageClaimPosition = storyGenerate.indexOf('claimStoryGeneration(installationId)')\nrequireCondition(\n  /privacy_consent_required/.test(storyGenerate) &&\n    aiDisabledGuardPosition >= 0 &&\n    aiRuntimeGuardPosition > aiDisabledGuardPosition &&\n    aiConsentGuardPosition > aiRuntimeGuardPosition &&\n    usageClaimPosition > aiConsentGuardPosition,\n  'Real AI processing must require valid consent after fail-closed rollout gates and before usage is claimed or any provider work can begin.',\n)\n"""
if old_privacy not in text:
    raise SystemExit('missing privacy AI gate assertion')
p.write_text(text.replace(old_privacy, new_privacy))

p = Path('docs/qissa/backend/STORY_AI_SAFETY_PIPELINE.md')
text = p.read_text()
old = """The client must never receive an OpenAI API key. Configure these only as Supabase Edge Function secrets:\n\n- `OPENAI_API_KEY`\n- `QISSA_AI_ENABLED`\n- `OPENAI_STORY_MODEL`\n- `OPENAI_SAFETY_MODEL`\n\nAI remains disabled unless `QISSA_AI_ENABLED=true` and a non-empty `OPENAI_API_KEY` are both present.\n"""
new = """The client must never receive an OpenAI API key. Configure provider keys/models only as Supabase Edge Function secrets:\n\n- `OPENAI_API_KEY`\n- `OPENAI_ARCHITECT_MODEL`\n- `OPENAI_NARRATOR_MODEL`\n- `OPENAI_SAFETY_MODEL`\n- `OPENAI_NARRATOR_ESCALATION_MODEL` (optional; keep empty unless separately approved)\n\nStory AI is fail-closed behind two operator-controlled gates: the reviewed code rollout gate and the service-role-only `qissa_runtime_flags.story_ai_enabled` row. A non-empty `OPENAI_API_KEY` and valid parental privacy consent are also required before any provider call. Browser roles cannot read or change the runtime flag.\n"""
if old not in text:
    raise SystemExit('missing safety pipeline server config block')
p.write_text(text.replace(old, new))

p = Path('docs/qissa/14_QISSA_Closed_Beta_Scope_2026_09.md')
text = p.read_text()
text = text.replace(
    "- DEV / normal CI: `QISSA_AI_ENABLED=false` and deterministic Story Core/fallback tests;",
    "- DEV / normal CI: keep the service-role runtime flag `story_ai_enabled=false` and use deterministic Story Core/fallback tests;",
)
text = text.replace(
    "- there is **no project-wide/global daily cap in the current approved beta scope**; do not add one without a separate product decision;",
    "- launch-safety ceiling: **30 provider-eligible story requests project-wide per day**; this is an operational spend guard, not a product-facing family quota;",
)
text = text.replace(
    "Real Story AI remains intentionally disabled for the closed-beta hardening stage. Enabling it is a separate release decision and should be followed by a deliberately paid, manual acceptance run.",
    "Real Story AI remains fail-closed during routine hardening and CI. Production enablement is a separate release action through the service-role runtime flag and must be followed by a deliberately paid, manual acceptance run.",
)
p.write_text(text)

check = Path('scripts/check-story-cost-guard.mjs')
text = check.read_text()
text = text.replace(
    "const accountingOnlyMigration = read('docs/qissa/backend/migrations/20260914_000015_allow_story_generation_accounting_only_mode.sql')\nconst liveWorkflow",
    "const accountingOnlyMigration = read('docs/qissa/backend/migrations/20260914_000015_allow_story_generation_accounting_only_mode.sql')\nconst runtimeFlagMigration = read('docs/qissa/backend/migrations/20260915_000017_add_story_ai_runtime_flag.sql')\nconst liveWorkflow",
)
text = text.replace(
    "const disabledGuardPosition = storyIndex.indexOf('if (!aiEnabled || !openAiApiKey)')\nconst claimPosition = storyIndex.indexOf('claimStoryGeneration(installationId)')\nrequireCondition(\n  disabledGuardPosition >= 0 && claimPosition > disabledGuardPosition,\n  'AI-disabled or keyless operation must return deterministic fallback before any accounting claim or provider path.',\n)",
    "const disabledGuardPosition = storyIndex.indexOf('if (!STORY_AI_PRODUCTION_ROLLOUT_ENABLED || !openAiApiKey)')\nconst runtimeGuardPosition = storyIndex.indexOf('readStoryAiRuntimeState()')\nconst claimPosition = storyIndex.indexOf('claimStoryGeneration(installationId)')\nrequireCondition(\n  disabledGuardPosition >= 0 && runtimeGuardPosition > disabledGuardPosition && claimPosition > runtimeGuardPosition,\n  'Code/key and service-role runtime guards must fail closed before any accounting claim or provider path.',\n)",
)
old_gate = """requireCondition(\n  /STORY_AI_PRODUCTION_ROLLOUT_ENABLED = true/.test(storyIndex) &&\n    /STORY_AI_PRODUCTION_ROLLOUT_ENABLED = true/.test(splitStoryIndex) &&\n    /STORY_AI_PRODUCTION_ROLLOUT_ENABLED && Boolean\\(openAiApiKey\\) && aiEnabledSetting === 'true'/.test(storyIndex) &&\n    /STORY_AI_PRODUCTION_ROLLOUT_ENABLED && Boolean\\(openAiApiKey\\) && aiEnabledSetting === 'true'/.test(splitStoryIndex),\n  'Story AI rollout must be explicitly code-reviewed ON and still require QISSA_AI_ENABLED=true plus a configured key in both entrypoints.',\n)\n"""
new_gate = """requireCondition(\n  /STORY_AI_PRODUCTION_ROLLOUT_ENABLED = true/.test(storyIndex) &&\n    /STORY_AI_PRODUCTION_ROLLOUT_ENABLED = true/.test(splitStoryIndex) &&\n    /readStoryAiRuntimeState\\(\\)/.test(storyIndex) &&\n    /readStoryAiRuntimeState\\(\\)/.test(splitStoryIndex) &&\n    !/QISSA_AI_ENABLED/.test(storyIndex) &&\n    !/QISSA_AI_ENABLED/.test(splitStoryIndex),\n  'Story AI rollout must require the reviewed code gate, configured key and service-role runtime flag; the stale env opt-in must not remain an unmanageable production dependency.',\n)\n"""
if old_gate not in text:
    raise SystemExit('missing old rollout assertion')
text = text.replace(old_gate, new_gate)
anchor = """requireCondition(\n  /admin\\.rpc\\('qissa_claim_story_generation_budget'/.test(usage) &&\n    /p_daily_limit:\\s*DAILY_STORY_GENERATION_LIMIT/.test(usage) &&\n    /p_global_daily_limit:\\s*GLOBAL_DAILY_STORY_GENERATION_LIMIT/.test(usage) &&\n    /rate_limit_service_unavailable/.test(usage) &&\n    /rate_limit_check_failed/.test(usage),\n  'Story AI provider eligibility must still go through trusted server-side accounting and fail closed when accounting is unavailable.',\n)\n"""
if anchor not in text:
    raise SystemExit('missing accounting assertion anchor')
text = text.replace(anchor, anchor + """\nrequireCondition(\n  /from\\('qissa_runtime_flags'\\)/.test(usage) &&\n    /eq\\('flag', 'story_ai_enabled'\\)/.test(usage) &&\n    /runtime-config-unavailable/.test(usage) &&\n    /runtime-config-check-failed/.test(usage) &&\n    /runtime-disabled/.test(usage) &&\n    /X-QISSA-Runtime-AI/.test(storyIndex) &&\n    /X-QISSA-Runtime-AI/.test(splitStoryIndex),\n  'Story AI runtime rollout state must be service-role checked, observable without secrets, and fail closed on missing/failed config.',\n)\n\nrequireCondition(\n  /create table if not exists public\\.qissa_runtime_flags/.test(runtimeFlagMigration) &&\n    /enabled boolean not null default false/.test(runtimeFlagMigration) &&\n    /alter table public\\.qissa_runtime_flags enable row level security/.test(runtimeFlagMigration) &&\n    /revoke all on table public\\.qissa_runtime_flags from anon/.test(runtimeFlagMigration) &&\n    /revoke all on table public\\.qissa_runtime_flags from authenticated/.test(runtimeFlagMigration) &&\n    /grant select, update on table public\\.qissa_runtime_flags to service_role/.test(runtimeFlagMigration) &&\n    /values \\('story_ai_enabled', false\\)/.test(runtimeFlagMigration),\n  'Runtime Story AI flag storage must default OFF and remain inaccessible to browser roles.',\n)\n""")
text = text.replace(
    "console.log('Story AI launch guard passed: server spend is bounded, browser/server timeouts are aligned, usage remains atomic/private, and provider failures do not trigger blind paid retries.')",
    "console.log('Story AI launch guard passed: reviewed code + service-role runtime gates fail closed, spend is bounded, timeouts are aligned, and provider failures do not trigger blind paid retries.')",
)
check.write_text(text)
