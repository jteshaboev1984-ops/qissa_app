from pathlib import Path


def replace_once(path: str, old: str, new: str):
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{path}: expected exactly one match, got {count}: {old[:180]!r}')
    p.write_text(text.replace(old, new, 1))


def replace_localized_value(block: str, anchor: str, language: str, new_value: str) -> str:
    anchor_pos = block.index(anchor)
    token = f"{language}: `"
    lang_pos = block.index(token, anchor_pos)
    start = lang_pos + len(token)
    end = block.index('`,', start)
    return block[:start] + new_value.strip('\n') + block[end:]


story = Path('supabase/functions/story-generate/storySixMinuteEditorial.ts')
text = story.read_text()
collection = text.index('const childFirstStories: Record<ClosedBetaWorld, ChildFirstStory> = {')
cozy_start = text.index('  cozy_forest: {', collection)
cozy_end = text.index('  magic_garden: {', cozy_start)
cozy = text[cozy_start:cozy_end]

cozy = replace_localized_value(cozy, 'titleOne: {', 'uz', 'Pufning uyqu oldi sovg‘asi')
cozy = replace_localized_value(cozy, 'episodeOne: {', 'uz', '''
Shinam o‘rmonda oqshom edi. Puf ismli quyoncha eski to‘nka yonida katta-katta barglarni bir joyga yig‘ib qo‘ygan edi. Yonida boyqush Nura, olmaxon Lola va sekin yuradigan toshbaqa Toti ham bor edi. {{HERO}} kelganda Puf bir bargni qulog‘iga qo‘yib, juda jiddiy ko‘rinishga urindi.

— Men akamga uyqudan oldin sovg‘a qilmoqchiman, — dedi Puf. — U har kecha ko‘rpamni to‘g‘rilab beradi. Bugun men ham uni xursand qilaman.

Puf barglar orasidan eng kattasini oldi. Barg uning yuzini butunlay yopib qoldi.

— Avval seni topib olaylik, — dedi Lola.

Barg pastga tushganda hamma kuldi. Puf ham kulib, bargni ehtiyotkorlik bilan yerga qo‘ydi.

Nura Pufdan sovg‘a qanday bo‘lishini so‘radi. Puf yelka qisdi. U faqat akasi kulsa, sovg‘a yaxshi chiqqanini bilishini aytdi.

Lola uchta yong‘oq po‘chog‘ini olib keldi. Toti esa yo‘lda topgan yumshoq sariq bargni ko‘rsatdi. {{HERO}} ularni eski to‘nka ustiga terib chiqdi. Hamma bir oz o‘ylab qoldi.

Shu payt ikkita yorug‘qo‘ng‘iz uchib kelib, Pufning uzun quloqlari orasida aylana boshladi. Puf boshini burdi, ular ham burildi. Puf boshini yana burdi, ular yana ergashdi.

— Menimcha, ular ham yordam bermoqchi, — dedi Nura.

Puf juda past ovozda “xayrli tun” deb ko‘rdi. Yorug‘qo‘ng‘izlardan biri shu payt yonib-o‘chdi.

— Mana, u javob berdi! — dedi Puf.

Endi hammaning kayfiyati yanada ko‘tarildi. {{HERO}} barglarni bir tomonga, yong‘oq po‘choqlarini ikkinchi tomonga qo‘ydi. Bir fikr barglardan kichkina rasm yasash edi. Unda oy, quyon quloqlari va bitta yulduz bo‘lishi mumkin edi.

Ikkinchi fikr esa juda sokin qo‘shiq edi. Yong‘oq po‘choqlari “toq-toq” qilardi, Lola barglarni mayin shitirlatardi, Nura esa ikki notani cho‘zib aytardi. Puf faqat oxirida “xayrli tun” deb qo‘shilardi.

Puf ikkala fikrni ham tasavvur qilib ko‘rdi. Avval quloqlarini tik tutdi, keyin birini bukdi. Yorug‘qo‘ng‘izlar ham go‘yo tanlayotgandek bir bargga, bir yong‘oq po‘chog‘iga uchib qo‘nardi. Lola ularning bu jiddiy ishiga qarab kulmaslikka harakat qildi.

— Ikkalasi ham yoqdi, — dedi Puf. — Lekin bittasidan boshlashimiz kerak.

{{HERO}} Puf yoniga o‘tirdi. Lola yong‘oq po‘choqlarini kaftida ushlab turardi. Toti sariq bargni shamol uchirib ketmasin deb oyog‘i bilan bosib oldi. Nura esa jim kutdi.

Puf kulib qaradi.

— Akam uchun qaysi sovg‘ani tayyorlaymiz?
''')

