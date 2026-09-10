from pathlib import Path

story_path = Path('supabase/functions/story-generate/storySixMinuteEditorial.ts')
story = story_path.read_text(encoding='utf-8')

replacements = {
    'Теперь можно было идти обратно. ты и Нура гасили фонарики один за другим.':
        'Теперь можно было идти обратно. Вы с Нурой гасили фонарики один за другим.',
    'Нура и ты пожелали друг другу доброй ночи.':
        'Вы с Нурой пожелали друг другу доброй ночи.',
    'До ты донеслось, как из травы отвечает один-единственный «пи».':
        'Из травы до тебя донеслось одинокое «пи».',
    'У окна вы с Пико оказались.':
        'Вы с Пико подошли к окну.',
    'Пока они думали, серебряная точка снова мигнула два раза.':
        'Пока вы с Пико выбирали, серебряная точка снова мигнула два раза.',
    'На этот раз будто прямо им в ответ.':
        'На этот раз будто прямо вам в ответ.',
    'Они взяли фонарь вдвоём и перенесли к соседнему круглому стеклу. Фонарь подняли повыше.':
        'Вы с Пико взяли фонарь и перенесли к соседнему круглому стеклу. Там вы подняли его повыше.',
    'Через стекло капсуле вы с Пико помахали.':
        'Вы с Пико помахали капсуле через стекло.',
    'В большом окне отражались рисунки, Пико и ты, а рядом светилась бумажная звезда.':
        'В большом окне отражались рисунки, ты и Пико, а рядом светилась бумажная звезда.',
    'Потом ты и Пико пожелали друг другу доброй ночи.':
        'Потом вы с Пико пожелали друг другу доброй ночи.',
    'На кончике крыла появилась ещё одна звёздочка от тебя.':
        'На кончике крыла появилась ещё одна звёздочка из твоих рук.',
    'Тогда они не стали возвращать звёздочку на прежнее место.':
        'Тогда вы с Пико не стали возвращать звёздочку на прежнее место.',
    'Кота, клубнику и Луну закрепили маленькими прищепками рядом с тобой.':
        'Кота, клубнику и Луну закрепили маленькими прищепками под окном.',
    'Пико увидел кивок тебе.':
        'Пико заметил твой кивок.',
    'Они погасили свет в комнате. Звёздная птица не исчезла.':
        'Вы с Пико погасили свет в комнате. Звёздная птица не исчезла.',
    'Пико прикрыл свои светящиеся глаза почти до тонких полосок. ты и Пико пожелали друг другу доброй ночи.':
        'Пико прикрыл свои светящиеся глаза почти до тонких полосок. Вы с Пико пожелали друг другу доброй ночи.',
    'Лейку оставили возле фонтана рядом с тобой.':
        'Лейку оставили возле фонтана.',
    'Tun pochtasi «Lyumen»ni topdi Piko quvonib qo‘lini ko‘tardi: endi xatlar kerakli oynani aniq ko‘rib turardi.':
        'Tun pochtasi «Lyumen»ni topdi. Piko quvonib qo‘lini ko‘tardi: endi xatlar kerakli oynani aniq ko‘rib turardi.',
    'Piko oltin chiroq yonida turib, miltillashlarni sanardi. Piko kulib qo‘ydi.':
        'Piko oltin chiroq yonida turib, miltillashlarni sanardi va sekin kulib qo‘ydi.',
}

for old, new in replacements.items():
    if old not in story:
        raise SystemExit(f'missing editorial anchor: {old}')
    story = story.replace(old, new, 1)

story_path.write_text(story, encoding='utf-8')

prompt_path = Path('supabase/functions/story-generate/prompt.ts')
prompt = prompt_path.read_text(encoding='utf-8')
old = "? 'Write idiomatic Russian. Use {{HERO}} only in direct address or another position where the unchanged name needs no case ending and no gender agreement. Never place {{HERO}} after a Russian preposition or where declension is required; rephrase with second-person wording instead.'"
new = "? 'Write idiomatic Russian. Keep the child consistently in second-person narration when the child participates; do not switch the child into a third-person group pronoun. Use {{HERO}} only in direct address or another position where the unchanged name needs no case ending and no gender agreement. Never place {{HERO}} after a Russian preposition or where declension is required; rephrase with second-person wording instead.'"
if old not in prompt:
    raise SystemExit('Russian language-quality prompt anchor missing')
prompt = prompt.replace(old, new, 1)
prompt_path.write_text(prompt, encoding='utf-8')

matrix_path = Path('scripts/check-closed-beta-content-matrix.mjs')
matrix = matrix_path.read_text(encoding='utf-8')
anchor = "const nextDayReset = /^(?:утром\\b|на следующее утро\\b|tongda\\b|ertasi tongda\\b)/iu\n"
if anchor not in matrix:
    raise SystemExit('matrix next-day anchor missing')
insert = "const malformedRussianSecondPerson = /(?:\\b(?:до|у|к|ко|с|со|от|для|без|про|о|об|обо|около|возле|вокруг|перед|за|под|над|между)\\s+ты\\b|(?:^|[.!?…]\\s+)ты\\b)/u\n"
matrix = matrix.replace(anchor, anchor + insert, 1)
needle = "    assert(!genderedAgreement.test(field), `${label}: finalized Russian hero name is followed by gendered agreement.`)\n"
if needle not in matrix:
    raise SystemExit('matrix Russian finalization assertion anchor missing')
matrix = matrix.replace(
    needle,
    needle + "    assert(!malformedRussianSecondPerson.test(field), `${label}: malformed Russian second-person grammar detected after finalization.`)\n",
    1,
)
matrix_path.write_text(matrix, encoding='utf-8')

safety_check_path = Path('scripts/check-story-ai-safety.mjs')
check = safety_check_path.read_text(encoding='utf-8')
anchor = "  'Never place {{HERO}} after a Russian preposition or where declension is required',\n"
if anchor not in check:
    raise SystemExit('story prompt contract anchor missing')
check = check.replace(anchor, anchor + "  'Keep the child consistently in second-person narration when the child participates',\n", 1)
safety_check_path.write_text(check, encoding='utf-8')

print('child-first second-person polish applied')
