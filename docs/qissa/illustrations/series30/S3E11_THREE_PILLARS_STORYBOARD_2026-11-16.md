# QISSA — S3E11 «Три столба» — Stage 1 storyboard

**Дата:** 2026-11-16. **Статус:** две литературные сцены и якоря подтверждены; генерация и художественная приёмка ещё не проведены. **Stage 1: 2 новых shared кадра. Stage 2: 0.**

## Источники / неизменный канон
- RU/UZ authored: `src/data/authored/staging/season2Story3TwoTowers.ru.json`, `season2Story3TwoTowers.uz.json`, `story_id=seven_roads_dve_bashni`, `story_version=interactive-v6`, `part_id=story3_part_3_three_pillars`.
- Это виртуальная серия **S3E11** в `src/data/sevenRoadsReadingSeries.ts` после S3E10 «Курьер», где Темур и Самира изучили пути Сарвана и узнали от молодого стражника о всаднике, покинувшем старый двор. Входя в S3E11, дети не видели курьера своими глазами.
- В S3E11 взрослый стражник приносит рисунки обеих сторон жетона; на второй стороне **нарисованы** три каменных столба, один выше двух других. Сам физический дорожный пост и его точное расположение **ещё не показаны**. Разгадка Самира выбирает в одном из двух вариантов: дорожная книга либо опытный почтовый всадник. **Не иллюстрировать выбранный исход как shared сцену.**
- Уже существующая общая иллюстрация `seven_roads_s2_story3_guardhouse_two_drawings_map_01_APPROVED` появляется в `post_choice_text` после RU `На стол положили два рисунка.` / UZ `Stol ustiga ikki rasm qo‘yildi.`. Её не менять, не повторять разговор над картой.

## Визуальные эталоны (QISSA Library)
- `/QISSA/production/seven_roads/season2_visual_final/tier_a_story_frames/seven_roads_s2_story3_guardhouse_two_drawings_map_01_APPROVED.png` — помещение караула и костюмы людей.
- `/QISSA/production/seven_roads/season2_visual_final/refs/seven_roads_three_pillars_ref_01_APPROVED.png` — **только как проверенный визуальный канон** знака/каменных столбов; не изображать физический пост преждевременно.
- `/QISSA/visual_refs/seven_roads_v1/01_heroes_horses_approved.png` — Темур/Самира по 12 лет, бирюзово-синий/бордовый дорожные костюмы, Самира с одной длинной косой; оба в широких поясах Всадников короля и с церемониальными саблями **в ножнах**. Шамол почти чёрный с маленькой белой звездой, чепрак бирюзовый; Булут светло-серый в яблоках без звезды, чепрак бордовый.
- Художественный стиль `seven_roads_painterly_v1`, горизонтальный 16:9, тёплая книжная живопись; без текста и неканоничных знаков.

## S3E11-A01 — «Стражник принёс рисунки»

**Момент:** в караульное помещение Сарвана входит взрослый старший стражник из Араса с листом, на котором он скопировал обе стороны жетона, оставив оригинал в маленькой нише. Темур, Самира, местный начальник стражи и молодой стражник обращают на него внимание. Бумага ещё **сложена или повёрнута тыльной стороной**, так что подробный новый знак не изображается. Разговор происходит **до** разглядывания карты и до развилки в поисках значения столбов. Не повторять старый кадр над двумя раскрытыми рисунками на столе.
- RU: `Через некоторое время пришёл старший стражник из Араса.`
- UZ: `Birozdan keyin Arasdan kelgan katta qo‘riqchi kirdi.`
- `phase=story_text`. Exact unique 1/1 RU и UZ, индекс абзаца 3.
- Композиция: взрослый у порога с аккуратно сложенным листом, напряжённое внимание детей в глубине комнаты, тихая динамика начала донесения.

## S3E11-A02 — «Булут и яблоко»

