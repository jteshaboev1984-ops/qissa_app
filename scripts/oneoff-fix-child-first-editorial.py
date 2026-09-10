from pathlib import Path
import re

story_path = Path('supabase/functions/story-generate/storySixMinuteEditorial.ts')
text = story_path.read_text(encoding='utf-8')

# Keep one consistent native term for firefly in Uzbek.
text = text.replace("og‘onak", "yorug‘qo‘ng‘iz")

start = text.index('const childFirstStories:')
prefix, body = text[:start], text[start:]

# Russian hero names can be arbitrary and cannot safely be declined by a literal
# token replacement. Narrate the selected hero as "ты/тебе/тебя" and reserve
# {{HERO}} for direct address, where the unchanged name is grammatically safe.
def convert_ru(content: str) -> str:
    replacements = [
        ('По выбору {{HERO}}', 'По твоему выбору'),
        ('У {{HERO}} и робота Пико', 'У тебя и у робота Пико'),
        ('У {{HERO}}', 'У тебя'),
        ('у {{HERO}}', 'у тебя'),
        ('рядом с {{HERO}}', 'рядом с тобой'),
        ('Рядом с {{HERO}}', 'Рядом с тобой'),
        ('вместе с {{HERO}}', 'вместе с тобой'),
        ('Вместе с {{HERO}}', 'Вместе с тобой'),
        ('перед {{HERO}}', 'перед тобой'),
        ('Перед {{HERO}}', 'Перед тобой'),
        ('для {{HERO}}', 'для тебя'),
        ('Для {{HERO}}', 'Для тебя'),
        ('от {{HERO}}', 'от тебя'),
        ('От {{HERO}}', 'От тебя'),
        ('к {{HERO}}', 'к тебе'),
        ('К {{HERO}}', 'К тебе'),
        ('за {{HERO}}', 'за тобой'),
        ('За {{HERO}}', 'За тобой'),
        ('с {{HERO}}', 'с тобой'),
        ('С {{HERO}}', 'С тобой'),
        ('в руках {{HERO}}', 'в твоих руках'),
        ('В руках {{HERO}}', 'В твоих руках'),
        ('у ботинка {{HERO}}', 'у твоего ботинка'),
        ('из лейки {{HERO}}', 'из твоей лейки'),
        ('из ладони {{HERO}}', 'из твоей ладони'),
        ('из рук {{HERO}}', 'из твоих рук'),
        ('смех {{HERO}}', 'твой смех'),
        ('Смех {{HERO}}', 'Твой смех'),
        ('взгляд {{HERO}}', 'твой взгляд'),
        ('Взгляд {{HERO}}', 'Твой взгляд'),
        ('ладони {{HERO}}', 'твои ладони'),
        ('Ладони {{HERO}}', 'Твои ладони'),
        ('пальцы {{HERO}}', 'твои пальцы'),
        ('Пальцы {{HERO}}', 'Твои пальцы'),
        ('кивок {{HERO}}', 'твой кивок'),
        ('Кивок {{HERO}}', 'Твой кивок'),
        ('по мнению {{HERO}}', 'по твоему мнению'),
        ('показала {{HERO}}', 'показала тебе'),
        ('показал {{HERO}}', 'показал тебе'),
        ('подмигнула {{HERO}}', 'подмигнула тебе'),
        ('мигнул {{HERO}}', 'мигнул тебе'),
        ('посмотрел на {{HERO}}', 'посмотрел на тебя'),
        ('посмотрела на {{HERO}}', 'посмотрела на тебя'),
        ('попросил {{HERO}}', 'попросил тебя'),
        ('попросила {{HERO}}', 'попросила тебя'),
        ('повела {{HERO}}', 'повела тебя'),
        ('повёл {{HERO}}', 'повёл тебя'),
        ('ждал {{HERO}}', 'ждал тебя'),
        ('ждала {{HERO}}', 'ждала тебя'),
        ('помахали {{HERO}} и Пико', 'вы с Пико помахали'),
        ('оказались {{HERO}} и Пико', 'вы с Пико оказались'),
    ]
    for old, new in replacements:
        content = content.replace(old, new)

    # Any nominative-safe remainder becomes second person. Previous editorial
    # work already removed gendered past-tense predicates around the hero token.
    content = content.replace('\n\n{{HERO}}', '\n\nТы')
    if content.startswith('{{HERO}}'):
        content = 'Ты' + content[len('{{HERO}}'):]
    content = content.replace('{{HERO}}', 'ты')

    # Restore one natural direct-address use of the actual selected name in each
    # Episode 1 and each Episode 2 branch. This keeps personalization without
    # requiring Russian name declension.
    direct = [
        ('— Как поведём всех домой?', '— {{HERO}}, как поведём всех домой?'),
        ('— С чего начнём?', '— {{HERO}}, с чего начнём?'),
        ('— Ну что, — спросил Пико, — каким знаком позовём нашу ночную почту домой?', '— {{HERO}}, каким знаком позовём нашу ночную почту домой? — спросил Пико.'),
        ('— Смотрите! Фонарик всё равно показывает нам путь, только снизу!', '— {{HERO}}, смотри! Фонарик всё равно показывает нам путь, только снизу!'),
        ('— У нашей песни уже есть берёза и ручей, — сказал Пух.', '— {{HERO}}, у нашей песни уже есть берёза и ручей, — сказал Пух.'),
        ('— Открывается!', '— {{HERO}}, открывается!'),
        ('— Моя корона! — пискнула Лило', '— {{HERO}}, моя корона! — пискнула Лило'),
        ('— Один, два… один, два. Она отвечает нам.', '— {{HERO}}, смотри: один, два… один, два. Она отвечает нам.'),
        ('— Важная деталь, — сказал он.', '— {{HERO}}, важная деталь, — сказал он.'),
    ]
    for old, new in direct:
        content = content.replace(old, new)
    return content

