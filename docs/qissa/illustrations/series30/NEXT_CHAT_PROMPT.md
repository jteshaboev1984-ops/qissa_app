# QISSA current 30-series illustration handoff — 2026-11-16

**HEAD before this change:** `c158247ec613d3d2dcac9753eb33818a4d9d6b5d`, branch `qissa/four-seasons-chronological-runtime-20261112`, PR #334 Draft, repo `jteshaboev1984-ops/qissa_app`. Always re-read actual HEAD, CI and ART_QUEUE.

**Approved scope unchanged:** seasons 5/4/11/10 = 30, Stage 1 **29 new story illustrations**, Stage 2 **19**, plus S4 cover **1**.

**Current Stage 1:** **18/29 artistically approved**, **17/29** verified uploaded and wired RU+UZ; **1 newly approved S3E11-A02** pending Storage. S3E11-A01 `seven_roads_s3e11_senior_guard_sketches_arrival_01_APPROVED.webp` uploaded and integrated, CI Seven Roads #43853872463 and Tier A #43853872542 SUCCESS, **17/17 remote WebP**, **34/34 RU/UZ anchors**, gallery and browser smoke.

**User upload next:** `seven_roads_s3e11_bulut_apple_evening_02_APPROVED.webp` (214508 bytes, SHA256 `b7e9000bc9a9ac5febed08ca1e93a352b8bf70bc8f5c39ebab6fac139e9056e2`) from QISSA Library `/QISSA/production/seven_roads/series30/stage1/S3E11/` to Supabase bucket `story-images` path `seven-roads/season2_tier_a_v2/`. PNG 1584×891, WebP, SHA metadata and raw file are available in Library. After upload verify storage.objects and independent public remote SHA CI **before** adding runtime A02.

**S3E11-A02 anchor:** authored `seven_roads_dve_bashni` original `story3_part_3_three_pillars`, `phase=post_choice_text`, RU `Булут потянулся к яблоку в её руке.` / UZ `Bulut uning qo‘lidagi olmaga cho‘zildi.`, virtual episode S3E11. Add slot only via `src/data/series30ApprovedSceneSlots.ts` + URL registry `src/data/authoredStoryAssets.ts`. Gallery expected sequence **S3E11 A01 guard enters → existing two drawings map → S3E11 A02 apple**; verify RU/UZ, locks, no spoilers, typecheck/build/browser CI. Prior A02 ImageGen candidates (gate route, Nadir chase, water trough) were all REJECTED.

**Next new Stage 1 scene** after S3E11: S4E1-A01 `Утренний выезд в Ордан`, prepared `docs/qissa/illustrations/series30/S4E1_ROAD_TO_ORDAN_STORYBOARD_2026-11-16.md`. Temur on Shamol nearly black white forehead star teal saddlecloth, Samira on Bulut grey dapple no star burgundy saddlecloth, one adult senior guard mounted behind, dawn on wide road leaving Aras. Previous wrong candidate repeated S3E10 water trough and was REJECTED. Stage1 S4E1 0/1. Further queue S4E3, S4E4, S4E5, S4E6, S4E8, S4E9, S4E10. Do not revise 29+19+1.

**Never** change authored RU/UZ literature, choices, progress, existing APPROVED assets; don't merge PR or deploy. All art before runtime: exact bilingual literary QA → actual approved reference QA → single image → self reject wrong composition → PNG/WebP/SHA/QISSA Library → confirmed Supabase upload → independent SHA verification → additive reader overlay → focused CI/gallery/browser.

## Earlier handoff history

## Additional checkpoint 2026-11-16 — S4E1-A01 rejected

- `docs/qissa/illustrations/series30/S4E1_ROAD_TO_ORDAN_STORYBOARD_2026-11-16.md` created and source RU/UZ verified. ImageGen candidate #1 incorrectly repeated **S3E10 guard and children at water trough**; REJECTED, not in Library or runtime. S4E1 0/1 Stage1, 1 more Stage2 planned. For future generation use completely isolated prompt and APPROVED horses sheet; do not reuse stale water-trough composition.
- S3E11 A01 accepted but still pending Supabase Storage; see links/sha in prior handoff. S3E11 A02 3 failed attempts and remains 0/1. Total artistically accepted remains 17/29 and integrated 16/29; no more images accepted in this checkpoint.