**Момент:** поздний вечер, после работы в карауле и возвращения к дому Самиры в Сарване. Темур сидит на низкой стене у конюшни, Самира стоит рядом с яблоком, которое пытается достать её светло-серый в яблоках конь Булут. Рядом спокойно стоит почти чёрный Шамол с белой звёздочкой. Из открытого окна дома исходит тёплый свет. Дети говорят о возможной дороге в Ордан, но **никуда не едут**; семья не появляется в кадре как новые герои. Этот лирический кадр контрастирует с караулом и не повторяет старый рисунок карты.
- RU: `Булут потянулся к яблоку в её руке.`
- UZ: `Bulut uning qo‘lidagi olmaga cho‘zildi.`
- `phase=post_choice_text`, **после** слияния двух вариантов выбора и до конца истории. Exact unique 1/1 RU и UZ, индекс абзаца 64.
- Запреты: не менять местами лошадей/чепраки, не добавлять третью лошадь, не изображать дорогу/погоню, послание Надиру или будущие события в Ордане.

## Приёмка и интеграция
После каждой генерации — сверка RU/UZ и референсов, художественное утверждение, оригинальный PNG, оптимизированный WebP, SHA256 и QISSA Library. Только затем подтверждённая загрузка в Supabase `story-images/seven-roads/season2_tier_a_v2/`, независимый remote HTTP/MIME/byte/SHA test, additive overlay `src/data/series30ApprovedSceneSlots.ts`, URL registry `src/data/authoredStoryAssets.ts`, галерея S3E11 (A01 → старый кадр карты → A02), защита от спойлеров, CI reader/4 seasons/typecheck/build/browser.

**PR #334 Draft. Запрещены изменения литературных RU/UZ JSON, вариантов выбора, сохранённого прогресса, прежних изображений, merge и deploy.**

## Журнал неудачных генераций S3E11-A02 — 2026-11-16

- **Candidate #1 REJECTED**: вместо Самиры у яблока, коней Булута и Шамола и вечернего двора получилась сцена Темура и Самиры с картой у городских ворот. Это чужой эпизод и неканоничная бумажная карта; не интегрировать.
- **Candidate #2 REJECTED**: вместо двух коней у конюшни вернулся бегущий Надир между повозками (S3E6), дети у стены. Не интегрировать.
- **Статус S3E11 Stage1: 0/2.** A01 ещё не генерировалась, A02 дважды ошибочна. Ни одна из этих картинок не принята, не сохранена как `APPROVED`, не загружена в Storage, не добавлена в ART_QUEUE/runtime. При следующем запуске использовать свежий чистый контекст со строгим акцентом на двух конях и вечернем дворе, обязательно сверить их цвета и чепраки с `01_heroes_horses_approved.png`.

## Попытка S3E11-A01 2026-11-16 — без художественной приёмки

- ImageGen candidate #1 **REJECTED**: несмотря на требуемый интерьер караула, снова нарисован уличный водопой и молодой стражник с **красной восковой печатью**, лишние знамена и лошадь. Это сцена другой серии и спойлер по реквизиту; не использовать и не загружать.
- Утверждённый реальный референс интерьера `seven_roads_s2_story3_guardhouse_two_drawings_map_01_APPROVED.png` импортирован в Canva как media ID `MAHbEh3EeZI`. Отдельная Canva генерация S3E11-A01 с заданием «старший стражник входит в помещение с **закрытым листом**, без видимой карты и без восковой печати» завершилась **quota_exceeded**; нового файла нет.
- **S3E11 Stage1 остаётся 0/2.** A01 и A02 не получали APPROVED, Storage/runtime не менялись. Продолжать только после реальной изолированной генерации кадра С3Е11 по прежним точным RU/UZ якорям и каноническому интерьеру; не повторять ошибочную уличную сцену.

## S3E11-A01 «Стражник принёс рисунки»: новый принятый кадр — 2026-11-16