# Only transform ru template literals inside childFirstStories and leave Uzbek
# and older non-beta helpers untouched.
def ru_repl(match: re.Match) -> str:
    return 'ru: `' + convert_ru(match.group(1)) + '`,'

body = re.sub(r'ru: `([\s\S]*?)`,', ru_repl, body)
text = prefix + body

# Replace the six bridge pairs in story order. Each bridge is complete,
# child-facing, 30-45 words, and intentionally below 320 characters.
bridge_pairs = [
    (
        'Ты зажигаешь первый бумажный фонарик. Из него вылетает сонный мотылёк и смешно чихает. Пух прыскает от смеха. Второй фонарик появляется у лужи-луны, третий — у берёзы. Между деревьями складывается золотая дорожка, и друзья отправляются к первому дому.',
        '{{HERO}} birinchi qog‘oz chiroqni yoqdi. Ichidan uyqusi kelgan kapalak uchib chiqib, kulgili aksirdi. Puf kulib yubordi. Ikkinchi chiroq oy shaklidagi ko‘lmak yoniga, uchinchisi qayin oldiga osildi. Daraxtlar orasida oltinrang yo‘l paydo bo‘lib, do‘stlar birinchi uy tomon yurdi.'
    ),
    (
        'Ты хлопаешь в ладоши: раз, два, пауза. Нура отвечает двумя нотами, Пух тянет смешное «пи-и», а светлячки мигают в такт. Белка стучит двумя орехами. Через минуту у компании уже есть короткая дорожная песенка, и все отправляются домой.',
        '{{HERO}} kaftini urib ritm boshladi: bir, ikki, tanaffus. Nura ikki nota bilan javob berdi, Puf kulgili «pi-i» dedi, yorug‘qo‘ng‘izlar esa ritmga mos miltilladi. Olmaxon ikki yong‘oqni «toq-toq» urdi. Bir daqiqada yo‘l qo‘shig‘i tayyor bo‘lib, do‘stlar uy tomon yurdi.'
    ),
    (
        'Ты льёшь немного воды у корней самого маленького бутона. На стебле появляется блестящая капля и ползёт вверх, как бусинка. Бутон раскрывает первый серебряный лепесток. Мирай стучит усиками по раковине, а Лило шепчет: «Цветок поздоровался!»',
        '{{HERO}} eng kichik g‘uncha ildiziga ozgina suv quydi. Poyada yaltiragan tomchi paydo bo‘lib, munchoqdek tepaga ko‘tarildi. G‘uncha birinchi kumush gulbargini ochdi. Miroy qobig‘ini mo‘ylovlari bilan taqillatdi, Lilo esa: «Gul salom berdi!» deb pichirladi.'
    ),
    (
        'Ты открываешь чашу возле закрытых цветов. Светлячки вылетают один за другим, и один садится Лило на макушку. Ближайший бутон поворачивается к огоньку и раскрывает два серебряных лепестка. Остальные светлячки летят дальше вдоль клумбы.',
        '{{HERO}} kosani yopiq gullar yonida ochdi. Yorug‘qo‘ng‘izlar bittadan uchib chiqdi, bittasi Lilo boshiga qo‘ndi. Eng yaqin g‘uncha yorug‘lik tomonga burilib, ikki kumush gulbargini ochdi. Qolgan yorug‘qo‘ng‘izlar gulzor bo‘ylab oldinga uchdi.'
    ),
    (
        'Ты ставишь золотой фонарь у круглого окна. Пико выключает соседнюю лампу, и тёплый круг на стекле становится ярче. Серебряная капсула мигает один раз, потом два и поворачивает к этому огоньку. Ночная почта нашла «Люмен».',
        '{{HERO}} oltin chiroqni dumaloq oyna yoniga qo‘ydi. Piko qo‘shni chiroqni o‘chirdi va oynadagi iliq doira yanada aniq ko‘rindi. Kumush kapsula bir marta, keyin ikki marta miltillab, shu nur tomonga burildi. Tun pochtasi «Lyumen»ni topdi.'
    ),
    (
        'Ты приклеиваешь к стеклу светящиеся звёздочки: четыре становятся крылом, ещё три — хвостом. Одна звезда снова прилипает Пико ко лбу. Когда птица готова, серебряная капсула мигает и поворачивает к рисунку. Новый знак замечен.',
        '{{HERO}} oynaga yorug‘ yulduzchalarni yopishtirdi: to‘rttasi qanot, yana uchtasi dum bo‘ldi. Bitta yulduz yana Piko peshonasiga yopishdi. Qush tayyor bo‘lganda, kumush kapsula miltillab, shu rasm tomonga burildi. Yangi belgi ko‘rindi.'
    ),
]