choice_a_start = cozy.index("      'choice-a': {")
choice_b_start = cozy.index("      'choice-b': {", choice_a_start)
choice_a = cozy[choice_a_start:choice_b_start]
choice_b = cozy[choice_b_start:]

choice_a = replace_localized_value(choice_a, 'text: {', 'uz', 'Barglardan kichkina rasm yasash')
choice_a = replace_localized_value(choice_a, 'effect: {', 'uz', '{{HERO}} va do‘stlar barglardan Pufning akasi uchun oy va quyon quloqlari bor kulgili rasm yasadi.')
choice_a = replace_localized_value(choice_a, 'resolution: {', 'uz', '{{HERO}} sariq bargni o‘rtaga qo‘ydi. Lola yoniga ikki kichik bargdan quyon qulog‘i yasadi. Puf oy uchun dumaloq barg topdi, ammo uni teskari qo‘yib yubordi. Hamma kuldi. Rasm tayyor bo‘lganda Puf uni ikki panjasi bilan ehtiyotkor ushladi.')
choice_a = replace_localized_value(choice_a, 'seed: {', 'uz', 'Puf rasmni akasiga ko‘rsatish uchun do‘stlari bilan in tomon yurdi.')
choice_a = replace_localized_value(choice_a, 'titleTwo: {', 'uz', 'Barglardan yasalgan sovg‘a')
choice_a = replace_localized_value(choice_a, 'episodeTwo: {', 'uz', '''
Puf rasmni ikki panjasi bilan ushlab, akasining ini tomon yurdi. {{HERO}}, Nura, Lola va Toti uning yonida edi. Rasm katta emasdi, lekin Puf uni xuddi juda qimmat narsa kabi ehtiyot qilardi.

Yo‘lda bir kichik shamol bargning burchagini ko‘tardi. Puf darrov to‘xtadi.

— Qulog‘i uchib ketayapti! — dedi u.

Lola barg qulog‘ini joyiga bosdi. Toti esa rasm tagiga kichkina novda qo‘ydi. Endi uni ko‘tarish osonroq bo‘ldi.

— Sovg‘aning o‘zi ham yurishni o‘rganayapti, — dedi Nura.

Puf kulib yubordi.

Birozdan keyin ular quyonlar iniga yetdi. Eshik oldida Pufning akasi o‘tirgan edi. U Pufni ko‘rib, kulimsiradi.

— Hali uxlamadingmi?

Puf darrov rasmni orqasiga yashirdi. Rasm undan kengroq bo‘lgani uchun ikki tomondan barg quloqlari chiqib turardi.

Aka bir bargga, keyin ikkinchisiga qaradi.

— Menimcha, orqangda juda katta quyon turibdi, — dedi u.

Puf kulib, sovg‘ani oldiga chiqardi.

Rasmda sariq oy, ikkita quyon qulog‘i va kichkina yulduz bor edi. Puf bitta bargni biroz qiyshiq qo‘yganini ko‘rsatdi.

— Bu sening qulog‘ing, — dedi u. — Chunki sen uxlayotganda bittasi doim yon tomonga tushib qoladi.

Aka avval rasmga qaradi, keyin Pufga. So‘ng ukasini quchdi.

— Menga juda yoqdi.

Pufning quloqlari tik turib qoldi. U orqasiga qarab, do‘stlariga sekin bosh irg‘adi. Lola xuddi ishni juda katta sir bilan tugatgandek barmog‘ini labiga qo‘ydi. Toti esa allaqachon eshik yonidagi yumshoq maysaga o‘tirib olgan edi.

Aka rasmni in ichidagi past devorga ilib qo‘ydi. Yorug‘qo‘ng‘izlardan biri kirib, rasm yonida bir marta yonib-o‘chdi. Puf buni “yulduz ham ishlayapti” deb tushuntirdi.

Keyin hamma eshik oldida bir necha daqiqa o‘tirdi. Nura bugun hech qanday yangi hikoya boshlamasligini aytdi. Lola qolgan yong‘oq po‘choqlarini kichkina xaltasiga soldi. Toti esa sariq bargdan qolgan mayda bo‘lakni Pufga berdi.

— Ertaga yana bir narsa yasarsan, — dedi u.

Puf bosh irg‘adi, lekin ko‘zlari allaqachon yumila boshlagan edi.

Aka uning yelkasiga yengil ko‘rpa yopdi. Puf rasmga yana bir marta qaradi. Oy bargi sokin turardi, quyon quloqlari esa devorda kulgili ko‘rinardi.

{{HERO}} do‘stlar bilan sekin xayrlashdi. Nura past shoxga uchdi, Lola uyiga qaytdi, Toti esa o‘z yo‘lida asta yurdi. In eshigi yopilmadi, faqat biroz tortildi. Ichkaridan Pufning “xayrli tun” degan ovozi eshitildi. Keyin hamma narsa jim bo‘ldi. Devoridagi kichkina barg rasmi oy nurida juda oddiy, juda iliq va yoqimli sovg‘adek ko‘rinib turardi.
''')
choice_a = choice_a.replace('icon: `🏮`', 'icon: `🎁`', 1)

