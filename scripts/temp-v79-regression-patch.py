from pathlib import Path

path = Path(__file__).resolve().parents[1] / 'scripts/check-story-ai-safety.mjs'
text = path.read_text(encoding='utf-8')
old = "  'Return only NEW prose for insertion.',\n  'target_additional_words',"
new = "  'Return only NEW PRE-CHOICE prose for insertion.',\n  'forbidden_future_branch_material',\n  'Treat every choice.text, effect_summary, resolution_text and branch state_patch as forbidden content before the decision.',\n  'The inserted passage must remain equally true after either choice is selected.',\n  'confirmed_choice_bridge: context.episodeIndex === 2 && latestChoice',\n  'The rewritten opening must start AFTER that visible bridge with a genuinely new reaction, consequence, exchange or next action.',\n  'Do not copy, paraphrase, enlarge, restage, slow down, or replay any bridge action',\n  'target_additional_words',"
if text.count(old) != 1:
    raise SystemExit(f'expected one legacy insertion-contract fragment, found {text.count(old)}')
path.write_text(text.replace(old, new, 1), encoding='utf-8')
print('v79 regression contract updated')