# Replace all six resolution blocks deterministically in their existing order.
pattern = re.compile(r"resolution: \{\n\s+ru: `([\s\S]*?)`,\n\s+uz: `([\s\S]*?)`,\n\s+\},")
matches = list(pattern.finditer(text[text.index('const childFirstStories:'):]))
if len(matches) != 6:
    raise SystemExit(f'expected 6 child-first resolution blocks, found {len(matches)}')

# Rebuild with a callback so offsets stay correct.
idx = 0
def bridge_repl(match: re.Match) -> str:
    global idx
    ru, uz = bridge_pairs[idx]
    idx += 1
    indent = '        '
    return f"resolution: {{\n          ru: `{ru}`,\n          uz: `{uz}`,\n        }},"

story_start = text.index('const childFirstStories:')
head = text[:story_start]
tail = pattern.sub(bridge_repl, text[story_start:], count=6)
if idx != 6:
    raise SystemExit(f'replaced {idx} bridges, expected 6')
text = head + tail

# Ensure the Russian child-first templates now expose the raw hero token only as
# a direct-address name: — {{HERO}}, ...
child_tail = text[text.index('const childFirstStories:'):]
for m in re.finditer(r'ru: `([\s\S]*?)`,', child_tail):
    ru = m.group(1)
    unsafe = ru.replace('— {{HERO}},', '')
    if '{{HERO}}' in unsafe:
        raise SystemExit('unsafe RU hero token remains outside direct address')

story_path.write_text(text, encoding='utf-8')

