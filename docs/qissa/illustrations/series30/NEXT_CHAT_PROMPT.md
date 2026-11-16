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