## New status 2026-11-16 — S3E11 A02 rejected; S4E1 prepared

- Stage 1 **17/29 artistically accepted**, **16/29 verified uploaded + runtime integrated**; S3E11-A01 newly accepted WebP 216852 bytes SHA `1da88ca11053d3847e697a8863b83a1abdfcbcb6af3afbc9dbeb8f94a72c86a7` in Library, **NOT in Storage yet**.
- S3E11-A02 still not accepted. Three generated candidates rejected, most recent incorrectly repeated **daytime S3E10 guard/watering trough** rather than Bulut/Shamol/apple at Samira's stable at dusk. No wrong images in Library/registry/runtime. Storyboard updated with exact anchors.
- Next production scene optionally **S4E1-A01 «Утренний выезд в Ордан»**, prepared storyboard `docs/qissa/illustrations/series30/S4E1_ROAD_TO_ORDAN_STORYBOARD_2026-11-16.md`: Temur on almost-black Shamol with white star/teal saddlecloth, Samira on gray-dapple Bulut without star/burgundy saddlecloth, one senior guard behind, departing Aras on broad road at dawn, before three pillars and before S4E2 bay horse. Exact RU/UZ anchors in storyboard. Stage1 S4E1 currently 0/1.

# QISSA Seven Roads 30-series continuation — verified 2026-11-16

**Current branch:** `qissa/four-seasons-chronological-runtime-20261112`, Draft PR #334 in `jteshaboev1984-ops/qissa_app`. Last verified commit `1b6fed13459357c795960751f41ddca4cae6fc64` (recheck live HEAD).

**Approved plan fixed:** four seasons 5/4/11/10; Stage1 29 new shared illustrations, Stage2 19, season 4 cover separately. Maintain original RU/UZ literary hashes, approved canon/story/choice IDs and saved progress. Never merge or deploy without explicit approval.

**Verified art progress:** **17/29** Stage1 artistically accepted; **16/29** uploaded to Supabase, remote SHA verified and RU/UZ reader integrated; **1 S3E11-A01** newly accepted but awaits Storage/reader. S3E10 Stage1 **2/2 COMPLETE**: remote 16/16 WebP and 32/32 RU/UZ anchors; Seven Roads CI **#43850831913** SUCCESS and Season 2 Tier A **#43850831761** SUCCESS, gallery and browser smoke PASS.

**Upload next:** `seven_roads_s3e11_senior_guard_sketches_arrival_01_APPROVED.webp`, **216852 bytes**, SHA256 `1da88ca11053d3847e697a8863b83a1abdfcbcb6af3afbc9dbeb8f94a72c86a7`. QISSA Library `/QISSA/production/seven_roads/series30/stage1/S3E11/` contains final PNG (1584x891), WebP, metadata and source raw PNG. Upload exact file to Supabase `story-images/seven-roads/season2_tier_a_v2/`; then confirm Storage name/MIME/bytes, independent SHA in GitHub CI, additive bilingual slot in `src/data/series30ApprovedSceneSlots.ts` + URL `src/data/authoredStoryAssets.ts`, check correct gallery position S3E11 before existing published map, full CI/browser. No literary changes.

**S3E11-A01** exact source `src/data/authored/staging/season2Story3TwoTowers.ru.json` / `.uz.json`, story ID `seven_roads_dve_bashni`, part `story3_part_3_three_pillars`, `story_text` after RU `Через некоторое время пришёл старший стражник из Араса.` / UZ `Birozdan keyin Arasdan kelgan katta qo‘riqchi kirdi.`. Final is an arriving senior guard with **unopened sketches** inside Sarvan guardroom; no wax seal or drawn pillar sign shown. Previous outdoor scene was REJECTED.

**Continue creation:** S3E11-A02 `Булут и яблоко`, 1 new Stage1 art, not yet accepted. Storyboard: `docs/qissa/illustrations/series30/S3E11_THREE_PILLARS_STORYBOARD_2026-11-16.md`. Evening at Samira's house stable: 12-year-old Samira in burgundy offers apple to dapple-gray Bulut (NO white star, burgundy saddlecloth), nearly-black Shamol behind with small white forehead star and teal saddlecloth; 12-year-old Temur sits on low wall. Original RU `Булут потянулся к яблоку в её руке.`, UZ `Bulut uning qo‘lidagi olmaga cho‘zildi.`, phase `post_choice_text`. DO NOT show third horse or departure to Ordan, road, captures or spoilers. Two earlier generated wrong scenes were REJECTED. Verify full RU/UZ fragment & actual Library horse refs before regeneration. Then continue S4 stage1 queue in order.