# Harden the deterministic duration gate to catch sanitizer truncation and keep
# the bridge aligned with the future provider contract.
duration_path = Path('scripts/report-bedtime-duration.mjs')
duration = duration_path.read_text(encoding='utf-8')
duration = duration.replace('const MIN_RESOLUTION_WORDS = 50\n', 'const MIN_RESOLUTION_WORDS = 30\nconst MAX_RESOLUTION_WORDS = 45\n')
duration = duration.replace('const RESOLUTION_TEXT_SANITIZER_LIMIT = 400\n', 'const RESOLUTION_TEXT_EDITORIAL_LIMIT = 320\n')
duration = duration.replace(
    "          resolutionText.length < RESOLUTION_TEXT_SANITIZER_LIMIT,\n          `${scenario}: resolution reached the ${RESOLUTION_TEXT_SANITIZER_LIMIT}-character sanitizer ceiling and may have been clipped mid-sentence.`,",
    "          resolutionText.length <= RESOLUTION_TEXT_EDITORIAL_LIMIT,\n          `${scenario}: resolution is ${resolutionText.length} characters; child-first bridge limit is ${RESOLUTION_TEXT_EDITORIAL_LIMIT}.`,"
)
duration = duration.replace(
    "        assert(\n          resolutionWords >= MIN_RESOLUTION_WORDS,\n          `${scenario}: post-choice resolution is only ${resolutionWords} words; deterministic beta requires at least ${MIN_RESOLUTION_WORDS} meaningful words before episode 2.`,\n        )",
    "        assert(\n          resolutionWords >= MIN_RESOLUTION_WORDS && resolutionWords <= MAX_RESOLUTION_WORDS,\n          `${scenario}: post-choice bridge is ${resolutionWords} words; child-first target is ${MIN_RESOLUTION_WORDS}-${MAX_RESOLUTION_WORDS}.`,\n        )\n        assert(\n          /[.!?…]$/u.test(resolutionText.trim()),\n          `${scenario}: post-choice bridge must end with complete terminal punctuation.`,\n        )"
)
duration_path.write_text(duration, encoding='utf-8')

# Future provider generation must use raw names only where no Russian declension
# is required. Make this explicit in prompt + CI.
prompt_path = Path('supabase/functions/story-generate/prompt.ts')
prompt = prompt_path.read_text(encoding='utf-8')
old = "? 'Write idiomatic Russian. Because {{HERO}} may become a girl, boy, animal, magical hero or custom name, avoid nearby grammar that assumes the hero is masculine or feminine whenever possible.'"
new = "? 'Write idiomatic Russian. Use {{HERO}} only in direct address or another position where the unchanged name needs no case ending and no gender agreement. Never place {{HERO}} after a Russian preposition or where declension is required; rephrase with second-person wording instead.'"
if old not in prompt:
    raise SystemExit('old Russian provider hero rule missing')
prompt = prompt.replace(old, new, 1)
old_sys = "    'For Russian, keep grammar around {{HERO}} gender-neutral where possible because the token can resolve to any hero type or custom name.',"
new_sys = "    'For Russian, use {{HERO}} only in direct address or another grammatically invariant position. Never place the raw token after a preposition or where case declension or gender agreement is required; rephrase with second-person wording instead.',"
if old_sys not in prompt:
    raise SystemExit('old Russian system hero rule missing')
prompt = prompt.replace(old_sys, new_sys, 1)
prompt_path.write_text(prompt, encoding='utf-8')

check_path = Path('scripts/check-story-ai-safety.mjs')
check = check_path.read_text(encoding='utf-8')
check = check.replace("  'keep grammar around {{HERO}} gender-neutral where possible',", "  'Use {{HERO}} only in direct address or another position where the unchanged name needs no case ending',\n  'Never place {{HERO}} after a Russian preposition or where declension is required',\n  'For Russian, use {{HERO}} only in direct address or another grammatically invariant position.',")
check_path.write_text(check, encoding='utf-8')

# Update canonical docs to match the enforceable Russian rule and 30-45 word bridge.
editorial_path = Path('docs/qissa/ai/05_CHILD_FIRST_CLOSED_BETA_EDITORIAL.md')
editorial = editorial_path.read_text(encoding='utf-8')
editorial = editorial.replace(
    "Russian prose around `{{HERO}}` must therefore avoid grammatical constructions that assume the hero's gender, including future provider output.",
    "Russian prose must use `{{HERO}}` only in direct address or another grammatically invariant position. Do not place the raw token where Russian case declension or gender agreement is required; rephrase with second-person wording instead. This applies to deterministic and future provider output."
)
editorial_path.write_text(editorial, encoding='utf-8')

spec_path = Path('docs/qissa/ai/01_STORY_AGENT_SPEC.md')
spec = spec_path.read_text(encoding='utf-8')
spec = spec.replace(
    '- Russian prose around `{{HERO}}` should avoid assuming hero gender; Uzbek must read as native Uzbek rather than a line-by-line Russian translation.',
    '- Russian prose uses `{{HERO}}` only where the unchanged name is grammatically invariant (prefer direct address); elsewhere rephrase with second-person wording rather than requiring name declension or gender agreement. Uzbek must read as native Uzbek rather than a line-by-line Russian translation.'
)
spec_path.write_text(spec, encoding='utf-8')

print('child-first editorial blockers fixed')