- **ACCEPTED** `seven_roads_s3e11_senior_guard_sketches_arrival_01_APPROVED` по действующему условию владельца. Проверен именно сюжет **внутри помещения караула Сарвана**: старший бородатый стражник из Араса стоит у двери с **сложенным чистым снаружи листом двух зарисовок**, содержание скрыто; Темур (12, синий головной убор/бирюзовый костюм), Самира (12, бордовое, диадема и одна длинная коса), местный начальник и молодой стражник обращаются к вошедшему. Широкие пряжки детей спереди, церемониальные сабли в ножнах сбоку. Никакого красного сургуча, наружного водопоя, открытого рисунка трёх столбов, выбора или новых гербов.
- Первая ошибочная уличная генерация с письмом и красной печатью отклонена. Canva с правильным референсом блокировалась квотой; успешный ImageGen-кадр получен отдельно. По внешнему низу обнаружена слабая генеративная псевдоподпись; итоговый 16:9 PNG аккуратно **обрезан только по внешней границе** (44 px слева/справа, 50 px снизу), без изменений сюжетных предметов.
- **Итог PNG-мастер 1584×891** SHA256 `88aa705ecbc231493aae37707b8a1b4d1c6a6b21ba542f4d19852fa42d6eb084`; **WebP 216852 байта** SHA256 `1da88ca11053d3847e697a8863b83a1abdfcbcb6af3afbc9dbeb8f94a72c86a7`. PNG/WebP/metadata и исходный необрезанный SOURCE_RAW.png загружены в QISSA Library `/QISSA/production/seven_roads/series30/stage1/S3E11/`.
- Exact anchor `story3_part_3_three_pillars/story_text`: RU `Через некоторое время пришёл старший стражник из Араса.`, UZ `Birozdan keyin Arasdan kelgan katta qo‘riqchi kirdi.`, virtual reader **S3E11**.
- **Storage не загружен, runtime не подключён.** После пользовательской загрузки только `seven_roads_s3e11_senior_guard_sketches_arrival_01_APPROVED.webp` в `story-images/seven-roads/season2_tier_a_v2/`: независимый remote hash/HTTP, scene overlay/asset registry и RU/UZ gallery/CI; A02 пока остаётся not approved. S3E11 Stage1 **1/2 художественно принято**.

## S3E11-A02 — третья отклонённая попытка, 2026-11-16

- ImageGen candidate #3 **REJECTED**: повтор дневной S3E10 с молодым стражником у каменного водопоя. Нет вечернего двора Самиры, яблока, светло-серого Булута, почти чёрного Шамола, сидящего Темура; **не использовать**.
- Корректные точные якоря остаются RU `Булут потянулся к яблоку в её руке.` / UZ `Bulut uning qo‘lidagi olmaga cho‘zildi.` после общего слияния двух вариантов выбора, `story3_part_3_three_pillars/post_choice_text`.
- S3E11 Stage1 **1/2 художественно принято** (только A01), **0/2 технически интегрировано** до загрузки A01. Три A02 кандидата неверны; не подменять кадр другим сюжетом.

## Техническое подключение S3E11-A01 — 2026-11-16

- Supabase Storage `story-images/seven-roads/season2_tier_a_v2/seven_roads_s3e11_senior_guard_sketches_arrival_01_APPROVED.webp` подтверждён: **216852 байт**, `image/webp`.
- GitHub Actions Seven Roads **#43853456629** и Season 2 Tier A **#43853456607** SUCCESS: public HTTP GET, MIME, bytes, SHA256 `1da88ca11053d3847e697a8863b83a1abdfcbcb6af3afbc9dbeb8f94a72c86a7`, **17/17** файлов.
- Добавлен additive slot `SERIES30-S3E11-A01` к `story3_part_3_three_pillars`, `story_text`, после RU `Через некоторое время пришёл старший стражник из Араса.` / UZ `Birozdan keyin Arasdan kelgan katta qo‘riqchi kirdi.`, читательская **S3E11**. Asset URL добавлен в `authoredStoryAssets.ts`.
- Regression дополнен проверкой галереи S3E11: **прибывший стражник с закрытым листом → ранее утверждённая карта двух рисунков**, без переноса в S3E10. Новая CI/browser на изменённом коммите ещё не подтверждена. S3E11-A02 остаётся непринятым.
- Старые изображения, литературные RU/UZ JSON, выборы, story IDs и сохранённый прогресс не трогать. PR Draft, нет merge/deploy.

## Final art acceptance S3E11-A02 and A01 runtime verification — 2026-11-16