choice_b = replace_localized_value(choice_b, 'text: {', 'uz', 'Sokin “xayrli tun” qo‘shig‘ini chalish')
choice_b = replace_localized_value(choice_b, 'effect: {', 'uz', '{{HERO}} va do‘stlar Pufning akasi uchun yong‘oq po‘choqlari, barg va yumshoq kuy bilan kichkina “xayrli tun” qo‘shig‘ini tayyorladi.')
choice_b = replace_localized_value(choice_b, 'resolution: {', 'uz', '{{HERO}} ikki yong‘oq po‘chog‘ini sekin “toq-toq” qildi. Lola bargni mayin shitirlatdi, Nura past ovozda kuy boshladi. Puf oxirida kulib “xayrli tun” dedi. Yorug‘qo‘ng‘izlar ham birin-ketin yonib-o‘chdi. Kichkina qo‘shiq tayyor bo‘ldi.')
choice_b = replace_localized_value(choice_b, 'seed: {', 'uz', 'Puf qo‘shiqni akasiga aytish uchun do‘stlari bilan in tomon yurdi.')
choice_b = replace_localized_value(choice_b, 'titleTwo: {', 'uz', 'Pufning “xayrli tun” qo‘shig‘i')
choice_b = replace_localized_value(choice_b, 'episodeTwo: {', 'uz', '''
Kichkina qo‘shiq tayyor bo‘lgach, Puf eng oldinda yurishni xohladi. {{HERO}}, Nura, Lola va Toti uning ortidan ketdi. Ular baland aytmadi. Qo‘shiq shunaqa past ediki, hatto barglarning shitirlashi ham unga qo‘shilib ketardi.

{{HERO}} ikki yong‘oq po‘chog‘ini “toq-toq” qildi. Lola yumshoq bargni silkitdi. Nura ikki notani cho‘zdi.

Navbat Pufga kelganda u og‘zini ochdi, lekin hech narsa demadi.

— Men so‘zimni unutdim, — dedi u.

— Bitta so‘z edi-ku, — dedi Lola.

Puf biroz o‘yladi.

— Unda yanada uyat bo‘ldi.

Hamma kuldi. Nura Pufga hech kim shoshmayotganini aytdi. Puf yana urinib ko‘rdi.

— Xayrli... puf!

Bu safar Lola shunaqa kuldiki, bargi qo‘lidan tushib ketdi. Puf ham o‘z xatosiga kuldi.

— Mayli, yangi qo‘shiqda “puf” ham bo‘lsin, — dedi {{HERO}}.

Shundan keyin qo‘shiq yanada qiziq bo‘ldi. “Toq-toq”, mayin barg ovozi, Nuraning ikki notasi va oxirida Pufning “xayrli tun... puf!” degan joyi bor edi.

Ular quyonlar iniga yetganda Pufning akasi eshik oldida turardi. U uzoqdan qo‘shiqni eshitib, kutib qolgan ekan.

— Bu qanday musiqa? — deb so‘radi u.

Puf ko‘kragini kerdi.

— Bu senga.

Hamma o‘z joyini egalladi. {{HERO}} yong‘oq po‘choqlarini sekin urdi. Lola bargni mayin shitirlatdi. Nura kuyladi. Puf esa bu safar so‘zni to‘g‘ri aytdi.

— Xayrli tun!

Aka jim turib eshitdi. Keyin u ham ikki marta kaftini sekin urdi.

— Yana bir marta bo‘ladimi?

Pufning quloqlari tik turib qoldi. Ikkinchi marta ular yanada sekin chaldi. Toti ham qo‘shilishni xohlab, panjasi bilan yerga bir marta “tap” qildi. Shu bitta ovoz hammaga yoqdi.

Uchinchi marta esa Nura qo‘shiqni boshlamadi.

— Endi qo‘shiqning o‘zi uxlashi kerak, — dedi u.

Puf jiddiy bosh irg‘adi. Yong‘oq po‘choqlari Lola xaltasiga qaytdi. Barg Toti yoniga qo‘yildi. Yorug‘qo‘ng‘izlar ham asta pastlab, maysa ustida dam oldi.

Puf akasining yoniga o‘tirdi. Aka uning quloqlaridan birini ohista siladi.

— Eng yaxshi joyi qaysi edi? — deb so‘radi.

Puf ko‘zlarini yumib javob berdi:

— “Puf” degan joyi.

Hamma yana bir marta kuldi, ammo bu safar juda past ovozda.

{{HERO}} do‘stlar bilan xayrlashib, sekin ortga yurdi. Nura yaqin shoxga qo‘ndi, Lola uyiga ketdi, Toti odatdagidek shoshmasdan yo‘l oldi. In ichida Puf bilan akasi qo‘shiqning oxirgi ikki notasini juda past ovozda yana bir marta aytdi. So‘ng ularning ovozi ham tinib qoldi. Tashqarida barglar mayin shitirlardi, yorug‘qo‘ng‘izlar esa birin-ketin chiroqlarini pasaytirib, o‘rmonni uyquga tayyorlayotgandek ko‘rinardi.
''')

