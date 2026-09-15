from pathlib import Path

ROOT = Path('.')

def replace_once(path: str, old: str, new: str) -> None:
    p = ROOT / path
    text = p.read_text(encoding='utf-8')
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected one match, found {count}')
    p.write_text(text.replace(old, new, 1), encoding='utf-8')

replace_once(
    'supabase/functions/story-state/index.ts',
    "      generation_source: episode.generationSource === 'safe-fallback' || episode.generationSource === 'openai-structured' || episode.generationSource === 'local'\n        ? episode.generationSource\n        : 'edge_story_agent',\n",
    "      // Keep the database operational source within its stable schema contract.\n      // The exact generation path remains preserved in domain_payload.generationSource.\n      generation_source: 'edge_story_agent',\n",
)

replace_once(
    'scripts/smoke-closed-beta-e2e-live.mjs',
    "    const syncOne = await invokeJson(stateEndpoint, {\n",
    "    // sync_generated may create the installation credential/profile before a later\n    // episode upsert fails, so cleanup must be armed before the request starts.\n    profileCreated = true\n    const syncOne = await invokeJson(stateEndpoint, {\n",
)
replace_once(
    'scripts/smoke-closed-beta-e2e-live.mjs',
    "    assert(syncOne.body?.ok === true, `${label}: episode 1 persistence failed`)\n    profileCreated = true\n",
    "    assert(syncOne.body?.ok === true, `${label}: episode 1 persistence failed`)\n",
)

p = ROOT / 'scripts/check-story-library-persistence.mjs'
text = p.read_text(encoding='utf-8')
old = "requireCondition(/client_session_id: identity\\.sessionId/.test(state), 'story-state must key rows by bedtime session ID.')\n"
new = "requireCondition(/client_session_id: identity\\.sessionId/.test(state), 'story-state must key rows by bedtime session ID.')\nrequireCondition(/generation_source: 'edge_story_agent'/.test(state) && /domain_payload: episode/.test(state), 'story-state must keep the database operational source stable while preserving exact generationSource in the domain payload.')\n"
if old not in text:
    raise SystemExit('story-state persistence assertion anchor not found')
p.write_text(text.replace(old, new, 1), encoding='utf-8')

p = ROOT / 'scripts/check-privacy-contract.mjs'
text = p.read_text(encoding='utf-8')
anchor = "const storyState = read('supabase/functions/story-state/index.ts')\n"
if anchor not in text:
    raise SystemExit('privacy contract storyState anchor not found')
# No behavior assertion needed here; cleanup regression belongs to the live E2E script and story library contract.

print('Story-state generation source and E2E cleanup fixes applied.')