- **S3E11-A01 complete in RU/UZ reader:** Seven Roads CI #43853872463 and Season 2 Tier A Slot Check #43853872542 SUCCESS, **17/17 WebP**, **34/34 RU+UZ anchors**, gallery order arriving senior guard → existing two-drawings map, reader 5/4/11/10, typecheck/build/browser smoke PASS.
- **S3E11-A02 «Булут и яблоко» — ART ACCEPTED**. Вечером у конюшни Самиры девушка 12 лет в бордовом дорожном костюме с одной длинной косой протягивает яблоко своему светло-серому в яблоках коню Булуту **без белой звезды и с бордовым чепраком**. Рядом второй и последний конь Шамол почти чёрный с маленькой белой отметиной на лбу и бирюзовым чепраком. Темур в бирюзово-синем и тюбетейке сидит на низкой стене. Пояс/сабля Самиры спереди/сбоку; никаких стражников, третьей лошади, рыночного водопоя, выезда или спойлеров.
- Точные 1/1 RU `Булут потянулся к яблоку в её руке.` и UZ `Bulut uning qo‘lidagi olmaga cho‘zildi.` в `story3_part_3_three_pillars/post_choice_text` после объединения вариантов выбора; virtual S3E11.
- На нижнем краю нового сюжетно правильного кадра был слабый генеративный псевдотекст; **отрезаны только внешние поля** 44 px слева/справа и 50 px снизу. Итоговый PNG **1584×891**, SHA256 `6f68aea2d7f05fb62fe7bd8a16f04d55031f5dceecb639bd4baf875f2ce752ab`; WebP **214508 байт**, SHA256 `b7e9000bc9a9ac5febed08ca1e93a352b8bf70bc8f5c39ebab6fac139e9056e2`. PNG/WebP/metadata/raw исходный PNG в QISSA Library `/QISSA/production/seven_roads/series30/stage1/S3E11/`.
- **S3E11-A02 НЕ загружен в Supabase, НЕ интегрирован в runtime.** Следующая задача — пользовательская загрузка `seven_roads_s3e11_bulut_apple_evening_02_APPROVED.webp` в `story-images/seven-roads/season2_tier_a_v2/`; затем независимый public GET/MIME/length/SHA, additive overlay + asset registry, RU/UZ gallery (A01 → прежняя карта → A02), browser/CI.
- Прежние неверные S3E11-A02 кадры с городскими воротами/Надиром/водопоем остаются REJECTED. S3E11 Stage1 **2/2 художественно принято, 1/2 технически интегрировано**.

## Correction 2026-11-16 — S3E11-A02 approved status REVOKED (Bulut color drift)

- Владелец обнаружил, что после генерации Булут стал **почти кремово-белым** с чрезмерно светлой гривой вместо канонической **светло-серой в яблоках** окраски с серебристо-серой гривой и видимым серым контрастом (ref `01_heroes_horses_approved.png`). Белая отметина на лбу Шамола также чрезмерно велика. Ошибка была пропущена при первоначальной QA; **S3E11-A02 прежняя приёмка отозвана**.
- Оригинальный неправильно окрашенный `seven_roads_s3e11_bulut_apple_evening_02_APPROVED.webp` (SHA256 `b7e9000bc9a9ac5febed08ca1e93a352b8bf70bc8f5c39ebab6fac139e9056e2`) и PNG/metadata/raw перемещены в QISSA Library `/QISSA/production/seven_roads/series30/rejected/S3E11-A02_2026-11-16/` и переименованы `*_REJECTED`. **НЕ загружать** в Storage; этот asset ID удалён из списка принятых. Supabase Storage объекта нет, runtime его никогда не использовал.
- Создан исправленный вариант окраски (Самира с яблоком, Булут серебристо-серый в яблоках, Шамол почти чёрный), **только для повторной художественной проверки**: `/QISSA/production/seven_roads/series30/review/S3E11/seven_roads_s3e11_bulut_apple_evening_02_GREY_REVIEW_v2.png`, 1584×891, PNG SHA256 `3fe08ab700054f71a78067c2c7e046fe742411313d3dac8bad9bdb313f283dd6`. **Не маркировать APPROVED, не готовить WebP для загрузки до художественной приёмки этого кандидата.**
- S3E11 stage1 теперь **1/2 принято** (только A01), **1/2 интегрировано**. Общий Stage1 счёт **17/29 принято и 17/29 интегрировано**. Исходный RU/UZ художественный anchor A02 сохраняется для будущего правильного кадра без изменений литературного текста.

## Визуальная корректировка Булута — белая масть, 2026-11-16

