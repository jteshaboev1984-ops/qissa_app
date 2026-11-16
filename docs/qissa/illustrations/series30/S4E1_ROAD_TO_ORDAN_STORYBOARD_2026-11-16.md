# QISSA — S4E1 «Дорога в Ордан» — Stage 1 storyboard

**Дата:** 2026-11-16. **Статус:** литературные RU/UZ якоря и композиция подготовлены; новый кадр ещё не принят. План: **Stage 1 ровно 1 shared иллюстрация**, **Stage 2 ещё 1** (не пересматривать количества).

## Источники и граница

- `src/data/authored/staging/season2Story4WaitedMan.ru.json` и `season2Story4WaitedMan.uz.json`: `story_id=seven_roads_chelovek_kotorogo_zhdut`, `story_version=interactive-v4`, `part_id=story4_part_1_false_notice_and_route_check`.
- Виртуальный читательский эпизод **S4E1** начинается в Арасе после возвращения из Сарвана, включает домашнюю встречу, совещание с капитаном, утренний выезд в Ордан и привал у Трёх столбов.
- Граница со **S4E2**: первый virtual split `Вдруг Самира заметила гнедого коня у крайней стойки навеса.` / `Shu payt Samira soyabonning chetki ustuniga bog‘langan to‘riq otni ko‘rdi.` — не изображать испуг гнедого коня, дальнейшие события, Камрана/Фарида или разбойников раньше времени.
- Существующие общие изображения S4E1 **не заменять**: `seven_roads_s2_story4_homecoming_01_APPROVED` (Темур дома после дороги), `seven_roads_s2_story4_three_pillars_01_APPROVED` (Темур осматривает старую трещину на высоком каменном столбе). Новая сцена **не повторяет** домашнюю встречу или крупный осмотр столбов.

## Визуальный канон

- QISSA Library `/QISSA/visual_refs/seven_roads_v1/01_heroes_horses_approved.png` — Темур и Самира по 12 лет, Темур бирюзово-синий дорожный костюм и синяя тюбетейка, Самира бордовая одежда, диадема, **одна коса**; широкие пояса пряжками **спереди**, церемониальные сабли **в ножнах на боку**.
- Шамол — почти чёрный конь с маленькой белой звёздочкой, **бирюзовый чепрак**, Темур едет на нём; Булут — светло-серый конь в яблоках, **без звезды**, бордовый чепрак, Самира едет на нём.
- Старший стражник из Араса — взрослый сопровождающий; использовать образ ранее принятого `S3E11-A01` как ближайший действительный образ старшего стражника, не путать его с Данияром, Камраном, отцом Камрана или капитаном.
- `/QISSA/production/seven_roads/season2_visual_final/tier_a_story_frames/seven_roads_s2_story4_homecoming_01_APPROVED.png` и `.../seven_roads_s2_story4_three_pillars_01_APPROVED.png` — архитектура, пейзаж, continuity; референс `/QISSA/production/seven_roads/season2_visual_final/refs/seven_roads_road_post_ref_01_APPROVED.png` только для последующих дорожных постов, **не показывать столбы преждевременно**.
- `seven_roads_painterly_v1`, горизонтальный 16:9, тёплая живая книжная живопись, без надписей, водяных знаков или новых гербов.

## S4E1-A01 — «Утренний выезд в Ордан»

Новый общий кадр на ранней широкой дороге из Араса в Ордан, вскоре после утреннего отъезда. Темур **верхом на Шамоле**, Самира **верхом на Булуте**, рядом/немного позади — **один старший стражник верхом** на безымянном дорожном коне. Дети не стоят на дороге и не бегут пешком. Городские стены Араса уже отступают вдаль; встречные телеги/почтовые всадники могут присутствовать **только фоном**, вдали угадывается Восточный лес. Три героя движутся спокойно и уверенно на широкой дороге к Ордане. Не повторять старый выезд каравана или домашнюю встречу.

**Уникальные точные якоря, `story_text` (по одному полному абзацу RU/UZ):**