**Required rules:** read AGENTS.md, relevant specs, actual CI, ART_QUEUE, storyboards, World Bible and visual refs before generating. Each new image must be reviewed, rejected if wrong; only accepted file: source PNG → optimized WebP → SHA → QISSA Library → verified Supabase Storage → additive reader scene → CI/gallery/browser. No changes to authored literature, choices, persisted progress, merge, deploy or payment features.

## Historical handoff (older)
## Художественная проверка S3E11 (дополнение 2026-11-16)

- **S3E11-A01 всё ещё не принято:** ImageGen нарисовал уличный водопой с письмом и красной печатью — REJECTED, а Canva с утверждённым интерьером `MAHbEh3EeZI` ответила `quota_exceeded`. Не интегрировать. S3E11 Stage1 0/2.
- S3E10-A02 WebP (243188 байт, SHA `c9dfc2162dd0c17d3b5d893d632b1da30c26ecbabe0f825b656727752a5437bf`) по-прежнему требует подтверждённой загрузки пользователем и последующего RU/UZ runtime/CI. Проверить фактический Storage в следующем шаге. Всего 16/29 художественно принято и 15/29 runtime интегрировано на последнем подтверждённом коммите.

# QISSA — актуальная передача работы 30 иллюстрированных серий

**Приоритет: эта запись проверена 2026-11-16 на PR #334 HEAD 713f9205fbf327058626733103167358226fe3e3.** Старые разделы ниже считать историческими там, где есть противоречия.

- GitHub `jteshaboev1984-ops/qissa_app`, рабочий Draft PR #334, ветка `qissa/four-seasons-chronological-runtime-20261112`. Перед изменениями проверить новый HEAD и CI.
- Не менять утверждённый план 5/4/11/10 = 30 серий, Stage1 29 + Stage2 19 + 1 обложка четвёртого сезона.
- **16/29 Stage1 художественно принято. 15/29 технически интегрировано и проверено** (все предыдущие 14 + S3E10-A01 исправленная `APPROVED_v2`). `#43847796923` Seven Roads и `#43847796845` Tier A успешны: 15/15 remote WebP SHA, 30/30 RU/UZ anchors, корректная галерея, typecheck/build/browser smoke.
- **S3E10-A02 «Стражник принёс известие» только что принято, но НЕ загружено в Supabase и НЕ подключено к читателю**. QISSA Library `/QISSA/production/seven_roads/series30/stage1/S3E10/seven_roads_s3e10_young_guard_water_trough_02_APPROVED.webp`, 243188 байт, SHA256 `c9dfc2162dd0c17d3b5d893d632b1da30c26ecbabe0f825b656727752a5437bf`. PNG мастер 1611×906, metadata. Сцена: Темур/Самира и молодой стражник у каменной поилки караула, до его сообщения. RU anchor `К ним подошёл молодой стражник.`; UZ `Ularning oldiga yosh qo‘riqchi keldi.`; `story_id=seven_roads_dve_bashni`, `part_id=story3_part_2_courier_route`, `phase=story_text`, virtual episode S3E10. После пользовательской загрузки в `story-images/seven-roads/season2_tier_a_v2/`: remote GET/MIME/byte/SHA; `series30ApprovedSceneSlots.ts`, `authoredStoryAssets.ts`, gallery RU/UZ и CI.
- Старый S3E10-A01 `APPROVED` был **отозван** из-за поясов и ножен сзади; хранится лишь в Library `rejected`, никогда не подключался. Исправленный `APPROVED_v2` уже в runtime. Повторные ошибки A02 с восковым письмом/знамёнами REJECTED; финальная версия A02 получена из первого сюжетно правильного кадра с обрезкой только 35 px нижней границы и 30 px краёв для удаления псевдобукв.
- Далее S3E11 «Три столба»: storyboard `docs/qissa/illustrations/series30/S3E11_THREE_PILLARS_STORYBOARD_2026-11-16.md`, Stage1 A01 взрослый стражник приносит **закрытый лист** с рисунками в караул Сарвана (не раскрывать знак), A02 поздний вечер и Булут тянется к яблоку Самиры, рядом Шамол, Темур на низкой стене. Сохранять канон коней, расположение ножен, возраст 12 лет. Ранее две неверные генерации S3E11-A02 — REJECTED.
- После каждой художественной приёмки: PNG → WebP → sha256 → QISSA Library → подтверждённая Storage загрузка → независимый remote SHA → RU/UZ overlay → CI/gallery/browser. Исходные литературные RU/UZ JSON SHA-protected, story/choice IDs, progress keys и существующие утверждённые изображения не изменять. Без owner-specific разрешения НЕ объединять PR, НЕ публиковать и НЕ развёртывать приложение.