cozy = cozy[:choice_a_start] + choice_a + choice_b
text = text[:cozy_start] + cozy + text[cozy_end:]
old_preview = """    nextEpisodePreview: language === 'ru'
      ? 'История продолжится сразу после твоего выбора.'
      : 'Hikoya tanlovingdan keyin darrov davom etadi.',"""
new_preview = """    nextEpisodePreview: language === 'ru'
      ? 'История продолжится сразу после твоего выбора.'
      : world === 'cozy_forest'
        ? 'Puf akasiga sovg‘ani ko‘rsatadigan payt juda yaqin edi.'
        : 'Hikoya tanlovingdan keyin darrov davom etadi.',"""
if text.count(old_preview) != 1:
    raise SystemExit('storySixMinuteEditorial.ts: preview marker mismatch')
text = text.replace(old_preview, new_preview, 1)
story.write_text(text)

prompt = 'supabase/functions/story-generate/prompt.ts'
replace_once(
    prompt,
    "    motifs: ['forest path', 'fireflies', 'small houses', 'kind animals'],\n    values: ['friendship', 'care_for_nature', 'mutual_help'],\n    forbidden: ['predator threat', 'being lost at night', 'dark unresolved danger'],",
    "    motifs: ['forest clearing', 'fireflies', 'cozy burrow', 'acorns', 'kind animals'],\n    values: ['friendship', 'care_for_nature', 'mutual_help'],\n    forbidden: ['predator threat', 'being lost at night', 'finding the way home in darkness', 'washed-away path signs', 'dark unresolved danger'],",
)
replace_once(
    prompt,
    "    ? 'Write natural Uzbek storytelling in Latin script. Do not translate Russian sentence by sentence; natural phrasing, jokes and concrete details may differ while preserving the same story contract.'",
    "    ? 'Write natural Uzbek storytelling in Latin script. Do not translate Russian sentence by sentence. For ages 5-7, prefer words common in everyday family speech and short direct phrasing. Avoid bookish or borrowed words such as chorraha, paporotnik, kapyushon, ritm, spiral and tantanali when a simpler child-level phrase exists. Natural jokes and concrete details may differ while preserving the same story contract.'",
)

