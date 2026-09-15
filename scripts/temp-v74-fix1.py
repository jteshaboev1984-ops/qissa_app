from pathlib import Path

path = Path('supabase/functions/story-generate/fallback.ts')
text = path.read_text()

old = "const identitySafeContinuationText = (context: NormalizedStoryContext): string => {\n  const names = context.recurringCharacters.slice(0, 3).join(', ')\n"
new = "const identitySafeContinuationText = (context: NormalizedStoryContext): string => {\n  const names = context.recurringCharacters.slice(0, 3).join(', ')\n  const choiceId = context.choiceHistory.at(-1)?.choice_id ?? ''\n  const isChoiceA = choiceId === 'choice-a' || choiceId === 'path_a'\n  const branchBeat = context.language === 'ru'\n    ? (isChoiceA ? 'Первый результат выбранного действия уже заметен рядом.' : 'Результат другого выбранного действия уже заметен рядом.')\n    : context.language === 'uz'\n      ? (isChoiceA ? 'Tanlangan ishning birinchi natijasi yonida ko‘rinib turardi.' : 'Boshqa tanlangan ishning natijasi ham yonida ko‘rinib turardi.')\n      : (isChoiceA ? 'Таңдалған істің алғашқы нәтижесі қасында көрініп тұрды.' : 'Басқа таңдалған істің нәтижесі де қасында көрініп тұрды.')\n"
if old not in text:
    raise SystemExit('identity-safe continuation helper anchor missing')
text = text.replace(old, new, 1)

text = text.replace(
    "return `{{HERO}} продолжает вечернюю историю с того же места. ${names ? `Рядом остаются знакомые друзья: ${names}.` : 'Рядом остаются уже знакомые друзья.'} Сделанный несколько минут назад выбор уже дал первый результат,",
    "return `{{HERO}} продолжает вечернюю историю с того же места. ${branchBeat} ${names ? `Рядом остаются знакомые друзья: ${names}.` : 'Рядом остаются уже знакомые друзья.'} Сделанный несколько минут назад выбор уже дал первый результат,",
    1,
)
text = text.replace(
    "return `{{HERO}} kechki hikoyani aynan to‘xtagan joyidan davom ettirdi. ${names ? `Tanish do‘stlar ham shu yerda edi: ${names}.` : 'Oldindan tanish do‘stlar ham shu yerda edi.'} Bir necha daqiqa oldin qilingan tanlov",
    "return `{{HERO}} kechki hikoyani aynan to‘xtagan joyidan davom ettirdi. ${branchBeat} ${names ? `Tanish do‘stlar ham shu yerda edi: ${names}.` : 'Oldindan tanish do‘stlar ham shu yerda edi.'} Bir necha daqiqa oldin qilingan tanlov",
    1,
)
text = text.replace(
    "return `{{HERO}} кешкі оқиғаны дәл тоқтаған жерінен жалғастырды. ${names ? `Таныс достар да осында еді: ${names}.` : 'Бұрыннан таныс достар да осында еді.'} Бірнеше минут бұрын жасалған таңдау",
    "return `{{HERO}} кешкі оқиғаны дәл тоқтаған жерінен жалғастырды. ${branchBeat} ${names ? `Таныс достар да осында еді: ${names}.` : 'Бұрыннан таныс достар да осында еді.'} Бірнеше минут бұрын жасалған таңдау",
    1,
)

old_patch = "const identitySafeContinuationPatch = (): CandidatePatch => ({\n  last_event: 'continued_saved_choice',\n  new_friend: null,\n  hero_trait: 'kind_and_attentive',\n  open_arc: null,\n  relationship_updates: [],\n  canon_updates: [],\n})\n"
new_patch = "const identitySafeContinuationPatch = (context: NormalizedStoryContext): CandidatePatch => {\n  const choiceId = context.choiceHistory.at(-1)?.choice_id ?? 'continued_saved_choice'\n  return {\n    last_event: `continued_${choiceId}`,\n    new_friend: null,\n    hero_trait: 'kind_and_attentive',\n    open_arc: null,\n    relationship_updates: [],\n    canon_updates: [{ key: 'remembered_choice', value: choiceId }],\n  }\n}\n"
if old_patch not in text:
    raise SystemExit('identity-safe patch helper anchor missing')
text = text.replace(old_patch, new_patch, 1)
text = text.replace('state_patch: identitySafeContinuationPatch(),', 'state_patch: identitySafeContinuationPatch(context),', 1)
path.write_text(text)
print('v74 branch-specific identity-safe fallback fixed')