- По прямому замечанию владельца повторно открыт **реальный approved character sheet** `01_heroes_horses_approved.png`: Булут воспринимается **белым (очень светлым серебристо-белым)**, с деликатными сероватыми яблоками и серой гривой. Предыдущая попытка «сделать серее» неверна; насыщенные тёмно-серые яблоки не соответствуют утверждённой картинке. Текстовое определение `светло-серый в яблоках` не означает, что в рендере он должен выглядеть серой лошадью.
- Подготовлен новый **только REVIEW** кандидат `seven_roads_s3e11_bulut_apple_evening_02_WHITE_REVIEW_v3.png`: белый Булут, бордовый чепрак, яблоко у Самиры, Шамол почти чёрный с бирюзовым чепраком, вечерний двор, Темур на низкой стене. PNG 1672×941, SHA256 `b2345196103b382d92f082d62b7f8761a9c7b4ed5ab84964510fb57ab526f6c8`. PNG и metadata в QISSA Library `/QISSA/production/seven_roads/series30/review/S3E11/`.
- **Не APPROVED:** новая картинка ожидает художественной проверки, включая размер отметины на лбу Шамола; предыдущие два кандидата остаются отдельно REVIEW v2 и REJECTED v1. `ART_QUEUE` не включает A02, WebP/Storage/runtime не подключены. Литературный текст не менялся.

## Owner acceptance of corrected near-white Bulut S3E11-A02 v3 — 2026-11-16

- **ART APPROVED — owner explicitly accepted** white-horse corrected `seven_roads_s3e11_bulut_apple_evening_02_APPROVED_v3` after viewing latest generated image. Bulut is visually nearly white with fine silver-gray dapples, burgundy saddlecloth, no forehead star; Shamol nearly black with a small white star and turquoise saddlecloth. In evening stable courtyard Samira offers apple while Temur sits on low wall. Prior S3E11-A02 v1 **REJECTED** and grey v2 **REVIEW** remain excluded; no old version may be reused.
- Master PNG **1672×941**, sha256 `b2345196103b382d92f082d62b7f8761a9c7b4ed5ab84964510fb57ab526f6c8`; optimized WebP **267928 bytes**, sha256 `1b982536b64a0289b3ee2cbb6a5ee553aad864a3eac2ae3744366f819435937b`. PNG, WebP, metadata stored in QISSA Library `/QISSA/production/seven_roads/series30/stage1/S3E11/`.
- Unchanged authored unique anchors `story3_part_3_three_pillars` / `post_choice_text`: RU `Булут потянулся к яблоку в её руке.` / UZ `Bulut uning qo‘lidagi olmaga cho‘zildi.`, virtual reader S3E11. Stage1 **2/2 art accepted**, **1/2 runtime integrated**.
- **Supabase Storage not uploaded yet.** Next: upload EXACT `seven_roads_s3e11_bulut_apple_evening_02_APPROVED_v3.webp` under `story-images/seven-roads/season2_tier_a_v2/`, verify public GET/MIME/bytes/SHA before any additive reader asset overlay/CI. No literary text/choice/progress edits; PR #334 Draft, no merge/deploy.

## S3E11-A02 white v3 — Storage and additive integration (2026-11-16)

- User-uploaded WHITE Bulut v3 WebP `seven_roads_s3e11_bulut_apple_evening_02_APPROVED_v3.webp` found in Supabase `story-images/seven-roads/season2_tier_a_v2/`, 267928 bytes, MIME image/webp. GitHub Actions **Seven Roads CI #43864305432** and **Tier A #43864305168** SUCCESS: public GET/MIME/length/SHA256 verified **18/18**; SHA `1b982536b64a0289b3ee2cbb6a5ee553aad864a3eac2ae3744366f819435937b`.
- S3E11-A02 additive slot added to original `story3_part_3_three_pillars/post_choice_text` after unique RU `Булут потянулся к яблоку в её руке.`, UZ `Bulut uning qo‘lidagi olmaga cho‘zildi.`; gallery order **senior guard arrives → approved map drawing → white Bulut apple**. Runtime reader CI/browser on this new commit still pending; do not claim full completion prematurely.
- Old incorrect coat v1 remains REJECTED, grey v2 REVIEW, both excluded. Original authored text, choice IDs and progress remain unchanged; PR Draft, no merge/deploy.
