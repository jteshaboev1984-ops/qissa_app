from pathlib import Path


def replace_once(path: str, old: str, new: str):
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected exactly one match, got {count}: {old[:140]!r}')
    p.write_text(text.replace(old, new, 1))

prompt = 'supabase/functions/story-generate/prompt.ts'
replace_once(
    prompt,
    "    'Be strict about humiliation, conditional love, identity stereotypes, ideological or religious promotion, adult themes, excessive fear, and unresolved bedtime tension.',\n    'A gentle mystery or ordinary challenge is acceptable only when it resolves safely and calmly.',",
    "    'Be strict about humiliation, conditional love, identity stereotypes, ideological or religious promotion, adult themes, excessive fear, and unresolved bedtime tension.',\n"
    "    'For excessive_fear, judge the intensity and nature of frightening content, not merely whether a low-stakes story goal is unfinished at an interactive Episode 1 choice. Mark excessive_fear for age-inappropriate sustained fear, panic, threatening pursuit, abandonment, trapping, serious injury, frightening danger, or similarly distressing material. Ordinary evening darkness, rain, a moment of worry, a harmless mistake, a gentle mystery, or uncertainty among trusted friendly characters is not excessive fear by itself.',\n"
    "    'A gentle mystery or ordinary challenge is acceptable when it stays low-stakes and emotionally safe. In technical Episode 1 it may pause at the child decision point; use the appended session contract to judge whether an immediate branch keeps the experience safe.',",
)

openai = 'supabase/functions/story-generate/openai.ts'
replace_once(
    openai,
    "      'Do NOT set bedtime_overstimulation merely because story_text pauses for the child choice, because Episode 2 continues the same story, or because nextEpisodePreview gently signals continuation.',\n      'Set bedtime_overstimulation when the material is genuinely over-activating for bedtime, contains an alarming/startling cliffhanger, or leaves material fear/tension unresolved even after an available immediate resolution branch.',\n      'A gentle curiosity loop, quiet mystery, ordinary uncertainty, or calm decision point is acceptable when every immediate branch lowers or safely carries the tension forward.',",
    "      'Do NOT set bedtime_overstimulation merely because story_text pauses for the child choice, because Episode 2 continues the same story, or because nextEpisodePreview gently signals continuation.',\n"
    "      'Do NOT set excessive_fear merely because the central low-stakes goal is not fully solved before the child chooses. excessive_fear is about frightening content intensity: sustained panic, threatening pursuit, abandonment, trapping, serious injury, frightening danger, or comparable age-inappropriate distress.',\n"
    "      'Ordinary evening darkness, rain, a brief worry, a harmless mistake, a friendly character asking for help, or uncertainty among trusted companions is not excessive_fear by itself when no real threat is present.',\n"
    "      'Set bedtime_overstimulation when the material is genuinely over-activating for bedtime, contains an alarming/startling cliffhanger, or leaves material fear/tension unresolved even after an available immediate resolution branch.',\n"
    "      'A gentle curiosity loop, quiet mystery, ordinary uncertainty, or calm decision point is acceptable when every immediate branch lowers or safely carries the tension forward.',",
)

arch = 'supabase/functions/story-generate/story-architecture.ts'
replace_once(
    arch,
    "      ? 'For cozy_forest, make living forest characters drive the story. Prefer friendly animals, birds, insects or other clearly living forest residents with a small desire, relationship, funny misunderstanding, discovery or need for help. Streams, stones, leaves, weather and paths may support the scene, but should not become the main protagonist or a maintenance task by themselves. Avoid plots centered on clearing water, repairing a path, moving debris or fixing nature unless that action directly serves a living character goal.'",
    "      ? 'For cozy_forest, make living forest characters drive the story. Prefer friendly animals, birds, insects or other clearly living forest residents with a small desire, relationship, funny misunderstanding, discovery or need for help. Streams, stones, leaves, weather and paths may support the scene, but should not become the main protagonist or a maintenance task by themselves. Avoid plots centered on clearing water, repairing a path, moving debris or fixing nature unless that action directly serves a living character goal. For ages 5-7 bedtime, prefer warm social or playful stakes over being lost alone, separation, pursuit, injury, rescue from danger, or darkness used as a threat.'",
)

check = 'scripts/check-story-ai-split.mjs'
p = Path(check)
text = p.read_text()
marker = "  'make living forest characters drive the story',\n  'For Uzbek ages 5-7, prefer common natural Uzbek words',"
if text.count(marker) != 1:
    raise SystemExit('architecture check marker mismatch')
text = text.replace(marker, "  'make living forest characters drive the story',\n  'prefer warm social or playful stakes',\n  'For Uzbek ages 5-7, prefer common natural Uzbek words',", 1)
marker2 = "requireFragments('Episode 2 text repair provider', repairProvider, ["
addition = """requireFragments('split safety session contract', repairProvider, [
  'Do NOT set excessive_fear merely because the central low-stakes goal is not fully solved before the child chooses',
  'Ordinary evening darkness, rain, a brief worry',
  'sustained panic, threatening pursuit, abandonment, trapping, serious injury',
])

""" + marker2
if text.count(marker2) != 1:
    raise SystemExit('split safety insert marker mismatch')
p.write_text(text.replace(marker2, addition, 1))