arch = 'supabase/functions/story-generate/story-architecture.ts'
old_arch = "For cozy_forest, make living forest characters drive the story. Prefer friendly animals, birds, insects or other clearly living forest residents with a small desire, relationship, funny misunderstanding, discovery or need for help. Streams, stones, leaves, weather and paths may support the scene, but should not become the main protagonist or a maintenance task by themselves. Avoid plots centered on clearing water, repairing a path, moving debris or fixing nature unless that action directly serves a living character goal. For ages 5-7 bedtime, prefer warm social or playful stakes over being lost alone, separation, pursuit, injury, rescue from danger, or darkness used as a threat."
new_arch = "For cozy_forest, make living forest characters drive the story. Prefer friendly animals, birds, insects or other clearly living forest residents with a small desire, relationship, funny misunderstanding, discovery or need for help. Streams, stones, leaves, weather and paths may support the scene, but should not become the main protagonist or a maintenance task by themselves. Avoid plots centered on clearing water, repairing a path, moving debris or fixing nature unless that action directly serves a living character goal. For ages 5-7 bedtime, the central goal must stay warm, social or playful. Do not center the plot on finding the way home, washed-away signs, choosing a route in darkness, being lost, separation, pursuit, injury, rescue from danger, or weather damage."
replace_once(arch, old_arch, new_arch)

split_check = Path('scripts/check-story-ai-split.mjs')
check_text = split_check.read_text()
marker = "  'make living forest characters drive the story',\n  'prefer warm social or playful stakes',\n  'For Uzbek ages 5-7, prefer common natural Uzbek words',"
replacement = "  'make living forest characters drive the story',\n  'central goal must stay warm, social or playful',\n  'Do not center the plot on finding the way home',\n  'For Uzbek ages 5-7, prefer common natural Uzbek words',\n  'prefer words common in everyday family speech',\n  'chorraha, paporotnik, kapyushon, ritm, spiral and tantanali',"
if check_text.count(marker) != 1:
    raise SystemExit('check-story-ai-split.mjs: story-quality marker mismatch')
split_check.write_text(check_text.replace(marker, replacement, 1))