## Исторические чекпоинты (для следа, не как текущее состояние)

# QISSA — продолжение иллюстрирования 30 серий «Семь дорог»

Дата актуализации: 2026-11-16. Продолжать текущий проект, не начинать заново.

**Репозиторий** https://github.com/jteshaboev1984-ops/qissa_app · **PR #334** Draft, open · **ветка** `qissa/four-seasons-chronological-runtime-20261112`. Перед работой читать фактический HEAD.

**План (не пересматривать):** 4 сезона = 5/4/11/10 = 30 серий. Stage 1 = 29 новых сюжетных WebP, Stage 2 = 19, отдельно 1 обложка S4. Исходные литературные RU/UZ JSON, варианты выбора, прогресс и ранее утверждённые изображения запрещено менять. Не объединять PR, не публиковать и не развёртывать без разрешения.

## Подтверждённое состояние

- **14/29** новых Stage1 изображений художественно принято.
- **14/29** (включая S3E6-A01) загружены в Supabase Storage и подключены через `src/data/series30ApprovedSceneSlots.ts` / `src/data/authoredStoryAssets.ts`. GitHub Actions **Seven Roads CI #43834685592** и **Season 2 Tier A Slot Check #43834685439** SUCCESS, **14/14** remote WebP SHA, **28/28** RU/UZ anchors, reader/gallery/choice locks, typecheck/build/browser smoke. S3E6 Stage1 1/1 завершён.
- **S3E10-A01 ПРЕЖНЕЕ УТВЕРЖДЕНИЕ ОТОЗВАНО (REJECTED)**: поясные пряжки и сабли ошибочно нарисованы на спинах. Старые `*_APPROVED.*` перемещены в QISSA Library `/QISSA/production/seven_roads/series30/rejected/S3E10-A01_2026-11-16/` и переименованы `*_REJECTED.*`; прежний WebP SHA256 `f6019df65fe015de03ff439a59738ea133c778c865ea4ec2de24b6d49b8d2c96` **НЕЛЬЗЯ ЗАГРУЖАТЬ И ИНТЕГРИРОВАТЬ**. Две попытки исправления тоже отклонены. Новый S3E10-A01 требуется создать и принять заново.
- S3E10-A01 authored `story_id=seven_roads_dve_bashni`, `part_id=story3_part_2_courier_route`, `phase=story_text`, virtual episode S3E10; RU `Темур несколько раз оглянулся, запоминая повороты и приметные места.`, UZ `Temur burilishlar va ko‘zga tashlanadigan joylarni eslab qolish uchun bir necha marta ortiga qaradi.`.
- **S3E10-A02** ещё НЕ принят; три новых генерации ошибочны (две повторяют изучение ворот, третья — побег Надира S3E6). Должен быть **юный стражник у каменной поилки рядом с караулом**, подходит к Темуру и Самире **до** объяснения про коричневого коня и курьера. RU `К ним подошёл молодой стражник.` / UZ `Ularning oldiga yosh qo‘riqchi keldi.`, same source part/phase/virtual episode.
- Следующие арт-сцены после S3E10: S3E11-A01 и A02 (точный storyboard уже подготовлен), затем S4 по `ART_QUEUE`. При неудачной генерации не утверждать похожие кадры.

