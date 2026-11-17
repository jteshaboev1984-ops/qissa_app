# QISSA — S4E5 «Северная дорога»: Stage1 A01 storyboard / candidate review

**Дата:** 2026-11-17. **Статус:** 1 кандидат **REVIEW**, не утверждён. У S4E5 Stage1 **2 новых общих кадра** запланировано; A02 пока без утверждённого сюжета и якоря. Ничего не публиковать. PR #334 Draft.

## Достоверный литературный источник

- RU `src/data/authored/staging/season2Story5FalseRoad.ru.json` SHA `787fcc6109f2f20758bea4a592090e55fe17c806` и UZ `season2Story5FalseRoad.uz.json` SHA `b9df7fb184e1230c0d07be8999ab5cacb1131e3a`.
- `story_id=seven_roads_lozhnaya_doroga`; `part_id=story5_part_1_false_road`; `story_version=interactive-v4`; `phase=story_text`.
- Виртуальная серия **S4E5** содержит часть до разреза по RU `Через несколько минут впереди появилась небольшая развилка.` / UZ `Bir necha daqiqadan keyin oldinda kichik ayrilish ko‘rindi.` (абзац 124; после него S4E6). **S4E5-A01** в абзаце 35, до развилки и до выбора пути.
- RU exact after_text: `Он провёл пальцем от левой брови к виску.`.
- UZ exact after_text: `U barmog‘ini chap qoshidan chakkasigacha yurgizdi.`.
- Обе версии имеют **ровно одно** совпадение.
- Контекст: Надир рассказал о неизвестном человеке сети с тёмными волосами и тонким светлым шрамом от **левой брови к виску**. Сам Надир без шрама, **только показывает жест**. За старым складом его внимательно слушают Саид, Рахим, Темур и Самира. Существующий кадр `seven_roads_s2_story5_red_hill_recon_01_APPROVED` стоит позднее в сцене `— Разведка их нашла.` и не заменяется.

## Сцена A01 — «Примета человека со шрамом»

- Визуал: теплый книжный живописный мир `seven_roads_painterly_v1`, двор за старым складом, дневной свет, беседа взрослых, двое детей-наблюдателей примерно 12 лет; главный смысл — важная примета, которую Надир показывает **на себе жестом**, не будучи обладателем шрама.
- Никакого нового персонажа со шрамом, вымышленного лица связного, тюремной повозки, засады, карты ещё не показанного пути, гербов/текста на изображении; не выдавать будущий исход.
- Приёмка владельца: убедиться, что жест понятен, Саид и Рахим не перепутаны, их костюмы не противоречат утверждённому визуальному канону, юные Темур и Самира выглядят как дети, живописный стиль подходит мастер-референсам, отсутствие реалистического травмирующего шрама на Надире.

## Кандидат REVIEW_v1

- ImageGen generation id `dbbb9fe9-f7de-4827-bcc6-514fb91a3438` — **ровно один новый кадр**.
- `seven_roads_s4e5_nadir_scar_clue_briefing_REVIEW_v1.png`: **1672×941**, **2637739 bytes**, SHA256 `f3e1468701792c539bc901be019491a15444c64a727ab0d2795a7de1f1bfe4d2`.
- QISSA Library: `/QISSA/production/seven_roads/series30/review/S4E5/` содержит REVIEW PNG и REVIEW metadata JSON. Не делать APPROVED/WebP/Storage/runtime до явного решения владельца.
- Stage1 total остаётся **22/29 artistic accepted**, **21/29 verified runtime integrated**; S4E4 A02 ожидает user WebP upload, S4E5 **0/2 artistically accepted**. Не merge/deploy/publish и не трогать литературные тексты/ID/progress.

## S4E5-A01 — костюмная сверка с исходным текстом и утверждёнными референсами (2026-11-17)