core = Path('scripts/check-story-core-proof.mjs')
core_text = core.read_text()
marker = """  assert(!/^утром\\b/iu.test(forestA.story_text.trim()) && !/^утром\\b/iu.test(forestB.story_text.trim()), 'Forest continuation incorrectly restarts the story next morning.')

  const spaceOne = buildSafeFallback({ ...baseContext, stylePackId: 'stars_and_space' })
"""
addition = """  assert(!/^утром\\b/iu.test(forestA.story_text.trim()) && !/^утром\\b/iu.test(forestB.story_text.trim()), 'Forest continuation incorrectly restarts the story next morning.')

  const uzForestContext = { ...baseContext, language: 'uz', heroName: 'Malika' }
  const uzForestOne = buildSafeFallback(uzForestContext)
  const uzBookish = /chorraha|paporotnik|kapyushon|ritm|spiral|tantanali|so‘qmoq|yo‘l ko‘rsatkich/iu
  assert(uzForestOne.title === 'Pufning uyqu oldi sovg‘asi', 'Uzbek forest title must stay character-led.')
  assert(wordCount(uzForestOne.story_text) >= 320 && wordCount(uzForestOne.story_text) <= 470, 'Uzbek forest Episode 1 release length failed.')
  assert(!uzBookish.test(uzForestOne.story_text), 'Uzbek forest Episode 1 contains avoidable bookish/borrowed vocabulary.')
  assert(uzForestOne.vocabulary.length === 0, 'Uzbek forest must not expose Russian-English vocabulary cards.')
  assert(uzForestOne.nextEpisodePreview === 'Puf akasiga sovg‘ani ko‘rsatadigan payt juda yaqin edi.', 'Uzbek forest preview must stay in-world.')
  assert(uzForestOne.choices.length === 2, 'Uzbek forest must have two choices.')
  for (const choice of uzForestOne.choices) {
    const resolutionWords = wordCount(choice.resolution_text)
    assert(resolutionWords >= 30 && resolutionWords <= 45, `Uzbek forest ${choice.choice_id} bridge length failed.`)
    assert(!uzBookish.test(`${choice.text} ${choice.effect_summary} ${choice.resolution_text}`), `Uzbek forest ${choice.choice_id} uses avoidable vocabulary.`)
  }
  const uzContinuation = (choice) => buildSafeFallback({
    ...uzForestContext,
    episodeIndex: 2,
    isContinuation: true,
    choiceHistory: [memoryFromChoice(uzForestOne, choice)],
    lastEpisodeSummary: choice.effect_summary,
    activeArc: choice.state_patch.open_arc ?? '',
    relationshipState: choice.state_patch.relationship_updates ?? {},
    canonState: choice.state_patch.canon_updates ?? {},
  })
  for (const choice of uzForestOne.choices) {
    const continuation = uzContinuation(choice)
    const continuationWords = wordCount(continuation.story_text)
    const coda = continuation.story_text.trim().split(/\\n\\s*\\n/u).filter(Boolean).at(-1) ?? ''
    const fullSessionWords = wordCount(uzForestOne.story_text) + wordCount(choice.resolution_text) + continuationWords
    assert(continuationWords >= 355 && continuationWords <= 520, `Uzbek forest ${choice.choice_id} Episode 2 release length failed.`)
    assert(wordCount(coda) >= 50, `Uzbek forest ${choice.choice_id} bedtime coda is too short.`)
    assert(fullSessionWords >= 700 && fullSessionWords <= 1400, `Uzbek forest ${choice.choice_id} full session is outside the hard release envelope.`)
    assert(!uzBookish.test(`${continuation.title} ${continuation.story_text}`), `Uzbek forest ${choice.choice_id} continuation uses avoidable vocabulary.`)
  }

  const spaceOne = buildSafeFallback({ ...baseContext, stylePackId: 'stars_and_space' })
"""
if core_text.count(marker) != 1:
    raise SystemExit('check-story-core-proof.mjs: Uzbek proof insertion marker mismatch')
core.write_text(core_text.replace(marker, addition, 1))
