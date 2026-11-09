# QISSA — «БЫЛО → СТАНЕТ» для утверждения литературных исправлений

**Issue:** [#322](https://github.com/jteshaboev1984-ops/qissa_app/issues/322). **DRAFT PR:** [#321](https://github.com/jteshaboev1984-ops/qissa_app/pull/321). **Срез:** fcf3e436a5e3e911af6a46e16fe254c5350722cd.

**СТАТУС: НА СОГЛАСОВАНИИ.** Этот документ показывает точные изменения и их смысл. `src/data/authored/**`, опубликованные версии, World Bible V1, иллюстрации и release flags **не менялись**. В этом файле «СТАНЕТ» = предлагаемый новый текст, а не уже опубликованный результат. Узбекские переводы являются подготовленными редакторскими вариантами, **не независимой native-UZ литературной приёмкой**.

## I. Каноническая поправка — CANON-01

**Было (World Bible V1, §3, п. 21):**

> Shamol jumps a ditch during the escape.

**Станет в отдельно утверждаемой World Bible V2 (буквальный английский replacement):**

> 21. During the Eastern Forest escape, Temur and Shamol must get past the ditch. The method depends on the selected `temur_forest_escape_method`: with `p3_jump_ditch`, Shamol jumps over it (`temur_escape_method=jumped_ditch`); with `p3_precise_control`, Temur guides Shamol through a narrow, shallower passage between stones without jumping (`temur_escape_method=precise_control`). Both are valid canonical continuities.

**Понятно по-русски:** темур и Шамол преодолевают канаву; ребёнок решает — прыжок или узкий обход. Ни одну ветку нельзя принудительно превращать в другую. Обязателен `OWNER_CANON_APPROVAL` до создания нового утверждённого канона.

## II. Все 13 точных операций для 6 RU/UZ-файлов

Предложения лежат в [машинно-проверяемом JSON](https://github.com/jteshaboev1984-ops/qissa_app/blob/codex/story-canon-literary-gates-20261109/docs/qissa/ai/reviews/drafts/2026-11-09_literary_patch_proposals.json), статус `PROPOSED_NOT_APPROVED_NOT_PUBLISHED`. Для каждого pointer ниже приведены **в точности** удаляемые и добавляемые текстовые фрагменты (без полного повторения неизменяемых тысяч слов). Пустое «БЫЛО» значит, что добавляется новое предложение; старый текст по остальным строкам сохраняется.

### prazdnikMuzhestvaV3.ru.json (RU)

Source blob: `cefd720a52d8f9d45fe9e92126a88ac393d6a0f7`; ожидаемая реконструкция предложения `c0bf979ad5135b742854f534942fefee39db21a8`.

**Операция 1/13 — Story 1, часть 3: повтор Шамола (STYLE-01) + рукав Темура (E04)**, pointer: `/parts/2/story_text`.

Фрагмент 1:

**БЫЛО:**

```text
Даже Шамол перестал торопиться.

Шамол вдруг замедлил шаг.
```

**СТАНЕТ:**

```text
Шамол вдруг замедлил шаг и насторожил уши.
```

Фрагмент 2:

**БЫЛО:**

```text
Конь насторожил уши.
```

**СТАНЕТ:**

```text
(фрагмент удаляется без замены)
```

Фрагмент 3:

**БЫЛО:**

```text
Одна из них хлестнула по боку и зацепила клапан дорожной сумки.
```

**СТАНЕТ:**

```text
Одна ветка рванула правый рукав, другая ударила по боку и зацепила клапан дорожной сумки.
```

**Операция 2/13 — Story 1, выбор «Перепрыгнуть канаву»: неверная ценностная метка (META-01)**, pointer: `/parts/2/decision/choices/0/value_alignment`.

**БЫЛО:**

```text
["care_for_animals"]
```

**СТАНЕТ:**

```text
[]
```

**Операция 3/13 — Story 1, часть 5, Самира уезжает немедленно (E03)**, pointer: `/parts/4/decision/choices/0/resolution_text`.

**БЫЛО:**

```text
Но это была гонка.

А правило короля было ясным.
```

**СТАНЕТ:**

```text
Она всё ещё хотела выиграть.

Если уедет сейчас, сохранит преимущество.
```

### prazdnikMuzhestvaV3.uz.json (UZ)

Source blob: `64e2d342199fb253f6d08db5708de284bbaf626e`; ожидаемая реконструкция предложения `3d31edf67312389d63c1d45cf1c827b28e987977`.

**Операция 4/13 — Story 1, часть 3: повтор Шамола (STYLE-01) + рукав Темура (E04)**, pointer: `/parts/2/story_text`.

Фрагмент 1:

**БЫЛО:**

```text
Hatto Shamol ham shoshmay qo‘ydi.

Shamol birdan qadamini sekinlatdi.
```

**СТАНЕТ:**

```text
Shamol birdan qadamini sekinlatib, quloqlarini ding qildi.
```

Фрагмент 2:

**БЫЛО:**

```text
Ot quloqlarini ding qildi.
```

**СТАНЕТ:**

```text
(фрагмент удаляется без замены)
```

Фрагмент 3:

**БЫЛО:**

```text
Shoxlardan biri Temurning yonboshiga urilib, yo‘l xaltasining qopqog‘iga ilinib qoldi.
```

**СТАНЕТ:**

```text
Bir shox Temurning o‘ng yengini yirtib yubordi, boshqasi esa yonboshiga urilib, yo‘l xaltasining qopqog‘iga ilinib qoldi.
```

**Операция 5/13 — Story 1, часть 5, Самира уезжает немедленно (E03)**, pointer: `/parts/4/decision/choices/0/resolution_text`.

**БЫЛО:**

```text
Ammo bu bellashuv edi.

Qirolning qoidasi esa aniq edi.
```

**СТАНЕТ:**

```text
Samira hali ham g‘alaba qozonishni istardi.

Hozir yo‘lga chiqsa, ustunligini saqlab qolardi.
```

### taynaVostochnogoKaravanaV4.ru.json (RU)

Source blob: `23359bfe52158af4142725be4ffdbf642c88d92c`; ожидаемая реконструкция предложения `adb52c6110883eeb5f2eec5cd49b371914b168e3`.

**Операция 6/13 — Story 2, часть 5, Темур делает копию знака (E01)**, pointer: `/parts/4/post_choice_text`.

**БЫЛО:**

```text
(отсутствовало; вставка)
```

**СТАНЕТ:**

```text
Темур быстро срисовал знак на небольшом листе.
```

Вставляется **после**: «— Нет.».

**Операция 7/13 — Story 2, часть 7, что Темур показывает Самире (E01)**, pointer: `/parts/6/post_choice_text`.

**БЫЛО:**

```text
Он достал металлическую накладку со знаком разбойников.
```

**СТАНЕТ:**

```text
Он показал Самире рисунок знака, который сделал у капитана.
```

**Операция 8/13 — Story 2, часть 9, возвращение оригинала улики к допросу (E01)**, pointer: `/parts/8/story_text`.

**БЫЛО:**

```text
(отсутствовало; вставка)
```

**СТАНЕТ:**

```text
Перед допросом начальник ворот вернул находку капитану. Тот передал накладку Темуру и поручил показать её Надиру. Темур убрал находку в сумку до нужного момента.
```

Вставляется **после**: «Надир замолчал.».

### taynaVostochnogoKaravanaV4.uz.json (UZ)

Source blob: `650e06cc598a3fba3e452358e646304c9fb82b83`; ожидаемая реконструкция предложения `d4805ae2ec3d9fd833178957bc5f33179b5fb265`.

**Операция 9/13 — Story 2, часть 5, Темур делает копию знака (E01)**, pointer: `/parts/4/post_choice_text`.

**БЫЛО:**

```text
(отсутствовало; вставка)
```

**СТАНЕТ:**

```text
Temur belgini kichik qog‘ozga tezda chizib oldi.
```

Вставляется **после**: «— Yo‘q.».

**Операция 10/13 — Story 2, часть 7, что Темур показывает Самире (E01)**, pointer: `/parts/6/post_choice_text`.

**БЫЛО:**

```text
Temur qaroqchilar belgisi tushirilgan metall qoplamani chiqardi.
```

**СТАНЕТ:**

```text
Temur sardorning oldida chizib olgan qaroqchilar belgisini Samiraga ko‘rsatdi.
```

**Операция 11/13 — Story 2, часть 9, возвращение оригинала улики к допросу (E01)**, pointer: `/parts/8/story_text`.

**БЫЛО:**

```text
(отсутствовало; вставка)
```

**СТАНЕТ:**

```text
So‘roqdan oldin darvoza boshlig‘i metall qoplamani sardorga qaytardi. Sardor topilmani Temurga uzatib, Nadirga ko‘rsatishni topshirdi. Temur kerak bo‘lguncha uni xaltasiga solib qo‘ydi.
```

Вставляется **после**: «— Xo‘p. Darvozadan emas.».

### staging/season2Story4WaitedMan.ru.json (RU)

Source blob: `b07b0f26a0a7b94b2bd8754887b7340fcaf5bc8c`; ожидаемая реконструкция предложения `c0e25ad3894805e2308b9622363c24ace2f1e33e`.

**Операция 12/13 — S2 Story 4, часть 2, сигнал Надира и записка (E02)**, pointer: `/parts/1/post_choice_text`.

Фрагмент 1:

**БЫЛО:**

```text
Только проходя мимо повозки Хамида, он на мгновение остановился будто поправить ремень.

Снял пустую флягу.

И повесил её на левый задний крюк.

Ничего больше.
```

**СТАНЕТ:**

```text
Пока никто не смотрел, он записал на обрывке бумаги несколько слов: «Красный холм. Старая патрульная дорога. Люди ждут тюремную повозку. После полудня — две свежие лошади у Трёх столбов». Свернул записку и спрятал её под пробкой пустой фляги.

Проходя мимо повозки Хамида, он на мгновение остановился будто поправить ремень.

Повесил флягу на левый задний крюк — это и был условленный знак.
```

Фрагмент 2:

**БЫЛО:**

```text
Человек не ушёл сразу.

Только через некоторое время к нему подошёл другой работник.

Они обменялись двумя словами.

Первый остался.

Второй вышел из караванного двора.

Так сигнал добрался до городской стражи, не оставив Надира одного под подозрением.
```

**СТАНЕТ:**

```text
Человек не ушёл сразу. Когда рядом с повозкой никого не осталось, он снял флягу, прочитал записку под пробкой, забрал записку и повесил пустую флягу обратно.

Через некоторое время к нему подошёл другой работник.

Первый тихо пересказал написанное. Сам остался у навеса, а второй вышел из караванного двора.

Так сообщение о Красном холме добралось до городской стражи, не оставив Надира под подозрением.
```

### staging/season2Story4WaitedMan.uz.json (UZ)

Source blob: `9c06174c2c6509d0e942701f2c433a5e93006a4d`; ожидаемая реконструкция предложения `68e6afa908504149588184fe599779f485897d66`.

**Операция 13/13 — S2 Story 4, часть 2, сигнал Надира и записка (E02)**, pointer: `/parts/1/post_choice_text`.

Фрагмент 1:

**БЫЛО:**

```text
(отсутствовало; вставка)
```

**СТАНЕТ:**

```text
Hech kim qaramayotgan paytda qog‘oz parchasiga bir necha so‘z yozdi: «Qizil tepalik. Eski patrul yo‘li. Odamlar mahbus tashilayotgan aravani kutyapti. Tushdan keyin Uch ustunda ikki yangi otni olish kerak». Qog‘ozni buklab, bo‘sh suv idishining tiqini ostiga yashirdi.
```

Вставляется **после**: «Nadir yana ishiga qaytdi.».

Фрагмент 2:

**БЫЛО:**

```text
Bo‘sh suv idishini oldi.

Va chap orqa ilgakka osdi.

Boshqa hech narsa qilmadi.
```

**СТАНЕТ:**

```text
Suv idishini chap orqa ilgakka osdi. Bu oldindan kelishilgan ishora edi.
```

Фрагмент 3:

**БЫЛО:**

```text
Odam darrov ketmadi.
```

**СТАНЕТ:**

```text
Odam darrov ketmadi. Arava yonida hech kim qolmaganda idishni olib, tiqin ostidagi xatni o‘qidi, xatni o‘zi bilan oldi va bo‘sh idishni yana joyiga osdi.
```

Фрагмент 4:

**БЫЛО:**

```text
Ular ikki og‘iz gap almashdi.

Birinchisi qoldi.

Ikkinchisi karvon hovlisidan chiqib ketdi.

Shu tariqa ishora Nadirning o‘zini shubha ostida qoldirmasdan shahar qo‘riqchilariga yetdi.
```

**СТАНЕТ:**

```text
Birinchisi xat mazmunini unga past ovozda aytdi. O‘zi qoldi, ikkinchi ishchi esa karvon hovlisidan chiqib ketdi.

Shu tariqa Qizil tepalikdagi xavf haqidagi xabar Nadirni shubha ostida qoldirmasdan shahar qo‘riqchilariga yetdi.
```

## III. Дополнительные адресные правки для литературного решения (НЕ входят в 13 операций)

Здесь только кандидаты из [decision record](https://github.com/jteshaboev1984-ops/qissa_app/blob/codex/story-canon-literary-gates-20261109/docs/qissa/ai/reviews/2026-11-09_canon01_r01_r06_decision_record.md). Если будут утверждены, потребуется отдельно подготовить точные versioned RU/UZ операции и повторно проверить соответствующие source hashes и изображение, **не снимая защиту**.

### R01 — Заран → обвал; пауза Самиры

**Файл:** `prazdnikMuzhestvaV3.ru.json`, `part_6_return_road.story_text`, общая для обеих веток `samira_zaran_wait` сцена.

**БЫЛО (RU):**

```text
Она прислушалась.

Пока ничего.

Самира поднялась ещё немного.
```

**СТАНЕТ (RU, предварительно):**

```text
Она прислушалась.

Пока ничего.

Самира ждала. Время тянулось. Темура всё не было.

Самира поднялась ещё немного.
```

**UZ — добавляется:** `Samira kutdi. Vaqt cho‘zildi. Temurdan hamon darak yo‘q edi.` **Статус:** пояснение временного ожидания; доказанной физической невозможности нет. Риск искусственного затягивания ритма — повторно прочитать перед утверждением.

### R02 — повторная догадка о серебре

**Файл:** `staging/season2Story7BackToOrdan.ru.json`, `story7_part_1_back_to_ordan.post_choice_text`.

**БЫЛО (RU):**

> — Серебро взяли только после тревоги. Значит, пришли не за серебром?

**СТАНЕТ (RU):**

> — Капитан ещё в Арасе сомневался, что они пришли за серебром. Теперь понятно почему?

**БЫЛО (UZ):**

> — Kumushni faqat xavf tug‘ilgandan keyin olishgan. Demak, aslida kumush uchun kelishmaganmi?

**СТАНЕТ (UZ):**

> — Arasda sardor ham ular kumush uchun kelmagan bo‘lishi mumkinligini aytgandi. Endi sababi ayon bo‘ldimi?

Самире остаётся следующая реплика-открытие о настоящей печати. Ветка показаний и ветка описи не смешиваются.

### R03 — память Самиры о старом караванном дворе, только choice 3a

**Файл:** `taynaVostochnogoKaravanaV4.ru.json`, `story2_choice_3a_old_sarvan_yard.resolution_text`.

**БЫЛО (RU):**

```text
Втроём они дошли до старого караванного двора у южной дороги.

Большая часть помещений давно пустовала.

На воротах ещё сохранился старый знак двора: две узкие башни по сторонам проезда.
```

**СТАНЕТ (RU):**

```text
Втроём они дошли до старого караванного двора у южной дороги.

Большая часть помещений давно пустовала.

У порога южной башни ровно лежала пыль — свежих следов не было. Самира заметила это, осматривая двор.

На воротах ещё сохранился старый знак двора: две узкие башни по сторонам проезда.
```

**UZ — добавляется:** `Janubiy minoraning ostonasida chang bir tekis yotardi, yangi izlar ko‘rinmasdi. Samira hovlini ko‘zdan kechirayotib buni payqadi.`

Память теперь готовится до её использования в S2E3; ветку Азима (`story2_choice_3b_azim`) **не трогать**. Якорь иллюстрации `P6A-IMG-03` сохраняется.

### R04 — реакция взрослого после опасного боя

**Файл:** `staging/season2Story6TwoReinforcements.ru.json`, `story6_part_2_two_reinforcements.post_choice_text`, общая сцена после обеих альтернатив.

**БЫЛО (RU):**

```text
— Только руки ещё не слушаются.

— После такой схватки это неудивительно, — сказал Рахим. — Хорошо, что держались вместе.
```

**СТАНЕТ (RU; не меняя сам бой):**

```text
— Только руки ещё не слушаются.

Рахим посмотрел на обоих.

— Я велел вам оставаться у стены. Когда вы ушли, я не знал, где вас искать.

— Мы увидели, что стражникам нужна помощь, — сказала Самира.

— Понимаю. И рад, что вы целы. Но вы оба очень рисковали.

— После такой схватки это неудивительно, — сказал Рахим. — Хорошо, что держались вместе.
```

**UZ — добавляется:**

```text
Rahim ikkoviga qaradi.

— Sizlarga devor yonida qolishni aytgandim. Ketganingizda qayerdan izlashni bilmay qoldim.

— Qo‘riqchilarga yordam kerakligini ko‘rdik, — dedi Samira.

— Tushunaman. Sog‘-omon ekaningizdan xursandman. Lekin ikkovingiz ham qattiq tavakkal qildingiz.
```

**Внимание:** это не отменяет вопрос, насколько сам боевой эпизод правдоподобен и безопасен для образа 12-летних персонажей. Нужен owner/editor review; не переписывать утверждённую композицию автоматически.

### STYLE-02 — убрать повторную мораль после церемонии

**Файл:** `prazdnikMuzhestvaV3.ru/uz.json`, `part_7_return.story_text`.

**БЫЛО (RU):**

> — Бахадур должен быть смелым, — сказал король. — Но ещё он отвечает за своё слово, за дорогу и за тех, кто рядом.

**СТАНЕТ (RU):** эта **одна** реплика удаляется; вручение сабель, основной вывод короля и юмор Булута остаются.

**БЫЛО (UZ):**

> — Bahodir jasur bo‘lishi kerak, — dedi qirol. — Ammo u o‘z so‘zi, yo‘li va yonidagi odamlar uchun ham javob beradi.

**СТАНЕТ (UZ):** эта же реплика удаляется. **Не требуется** добавлять формальное «прости» в сцену признания Самиры.

### R05 — наследованные ID, текст без изменений

**БЫЛО:** `story6_choice_2a_wagon_team` / `story6_choice_2b_clear_return_road` не совпадают с современной семантикой видимых решений.

**СТАНЕТ:** id **те же**; в редакционной карте записано: 2a = помочь Рустаму перекрыть обход; 2b = защитить заднюю дверь повозки. Без миграции ничего переименовывать нельзя.

### R06 — звание, пока без автоматической замены

**БЫЛО:** World Bible установила официальный титул **«юные бахадуры царства»**, при этом в Story 2 и S2E4 персонажи говорят **«Всадник короля»**.

**СТАНЕТ (только после решения владельца):** в глоссарии явно различить официальный титул и разговорное обозначение/служебную роль. Слова в утверждённых репликах пока **не менять**: это вопрос интерпретации мира, а не доказанная ошибка.

## IV. Ожидаемое решение владельца

- **CANON-01:** согласовать только World Bible V2 §3.21 (две допустимые траектории; V1 frozen).
- **E01–E04, STYLE-01, META-01:** согласовать или отметить отдельные нежелательные формулировки.
- **R01–R04, STYLE-02:** согласовать по отдельности; допускается отложить R04 для специального решения о детской безопасности.
- **R05:** сохранить ID. **R06:** определить, в каком смысле употребляется «Всадник короля».
- **До owner sign-off:** не менять locked RU/UZ masters, опубликованные или staging JSON, не менять source hashes только ради зелёного CI и не делать merge PR #321.