- В точном `story5_part_1_false_road/story_text` абзаце 35 текст описывает **жест Надира** (от левой брови к виску), а не новую одежду. В предыдущих абзацах: Саид — начальник стражи Орданы, Рахим — стражник из Араса, дети Темур и Самира стоят чуть дальше. Не рисовать шрам на лице Надира, поскольку это примета **другого человека**.
- Реальные визуальные референсы изучены: `seven_roads_said_ref_01_APPROVED.png` (короткие седоватые волосы/борода, тёмная бордово-угольная форма без тюрбана, небольшая круглая застёжка), `01_heroes_horses_approved.png` (Темур ~12, бирюзовый чапан/синяя узорная шапочка, Самира ~12 с косой), `QISSA_MASTER_REFERENCE_user_selected.png` и `seven_roads_s2_story5_two_roads_blank_signpost_01_APPROVED.png` (кремовая одежда Самиры с бирюзовой дорожной накидкой). `2026-11-11_temur_samira_costume_chronology_audit.md` — объясняющий аудит, не новая норма.
- **REVIEW_v1** имел двух тюрбанных взрослых и визуально не совпадал с утверждённым Саидом. **REVIEW_v2** (`seven_roads_s4e5_nadir_scar_clue_briefing_REVIEW_v2`) corrected composition: Надир на переднем плане в простой одежде и головной повязке, жестом показывает положение шрама без собственного шрама; Саид с утверждённым обликом/униформой, Рахим в приглушённой практичной одежде стражника без выдуманной символики, оба ребёнка дальше от разговора, Темур в бирюзовом, Самира в кремовом/бирюзовом дорожном ансамбле. Рахим: отдельного утверждённого портрета не обнаружено, поэтому детали одежды — осторожная художественная интерпретация.
- Изображение `REVIEW_v2` создано один раз, ImageGen `eccbf236-4a5f-4b3c-a27c-fbda970482d5`, PNG **1672×941**, **2818865 bytes**, SHA256 `d5fdb33ec1d764966d8b7919babcc5e81af23e89361cad2286c6400fb58769ae`. PNG и metadata JSON сохранены в `/QISSA/production/seven_roads/series30/review/S4E5/`. **Владелец ещё не принимал**: S4E5 Stage1 **0/2** художественно принято, без WebP/Storage/runtime для этого кадра.

## S4E5-A01 — условная художественная приёмка подтверждена сравнением костюмов (2026-11-17)

- Владелец: «вроде одежда детей чуть отошла. проверь это с вариантами смены их одежды. если допустимо принимаем. если нет доработай». Сравнены **пиксели** `REVIEW_v2` с реальными `01_heroes_horses_approved.png`, `QISSA_MASTER_REFERENCE_user_selected.png`, `seven_roads_s2_story5_two_roads_blank_signpost_01_APPROVED.png`, World Bible V2 и `2026-11-11_temur_samira_costume_chronology_audit.md` (**proposal**, не утверждённый canon).
- **Вердикт: допустимо, приёмка состоялась.** Темур сохраняет основной тёмно-бирюзовый чапан / узорную синюю шапочку, мальчик около 12. На более позднем уже принятом кадре развилки дорожный шарф может появляться как надетый внешний слой — не полная смена костюма. Самира с одной косой, около 12; кремовая одежда и бирюзовый дорожный внешний слой **уже присутствуют** в утверждённом кадре развилки и мастер-референсе. В этом эпизоде не требуется придумывать новую смену одежды между разговором у склада и выездом. Эта приёмка **не утверждает** вторую полную одежду Самиры и не меняет World Bible/тексты.
- Зафиксирован финальный asset `seven_roads_s4e5_nadir_scar_clue_briefing_01_APPROVED`. PNG **1672×941**, **2818865 bytes**, SHA256 `d5fdb33ec1d764966d8b7919babcc5e81af23e89361cad2286c6400fb58769ae` — те же пиксели `REVIEW_v2`; WebP quality92/method6 **454554 bytes**, SHA256 `733a1d9003653b0d97072a50948721d3334dff215a25f16083dd529c53af4ed7`; metadata JSON. Все три файла сохранены в QISSA Library `/QISSA/production/seven_roads/series30/stage1/S4E5/`.
- Supabase `story-images/seven-roads/season2_tier_a_v2/seven_roads_s4e5_nadir_scar_clue_briefing_01_APPROVED.webp`: объекта **не найдено** в `storage.objects`. Публичный GET/MIME/bytes/SHA и runtime **не подтверждены**. После пользовательской загрузки проводить независимую проверку и additive wiring `SERIES30-S4E5-A01`; exact RU/UZ anchors story_text paragraph 35, only S4E5 before split S4E6, preserve existing red hill recon image at p50.
- Stage1 **23/29 художественно принято, 22/29 интегрировано**. S4E5 1/2 art; 0/2 technical integration. A02 ещё не принят. No merge/deploy/publish, no prose/choice/progress changes.