## Основные документы
1. `docs/qissa/41_QISSA_30_Series_Illustration_Production_Plan_2026_11_14.md`
2. `docs/qissa/illustrations/series30/ART_QUEUE_2026-11-14.json`
3. `docs/qissa/illustrations/series30/PRODUCTION_RUNBOOK.md`
4. `docs/qissa/illustrations/series30/S3E10_COURIER_STORYBOARD_2026-11-16.md`
5. `docs/qissa/illustrations/series30/S3E11_THREE_PILLARS_STORYBOARD_2026-11-16.md`
6. `docs/qissa/illustrations/series30/S3E6_NADIR_ESCAPE_STORYBOARD_2026-11-16.md`
7. `docs/qissa/ai/SEVEN_ROADS_WORLD_BIBLE_V2.md`, `src/data/sevenRoadsReadingSeries.ts`, original RU/UZ authored JSON, Library visual refs.

Прежде каждой генерацией читать тексты и видеть реальные утверждённые изображения из QISSA Library, затем только одну иллюстрацию за раз. Сохранение после приёмки: PNG → WebP → SHA256 → Library → user Supabase Storage upload → independent remote GET/MIME/bytes/SHA → additive runtime overlay → RU/UZ/gallery/CI/browser. Никогда не записывать неподтверждённое как APPROVED.

## Дополнение по S3E11 — 2026-11-16

- `docs/qissa/illustrations/series30/S3E11_THREE_PILLARS_STORYBOARD_2026-11-16.md` содержит два точных RU/UZ кадра: A01 — взрослый стражник приносит закрытый лист с рисунками в караульное помещение (до показа карты), A02 — поздним вечером у конюшни Самира отводит яблоко от тянущегося к нему светло-серого Булута; рядом почти чёрный Шамол, Темур на низкой стене.
- **S3E11-A02 два отклонённых результата**: один подменил сцену дорогой к воротам и картой, второй — бегством Надира между повозками. Оба **REJECTED**. S3E11 stage1 0/2, ничего нового в ART_QUEUE/Library/Storage/runtime.
- Канон лошадей подтверждён реальным просмотром `/QISSA/visual_refs/seven_roads_v1/01_heroes_horses_approved.png`: Шамол почти чёрный с маленькой белой звёздочкой и бирюзовым чепраком, Булут светло-серый в яблоках без звезды и с бордовым чепраком. Не принимать кадр с другой парой/тремя лошадьми.

## Correction of S3E10-A01 visual acceptance (2026-11-16)

Previous approval was revoked after the owner found belts worn back-to-front and saber scabbards attached toward the rear. The source is archived REJECTED in Library; not in Supabase, not in runtime. S3E10 remains 0/2; overall artistic acceptance 14/29. Do not upload the old file; create a new correctly equipped scene with Samira pointing, Temur looking back, front-facing belt buckles and properly sheathed sabers on accessible hips.

## S3E10-A01 — новый кандидат принят, 2026-11-16

Вместо отозванного v1 создан **отдельный** корректный `seven_roads_s3e10_memorize_route_gate_01_APPROVED_v2`. Подтверждены: два ребёнка в канонических костюмах/головных аксессуарах, Самира указывает дорогу, Темур оглядывается, центральные пряжки спереди, ножны закреплены сбоку, надписей и неканоничных символов нет. В QISSA Library сохранены PNG, WebP (290850 байт, SHA256 `e63df78fe3da90648d688cd052443ace83248f1a9582cc2896b3b9bb5aadea09`) и metadata. Только ЭТУ новую v2 необходимо загрузить в `story-images/seven-roads/season2_tier_a_v2/`, после чего проверить Storage/remote SHA и интегрировать RU/UZ. **15/29 художественно приняты, 14/29 технически интегрированы; S3E10-A02 не принята**. Не путать со старым запрещённым `_REJECTED`.

## S3E10-A02 художественный блокер (2026-11-16)

После принятия исправленного S3E10-A01 v2 предприняты две отдельные попытки A02: **обе REJECTED**, снова нарисована Самира, указывающая путь к воротам, без молодого стражника и каменной поилки. С учётом трёх более ранних ошибок всего **пять неудачных генераций** S3E10-A02, ни одного принятого файла. Не пытаться представить очередную вариацию ворот как сцену у водопоя. А01 v2 корректна, не менять; загрузка её WebP в Supabase ещё нужна.
