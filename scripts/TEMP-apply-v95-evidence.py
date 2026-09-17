from pathlib import Path
import subprocess

# TDD: prove the new regression detects absent production wiring before applying it.
red = subprocess.run(['node', 'scripts/check-story-humiliation-evidence.mjs'], capture_output=True, text=True)
assert red.returncode != 0 and ('production must derive diagnostic' in red.stderr or 'AssertionError' in red.stderr), 'unexpected pre-patch regression result'
print('EXPECTED RED: production humiliation evidence routing is not yet wired')

p = Path('supabase/functions/story-generate/openai.ts')
s = p.read_text()
anchor = "const safetyVerdictContract = ["
assert s.count(anchor) == 1
instruction = """const humiliationEvidenceInstruction = [
  'Humiliation is targeted mockery, belittling, shaming or demeaning treatment of a character, including narrator framing and branch outcomes. A harmless shared laugh, surprise or an ordinary mistake alone is not evidence of humiliation; laughter directed at a character to shame or ridicule them is.',
  'If humiliation=true, notes MUST contain exactly one item beginning humiliation_evidence: followed by an exact 8-160 character excerpt from ONE child-visible field that supports the flag. Copy the excerpt verbatim, never paraphrase, invent, or concatenate across story and choices.',
  'If you cannot identify a supporting excerpt but still consider the case uncertain, keep the conservative flag and set humiliation_evidence:UNAVAILABLE. This is a missing-evidence marker, not supporting evidence. If humiliation=false, include no humiliation_evidence item.',
].join(' ')

"""
s = s.replace(anchor, instruction + anchor)
anchor = '`${prompts.system} ${safetyVerdictContract} ${safetySessionContract(context)}${retryInstruction}`'
assert s.count(anchor) == 1
s = s.replace(anchor, '`${prompts.system} ${safetyVerdictContract} ${humiliationEvidenceInstruction} ${safetySessionContract(context)}${retryInstruction}`')
p.write_text(s)

p = Path('supabase/functions/story-generate/split-index.ts')
s = p.read_text()
anchor = "import { candidateLanguageMismatchFieldCodes } from './language-diagnostics.ts'"
assert s.count(anchor) == 1
s = s.replace(anchor, anchor + "\nimport { locateHumiliationEvidence } from './humiliation-evidence.ts'")
anchor = '    const safety = combineSafety(ruleFlags, evaluation, moderationForSafety)'
assert s.count(anchor) == 1
s = s.replace(anchor, anchor + "\n    const humiliationEvidenceField = locateHumiliationEvidence(candidate, evaluation)")
anchor = "trace.push(`semantic-safety:${flags.join(',') || safety.required_action}${fearDetail ? `:${fearDetail}` : ''}[${sourceDetail}]`)"
assert s.count(anchor) == 1
s = s.replace(anchor, "trace.push(`semantic-safety:${flags.join(',') || safety.required_action}${fearDetail ? `:${fearDetail}` : ''}[${sourceDetail}${evaluation.flags.humiliation ? `;humiliation_evidence=${humiliationEvidenceField}` : ''}]`)")
p.write_text(s)

p = Path('package.json')
s = p.read_text()
anchor = 'node scripts/check-story-repair-retry-word-budget.mjs",'
assert s.count(anchor) == 1
s = s.replace(anchor, 'node scripts/check-story-repair-retry-word-budget.mjs && node scripts/check-story-humiliation-evidence.mjs",')
p.write_text(s)

subprocess.run(['node','scripts/check-story-humiliation-evidence.mjs'], check=True)
subprocess.run(['node','scripts/check-story-safety-verdict.mjs'], check=True)
subprocess.run(['node','scripts/check-story-ai-safety.mjs'], check=True)
print('V95 PATCH GREEN: exact anchors, evidence-only diagnostics and prior safety regressions passed; zero provider calls')
