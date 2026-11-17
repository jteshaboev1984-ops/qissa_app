# QISSA — S4E6 «Ложная дорога»: Stage1 A01 — севернее Каменного гребня

**Дата:** 2026-11-17. **Статус:** один `REVIEW_v1`, художественная приёмка владельца **не выполнена**. В Stage1 запланирован ровно один новый общий кадр S4E6. PR #334 Draft, без merge/deploy/publish.

## Канонический источник

- RU `src/data/authored/staging/season2Story5FalseRoad.ru.json` SHA `787fcc6109f2f20758bea4a592090e55fe17c806`.
- UZ `src/data/authored/staging/season2Story5FalseRoad.uz.json` SHA `b9df7fb184e1230c0d07be8999ab5cacb1131e3a`.
- `story_id=seven_roads_lozhnaya_doroga`, `story_version=interactive-v4`, `part_id=story5_part_1_false_road`, `phase=story_text`, `kind=shared`.
- Виртуальная граница S4E5/S4E6 — RU `Через несколько минут впереди появилась небольшая развилка.` / UZ `Bir necha daqiqadan keyin oldinda kichik ayrilish ko‘rindi.` (параграф 124, 0-based).
- Точный after_text S4E6-A01 (параграф 125, 0-based):
  - RU `Они уже находились по северную сторону Каменного гребня; Красный холм остался за ним и отсюда не был виден.`
  - UZ `Ular allaqachon Tosh tizmasining shimoliy tomonida edi; Qizil tepalik tizma ortida qolgan va bu yerdan ko‘rinmasdi.`
  - Совпадение **1/1 в обеих версиях**. После него детям ещё предстоит выбор между двумя открытыми дорогами. Результаты обеих ветвей, пост у Рустама и будущая встреча не показаны.

## Драматургия и композиция

- Новое пространство — **северная сторона Каменного гребня**. Красный холм скрыт за гребнем; вдали лес на востоке, просторные холмы. Уровень камеры широкий план со спины, три маленькие фигуры верхом и глубокая перспектива. Это **не** повторение уже утверждённого кадра `seven_roads_s2_story5_two_roads_blank_signpost_01_APPROVED` на точной развилке после `— Они открыты. Выбирайте.`.
- **Темур** ~12 в глубоком бирюзовом дорожном чапане и синей узорной шапочке на тёмно-гнедом Шамоле (почти чёрный издалека; белая узкая звезда на лбу закрыта ракурсом со спины), бирюзовая подпруга/покрывало; **Самира** ~12 с одной косой, кремовая одежда и бирюзовая наружная накидка, на пятнисто-сером Булуте с бордовым покрывалом; **Рахим** взрослый стражник в простой одежде на третьей лошади. Не менять пол/возраст/лошадей.
- Основание: World Bible V2 `APPROVED VISUAL CANON` для детей/лошадей; реальные approved refs `01_heroes_horses_approved.png`, `QISSA_MASTER_REFERENCE_user_selected.png`, `seven_roads_s2_story5_two_roads_blank_signpost_01_APPROVED.png`. Костюмный аудит от 11.11 — редакционная рекомендация, не новый канон.
- **Запрещено**: Красный холм на горизонте, развилка или пустые указатели в этом кадре, любой выбор одной ветки как будущий исход, патруль/разбойники, тюремная повозка, текст/символы дорожных указателей, фотографии/3D/современные детали.
- Примечание QA: на этом кадре кони показаны сзади, поэтому звезда на лбу Шамола и отсутствие звезды у Булута не проверяются визуально — лошадей различают по тёмно-гнедой/серой масти, попонам и владельцам. Стилистика `seven_roads_painterly_v1` — теплое живописное приключение, не фотореализм.

## REVIEW_v1

- Новый **один** кандидат ImageGen `0c89ce6a-d5cd-4033-9bea-ba6b08bcd333`.
- `seven_roads_s4e6_north_stone_ridge_riders_REVIEW_v1.png`: 1671×941 PNG, **3146922 bytes**, SHA256 `8d1fbee37a7267c6678b970851ab2d1350413ffb205669e88608df336fe1556d`. PNG + metadata JSON сохранены в QISSA Library `/QISSA/production/seven_roads/series30/review/S4E6/`.
- **Не считать `APPROVED` без явного подтверждения владельца**. Не изготавливать final WebP, не загружать Supabase, не регистрировать asset/slot runtime, не повышать принятый счетчик на этапе REVIEW.
- Stage1 **24/29 art approved, 23/29 technically integrated** (все текущие S4E6 assets 0/1, единственный кандидат на рассмотрении). PR Draft, без merge/deploy/prose/ID/progress изменений.

## 2026-11-17 — Final S4E6-A01 owner-approved Bulut correction

- Owner rejected earlier over-speckled, excessively gray and fully white-maned versions and explicitly **approved the latest** generation `30d91217-dc88-46a5-80b7-5bd2792e99b9`. Its light almost-white subtly gray-dappled Bulut has **dark charcoal-gray mane and tail**, burgundy saddle blanket and no forehead blaze; Shamol remains dark bay with teal blanket. No invented Red Hill appearance, road-fork sign or future route choice. Do not reuse earlier rejected images.
- Final asset `seven_roads_s4e6_north_stone_ridge_riders_01_APPROVED`, immutable master PNG **1670×941**, **2903929 bytes**, SHA256 `ac8e97a5eff85abb71ee2b23318c698eedd93c816d71358d6bc85f4e180842e6`; derived WebP q92/method6 **476610 bytes**, SHA256 `685129bc2ea5c18f575d8ef6e9253ae4c2e706b58a07d4cf67ade9e587cc9816`. PNG/WebP/metadata saved in QISSA Library `/QISSA/production/seven_roads/series30/stage1/S4E6/`.
- Target Supabase bucket `story-images`, object `seven-roads/season2_tier_a_v2/seven_roads_s4e6_north_stone_ridge_riders_01_APPROVED.webp`; **not uploaded / verified absent at check**. No public SHA or runtime slot, no deploy. S4E6 Stage1 **1/1 art approved**, **0/1 integrated**; total Stage1 **25/29 art accepted**, **23/29 technically verified integrated** pending separate S4E5-A02 CI.

## 2026-11-17 — S4E6-A01 owner-uploaded WebP found / runtime integration CI pending

- Supabase `storage.objects` independently confirms the owner uploaded `seven_roads_s4e6_north_stone_ridge_riders_01_APPROVED.webp` into `story-images/seven-roads/season2_tier_a_v2/` at **2026-11-17 06:56:10Z**, `image/webp`, **476610 bytes**. SHA-256 expected `685129bc2ea5c18f575d8ef6e9253ae4c2e706b58a07d4cf67ade9e587cc9816` from owner-approved final WebP. Public remote GET/SHA requires CI before status closure.
- Draft PR #334: additive `SERIES30-S4E6-A01` RU/UZ `seven_roads_lozhnaya_doroga/story5_part_1_false_road/story_text` after unique exact paragraph 125 about Stone Ridge northern side. Code/registry/25th public-verification asset and S4E6 reader/gallery/seen/unseen/S4E5 isolation checks added. Must still pass 25/25 public WebPs, 50/50 bilingual anchors, four-seasons/reading-series/typecheck/build/browser.
- Stage1 stays **25/29 artistic accepted, 24/29 fully integrated until CI**. S4E8 artistic A01 still REVIEW-only; do not register/upload it without owner approval. No literary JSON/IDs/progress/merge/deploy.