## S4E5-A02 — один новый кандидат «Каменный гребень на карте», REVIEW_v1 (2026-11-17)

- `story_id=seven_roads_lozhnaya_doroga`, `part_id=story5_part_1_false_road`, `story_text`; виртуальная **S4E5** до абзаца 124 границы S4E6. После слов Саида о северной пограничной дороге:
  - RU exact anchor `Он провёл пальцем вдоль Каменного гребня.`
  - UZ exact anchor `U barmog‘ini Tosh tizmasi bo‘ylab yurgizdi.`
  - Каждый anchor встречается 1/1, абзац 69 (0-based).
- Сцена меняет план после разговорной S4E5-A01: крупно карта с **Каменным гребнем**, пальцем показывает Саид (темная угольно-бордовая форма как approved Said reference). Темур и Самира наблюдают за картой; костюмы совместимы с принятым S4E5-A01 и ранее утверждённой развилкой. Простая рукописная карта без читаемых современных надписей, без показа последствий выбора/засады; никакой тюремной повозки, неоправданных новых гербов или дорожных знаков.
- `seven_roads_s4e5_said_stone_ridge_map_REVIEW_v1.png`, 1672×941, **2735433 bytes**, SHA256 `384d8c38afdf57643fcefe25ed7a7058578f548629ab286a0639c6d7f7e39428`, generation id `e3e82d3b-5297-4ece-bea2-a3c2961332d5`. `PNG` + metadata `JSON` сохранены в Library `/QISSA/production/seven_roads/series30/review/S4E5/`. **REVIEW, owner acceptance pending**. Не называть APPROVED, не создавать runtime/Storage/WebP до принятия.
- S4E5 Stage1: **1/2 artistic accepted** (A01), A02 review only; **0/2 integrated** until user uploads A01 approved WebP and SHA verified. Всего Stage1 **23/29 artistic accepted, 22/29 integrated**. No authored JSON/choice/progress changes, no merge/deploy.

## S4E5-A02 — визуальная проверка лиц и кандидат REVIEW_v2 (2026-11-17)

- Проверены реальные пиксели `01_heroes_horses_approved.png`, `QISSA_MASTER_REFERENCE_user_selected.png`, `seven_roads_s2_story5_two_roads_blank_signpost_01_APPROVED.png` и `REVIEW_v1`. **REVIEW_v1 не соответствует узнаваемым лицам детей**: Темур слишком узколицый, с выраженными взрослыми скулами и строгим подростковым взглядом; Самира также выглядит старше (примерно 15–17), с вытянутым лицом; оба должны оставаться около 12 лет с мягкими округлыми детскими чертами, как на утверждённых портретах. Одежда / карта / жест Саида по-прежнему подходят. **REVIEW_v1 не принят**, не интегрировать.
- Новый `seven_roads_s4e5_said_stone_ridge_map_REVIEW_v2.png`, ImageGen id `d0947ea0-4d46-4c4b-abc7-07408d14b786`, 1671×941 PNG, **2669635 bytes**, SHA256 `9dd7d91096fe6a13b61777ab40ab041afcc766111d4c79086ae7df9ed0410273`. Создан как новая версия композиции с более округлыми лицами/крупнее глазами; это НЕ подтверждённая точная пиксельная правка исходного v1, исходный v1 оставлен неизменным. Review PNG + metadata JSON в `/QISSA/production/seven_roads/series30/review/S4E5/`. **Даже v2 ещё требует художественного утверждения владельцем и проверки лиц на полноту совпадения**, не считать APPROVED.
- Новая художественная приёмка S4E5-A02 не проводилась; новые runtime/Storage/очередные asset_id для A02 не создавались. 23/29 art accepted остаётся прежним.

## S4E5-A01 — integration verified after user upload (2026-11-17)

