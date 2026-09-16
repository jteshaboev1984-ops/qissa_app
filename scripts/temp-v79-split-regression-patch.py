from pathlib import Path

path = Path(__file__).resolve().parents[1] / 'scripts/check-story-ai-split.mjs'
text = path.read_text(encoding='utf-8')
old = "  'Never restate, list, paraphrase, preview, or name either choice action inside story_text',"
new = "  'Never restate, list, paraphrase, preview, rehearse, begin performing, partially perform, or show the payoff of either choice action inside story_text',\n  'Every pre-choice beat must remain true whichever choice is selected.',\n  'Every beat before that decision must be branch-neutral: do not resolve, rehearse, start carrying out, partially carry out, or show the visible payoff of either branch before the child chooses.',\n  'The first planned beat must be new: a reaction, consequence, exchange or next action caused by the bridge result.',\n  'The opening paragraph must contain a genuinely new reaction, consequence, exchange or next action caused by that result.',\n  'Do not copy, paraphrase, enlarge, slow down, restage, or replay any physical action',"
if text.count(old) != 1:
    raise SystemExit(f'expected one legacy split boundary fragment, found {text.count(old)}')
path.write_text(text.replace(old, new, 1), encoding='utf-8')
print('v79 split regression contract updated')