- RU: `На следующее утро Темур и Самира выехали в Ордан.`
- UZ: `Ertasi tong Temur va Samira Ordan tomon yo‘lga chiqdi.`

Абзац 74 из source `story4_part_1_false_notice_and_route_check`, до S4E2 virtual split. Кадр должен появиться **после** homecoming и **до** ранее утверждённых `three_pillars`, только в S4E1.

**Нельзя:** отражать результаты будущего выбора, появление подозрительного гнедого коня, знак синего треугольника на мешках (позднее), спойлеры о сети, три столба в кадре отъезда, сцену следующей серии, придуманную символику; переставлять лошадей и чепраки; изображать лишних детей или ведущего всадника без персонажного основания.

## Производство и QA

Проверить ближайшие события и реальные approved Library PNG до ImageGen. Один кадр за раз. Если композиция неверная — REJECTED без реестра. Только после литературной и визуальной приёмки PNG-master → WebP → SHA256 → QISSA Library → user upload `story-images/seven-roads/season2_tier_a_v2/` → независимая публичная HTTP/MIME/bytes/SHA256 CI → additive scene overlay/URL in `series30ApprovedSceneSlots.ts`/`authoredStoryAssets.ts` → S4E1 RU/UZ gallery/order/lock and 5/4/11/10/typecheck/build/browser CI.

Никаких изменений авторских RU/UZ JSON, выборов, ID, прогресса, существующих assets; PR #334 остаётся Draft, merge/deploy запрещены.

## Первая генерация S4E1-A01 — REJECTED (2026-11-16)

- ImageGen candidate #1 **REJECTED**: модель снова показала знакомый дневной S3E10 с Темуром, Самирой и молодым стражником у городского водопоя. В кадре отсутствуют верховые Шамол/Булут, старший стражник в дороге и утренний выезд из Араса в Ордан. Это чужой эпизод; не сохранять и не подключать.
- **S4E1 Stage1 остаётся 0/1, Stage2 0/1**. Точный сценарий и RU/UZ якоря выше не меняются. Следующая генерация только в новом изолированном контексте с утверждённым листом двух лошадей и с самого начала заданной тройкой верховых персонажей. Не повторять неудачный водопой. `ART_QUEUE` не содержит фиктивно принятого S4E1 изображения.

## S4E1-A01 — дополнительные ошибочные изображения, 2026-11-16

- **Кандидат #2 REJECTED**: вместо выезда из Араса показаны стоящие у конюшни Темур/Самира, светлая и тёмная лошади, яблоко — повтор S3E11. Нет верховой поездки, старшего стражника или дороги.
- **Кандидат #3 REJECTED**: снова вечернее кормление яблоками у конюшни, теперь неканоничный гнедой конь с белой проточиной вместо Шамола. Нет трёх всадников и утренней дороги.
- Все три попытки S4E1-A01 отклонены: #1 повтор водопоя S3E10, #2/#3 повтор конюшни S3E11. **Не загружать, не регистрировать, не интегрировать. S4E1 Stage 1 0/1.** Для следующего инструмента — действительно изолированный контекст с тремя верховыми героями на широком пути из Араса, без конюшни и яблок.

## New scene-correct but NOT APPROVED S4E1-A01 candidate — 2026-11-16

