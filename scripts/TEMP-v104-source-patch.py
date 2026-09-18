#!/usr/bin/env python3
"""One-use audited source-only patch on isolated branch. No provider calls."""
from pathlib import Path
import subprocess

branch = 'fix/v104-blueprint-causality-offline-20260918'
assert subprocess.check_output(['git', 'branch', '--show-current'], text=True).strip() == branch
assert Path('audit/TEMP-v104-trigger.txt').read_text().strip() == 'APPLY-V104-PROVIDER-FREE-ONCE-20260918-R2'

def replace_once(path: str, old: str, new: str):
    p = Path(path)
    src = p.read_text(encoding='utf-8')
    count = src.count(old)
    assert count == 1, f'FAIL CLOSED: {path} anchor count={count}'
    p.write_text(src.replace(old, new, 1), encoding='utf-8')

architecture = 'supabase/functions/story-generate/story-architecture.ts'
replace_once(architecture,
    "  if (typeof value.decision_point !== 'string') errors.push('invalid_decision_point')",
    """  // Exact repeated internal plot steps cannot create a new causal result. Keep this deliberately
  // narrow: punctuation/case/space normalization only, no lexical overlap or prose heuristics.
  // Refrains belong in Narrator prose and are NOT checked here. No E2 regression.
  if (context.episodeIndex === 1 && Array.isArray(value.beats) && value.beats.every((beat) => typeof beat === 'string')) {
    const normalizedBeats = value.beats.map((beat) => beat.normalize('NFKC')
      .toLocaleLowerCase('en-US').replace(/[^\\p{L}\\p{N}]+/gu, ' ').replace(/\\s+/gu, ' ').trim())
    if (new Set(normalizedBeats).size !== normalizedBeats.length) errors.push('blueprint_duplicate_beat')
  }
  if (typeof value.decision_point !== 'string') errors.push('invalid_decision_point')""")
replace_once(architecture,
    'For ages 5-7 bedtime, the central goal must stay warm, social or playful.',
    'For ages 5-7 bedtime, a warm, non-threatening mystery, playful discovery or social goal is acceptable; do not default to a shy singer and group chorus without a distinctive causal problem.')
replace_once(architecture,
    'Keep the forest socially alive: let 2-3 memorable living forest characters act, speak, react, joke or help.',
    'Keep the forest alive without a cast quota: {{HERO}} and one active companion can carry the plot; an incidental unnamed animal should appear only when its action changes the central situation. Let characters act, react, joke or discover something consequential.')
replace_once('package.json',
    'node scripts/check-story-provider-incomplete.mjs && node scripts/check-story-debut-cast-and-severe-repair.mjs',
    'node scripts/check-story-provider-incomplete.mjs && node scripts/check-story-debut-cast-and-severe-repair.mjs && node scripts/check-story-blueprint-repeat-gate.mjs')
replace_once('scripts/check-story-ai-split.mjs',
    "  'central goal must stay warm, social or playful',",
    "  'a warm, non-threatening mystery, playful discovery or social goal is acceptable',")
print('V104 SOURCE PATCH PASS: 5 exact anchors, 4 existing files, no provider or DB mutation.')