- Owner-uploaded final approved WebP in Supabase `story-images/seven-roads/season2_tier_a_v2/seven_roads_s4e5_nadir_scar_clue_briefing_01_APPROVED.webp` verified in GitHub Seven Roads CI [#44026077486](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/44026077486): HTTP GET, `image/webp`, **454554 bytes**, SHA256 `733a1d9003653b0d97072a50948721d3334dff215a25f16083dd529c53af4ed7`, all **23/23** approved WebPs pass. Exact RU/UZ image anchor and S4E5-only reader placement and gallery spoiler lock pass; **46/46** bilingual scene anchors verified. Season 2 Tier A [#44026077444](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/44026077444) SUCCESS. Typecheck/build/browser smoke PASS.
- Stage1 **23/29 accepted and integrated**; S4E5 **1/2 accepted and integrated**. S4E5-A02 first candidate rejected for age/facial-identity drift; v2 still **REVIEW and NOT approved**, no Storage/runtime for A02.

## S4E5-A02 — художественное утверждение REVIEW_v2 и производственный пакет (2026-11-17)

- Владелец явно принял исправленную версию `REVIEW_v2` после проверки детских лиц. `REVIEW_v1` отклонён (взрослые/вытянутые лица). Исходные пиксели `REVIEW_v2` сохранены без изменений, без нового рендера.
- Финальный `asset_id`: `seven_roads_s4e5_said_stone_ridge_map_02_APPROVED`. PNG `1671×941`, **2669635 bytes**, SHA256 `9dd7d91096fe6a13b61777ab40ab041afcc766111d4c79086ae7df9ed0410273`; WebP quality92/method6 **407158 bytes**, SHA256 `695169ea30439c45bb18745bc562c685359f583d27c28a76683ccf9a88b5ff10`. Все три файла (PNG/WebP/metadata JSON) сохранены в QISSA Library `/QISSA/production/seven_roads/series30/stage1/S4E5/`.
- Source `seven_roads_lozhnaya_doroga/story5_part_1_false_road/story_text`, RU `Он провёл пальцем вдоль Каменного гребня.`, UZ `U barmog‘ini Tosh tizmasi bo‘ylab yurgizdi.`, по 1 совпадению, абзац 69; виртуальный разрез S4E6 после абзаца 124. A02 общий кадр двух путей выбора и находится до развилки. Уже утверждённый `A01` и предыдущая сцена разведки Красного холма должны остаться на месте.
- Supabase `story-images/seven-roads/season2_tier_a_v2/seven_roads_s4e5_said_stone_ridge_map_02_APPROVED.webp` **не найден** на проверке; ожидается upload владельцем. Не подключать runtime до public GET/MIME/bytes/SHA. S4E5 Stage1 **2/2 художественно принято**, **1/2 интегрировано**. Total Stage1 **24/29 art accepted**, **23/29 integrated**. Без merge/deploy/publish или изменения литературного канона/сохранений.

## 2026-11-17 — S4E5-A02 located in Storage, additive runtime wiring submitted (CI pending)

- The accepted `seven_roads_s4e5_said_stone_ridge_map_02_APPROVED.webp` is now in Supabase `story-images/seven-roads/season2_tier_a_v2/`: storage.objects reports **407158 bytes**, `image/webp`, created 2026-11-17T06:16:41Z. Additive `SERIES30-S4E5-A02` bilingual anchor, asset URL, and reader/gallery tests added to Draft PR #334; public GET/MIME/bytes/SHA, full QA/browser CI **pending**. Gallery must order approved scar clue → existing Red Hill reconnaissance → approved Stone Ridge map, and S4E6 must not display the S4E5 map.
- Stage1 remains **25/29 art accepted** (includes owner-approved S4E6); **23/29 verified integrated** until new S4E5-A02 CI succeeds. No authored RU/UZ JSON, choice IDs, saved progress, merge or deploy changed.

## 2026-11-17 S4E5-A02 verified runtime completion

- Seven Roads [#44033034453](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/44033034453) SUCCESS, Tier A [#44033034457](https://github.com/jteshaboev1984-ops/qissa_app/actions/runs/44033034457) SUCCESS: 24/24 public WebP GET/MIME/bytes/SHA, 48/48 unique RU/UZ anchors, correct S4E5 gallery order, S4E6 isolation, typecheck/build/browser smoke PASS. S4E5 Stage1 **2/2 art accepted and fully integrated**.