- A new **16:9 three-mounted-rider dawn road** candidate finally matches major scene blocking: Temur rides near-black Shamol with teal saddlecloth, Samira rides visually white Bulut with burgundy saddlecloth (per latest owner-approved white version), a senior adult escort follows on another horse, city Aras recedes behind. No apple, stable, water trough, stone pillars or future bay horse. **However rider's identity is wrong**: the escort wears a wrapped headdress and brown travel clothes, unlike APPROVED S3E11-A01 adult senior guard in helmet, brown-red armor and gray beard.
- Therefore **REVIEW, NOT APPROVED**: `seven_roads_s4e1_dawn_road_three_riders_REVIEW_v1.png`, PNG 1672×941, SHA256 `221f6d73f9e294446e9a3801fd564cbf588535478653d71f098382695ac9a67e`, with metadata in QISSA Library `/QISSA/production/seven_roads/series30/review/S4E1/`. The final accepted S3E11-A01 reference is `/QISSA/production/seven_roads/series30/stage1/S3E11/seven_roads_s3e11_senior_guard_sketches_arrival_01_APPROVED.png`.
- Two attempted targeted corrections **REJECTED**: image generator output an unrelated dashboard containing fabricated claims about Storage/CI, then repeated prior S3E11 apple scene. Neither should ever be treated as real proof or artwork. Do not retry without a different truly isolated generation/editing approach.
- **S4E1 0/1 Stage1 still**; no APPROVED file, WebP, upload or runtime slot. Required change: adult guard's bronze helmet, salt-and-pepper beard, brown/red armored travel outfit and correct identity. Keep both children riding correct horses, front belt buckles, sheathed sabers, Aras dawn scene. No authored RU/UZ JSON/choice/progress changes.

## New accepted S4E1-A01 dawn road illustration (2026-11-16)

- Owner **explicitly approved** new `seven_roads_s4e1_dawn_departure_to_ordan_01_APPROVED`, separate from earlier `REVIEW_v1` (wrong senior guard identity). Updated image shows Temur riding near-black Shamol with small white star and turquoise cloth, Samira riding visually WHITE Bulut with burgundy cloth and no forehead star, adult senior guard in helmet/armor on solid chestnut escort horse, all three mounted on the morning road from Aras to Ordan. Belts have FRONT clasps and sabers are sheathed at sides. No apple/stable/watering trough/pillars/bay-horse episode or spoilers.
- Original PNG **1672×941**, sha256 `31de773a6339d896436e25881d4ab20eecfb19cc0466b9965dcb5de6dc52e62b`; WebP **326202 bytes**, sha256 `998a4ad57d178ef87439f253a0fb2ee005d54109b681ae9c7023738ad2090107`, plus metadata, stored in QISSA Library `/QISSA/production/seven_roads/series30/stage1/S4E1/`.
- Exact original bilingual anchor source `story4_part_1_false_notice_and_route_check/story_text`: RU `На следующее утро Темур и Самира выехали в Ордан.` / UZ `Ertasi tong Temur va Samira Ordan tomon yo‘lga chiqdi.`. **Stage1 art 1/1 accepted**. **Storage not uploaded, runtime not integrated**. Only after user upload to `story-images/seven-roads/season2_tier_a_v2/`, remote HTTP/MIME/byte/SHA proof, add overlay with gallery order homecoming → departure → existing three pillars. Stage2 still one more image planned.

## S4E1-A01 owner-approved dawn departure — Storage SHA verified and reader wired (2026-11-16)

- Supabase `story-images/seven-roads/season2_tier_a_v2/seven_roads_s4e1_dawn_departure_to_ordan_01_APPROVED.webp` confirmed `image/webp`, 326202 bytes, SHA256 `998a4ad57d178ef87439f253a0fb2ee005d54109b681ae9c7023738ad2090107` via independent GitHub Actions Seven Roads **#43868285579** and Season 2 Tier A **#43868285540**, both SUCCESS, **19/19** public WebP GET/MIME/bytes/SHA.
- Added additive runtime `SERIES30-S4E1-A01` after the exact RU `На следующее утро Темур и Самира выехали в Ордан.` / UZ `Ertasi tong Temur va Samira Ordan tomon yo‘lga chiqdi.` in `story4_part_1_false_notice_and_route_check/story_text`. Registered public URL without changing authored RU/UZ JSON, choice IDs, saved progress or old asset IDs.
- Regression checks for S4E1 RU/UZ gallery **homecoming → dawn departure → existing three pillars**, no leakage into S4E2 and existing locked/unlocked behavior; CI on this new commit is still pending. Old `REVIEW_v1` remains NOT APPROVED. Stage 1 S4E1 1/1 artistic approval, runtime wiring pending final CI. Stage2 count unchanged at 1.
