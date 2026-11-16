# QISSA — S3E3 «Утро после кражи» — storyboard stage 1

Дата: 2026-11-16. Статус: **литературные сцены и якоря подготовлены; иллюстрации пока не приняты**. План stage 1 — ровно 2 новых общих иллюстрации. Этап 2 для S3E3 по исходной очереди — 0. Существующее `seven_roads_story2_p5_img_01_v1` сохранить.

## Авторитетные источники

- `src/data/authored/taynaVostochnogoKaravanaV4.ru.json` и `...uz.json`, story ID `seven_roads_tayna_vostochnogo_karavana`, версия `interactive-v4-continuity-sync`.
- Authored `part_id=story2_part_5_first_investigation` (source part 5/10, zero-based index 4), читательская S3E3 до первого `post_choice_text` split-абзаца «Когда Темур закончил первый круг вопросов, он вернулся к капитану.» / «Temur dastlabki savol-javoblarni tugatib, sardorning oldiga qaytdi.».
- Перед событиями: ночью Рашид и Барлас украли ценности, сняли оттиск с дорожной печати, сбежали через старый выход, Надир тайно вернулся в Арас. В этой серии Темур **не знает** личности и результатов расследования. После событий он собирает показания; разветвление его расследования ещё не выбрано.
- В S3E3 уже есть единственная общая иллюстрация `seven_roads_story2_p5_img_01_v1` (капитан с кусочком красного сургуча и Темур у шкафа). Не повторять эту находку. Прежняя отменённая микросцена «дефект восковой печати» запрещена.

## Утверждённые референсы

- QISSA Library: `/QISSA/visual_refs/seven_roads_v1/01_heroes_horses_approved.png` — Темур примерно 12 лет, бирюзово-синий дорожный костюм, детские пропорции, тёмные волосы.
- `/QISSA/production/seven_roads/story2_v2/approved/seven_roads_story2_p5_img_01_v1.png` — фактическая внешность Темура и капитана Араса, интерьер сокровищницы (не повторять в новом кадре).
- `/QISSA/production/seven_roads/story2_v2/approved/seven_roads_story2_p4_img_02_v1.png` — соседняя серия и городской караванный мир.
- `/QISSA/visual_refs/seven_roads_v1/QISSA_MASTER_REFERENCE_user_selected.png` — общий живописный визуальный стиль.
- Стиль `seven_roads_painterly_v1`, строго горизонтальный 16:9, тёплая книжная живописность, без текста/водяных знаков и современного реквизита.

## S3E3-A01 — «Тревожный колокол» (stage 1, shared)

В раннее утро тревожный колокол Араса зовёт жителей в центр. Темур просыпается, подходит к **окну своего дома** и наблюдает, как люди в городской улице торопятся к центру. Никаких действий в сокровищнице или людей, знающих тайну кражи, на кадре нет. Возраст и бирюзовый костюм Темура по референсу, без выдуманного головного убора, взрослой бороды и иных персонажей из будущих серий.

Точные уникальные RU/UZ якоря, `story_text`:
- RU: `Люди двигались в сторону центра города.`
- UZ: `Odamlar shahar markazi tomon ketayotgandi.`

Композиция: полусредний план подростка у окна слева, справа вид на ранний Арас, городские крыши и движущихся к центру людей; тревожная атмосфера без опасности и жестокости. Колокол можно показать лишь как часть далёкой городской башни (не придумывая рисунок печати/герба). Не спойлерить слова соседей «сокровищница» и дальнейшее расследование.

## S3E3-A02 — «Темур во дворе каравана» (stage 1, shared)

После поручения капитана Темур возвращается с **широким поясом Всадника короля и церемониальной саблей в ножнах** поверх канонического бирюзово-синего дорожного костюма. Он стоит посреди уже напряжённого караванного двора: торговцы волнуются из-за задержки, у ворот разговаривают со стражей, но никаких действий следующего выбора ещё нет. Взрослые должны оставаться визуально старше и выше 12-летнего Темура.

Точные уникальные RU/UZ якоря, `story_text`:
- RU: `Темур остановился посреди двора.`
- UZ: `Temur hovli o‘rtasida to‘xtadi.`

Композиция: ребёнок в центре среднего плана, на заднем плане суета торговцев, повозки и стража у ворот, без демонстрации результата выбранной проверки. Не показывать Надира как раскрытого злоумышленника, допрос/арест, найденные улики или сургуч.

## Производство / приёмка

Генерировать одну сцену за раз. Проверить канон и композицию по реальным изображениям до `APPROVED`. После принятия: мастер PNG, WebP, SHA-256, QISSA Library, явная Storage загрузка и remote HTTP/MIME/bytes/SHA, затем additive overlay в `src/data/series30ApprovedSceneSlots.ts` и `authoredStoryAssets.ts`; регрессии RU/UZ, виртуальный split, галерея, CI/build/браузер. Литературные JSON/выборы/прогресс не изменять, PR Draft, без merge/deploy.

## Попытки генерации S3E3-A01 — 2026-11-16

- ImageGen candidate #1: **REJECTED** — вместо литературной сцены выдана не относящаяся к сказке таблица/отчёт о Storage, содержащая вымышленные графические имена и контрольные суммы. Не использовать этот визуальный отчёт как фактическое подтверждение загрузки или как арт-ассет.
- ImageGen candidate #2: **REJECTED** — повторён прежний лесной кадр четырёх всадников S2E4 вместо Темура у окна в Арасе.
- Реальные визуальные эталоны просмотрены и импортированы в Canva для изолированной генерации: `MAHbDDmma3g` (канон Темура/Самиры/коней) и `MAHbDD6Ipiw` (утверждённый Темур у найденного сургуча). Источник — названные выше Library PNG, не выдуманные описания.
- Canva отдельную генерацию S3E3-A01 с двумя эталонами отклонила по `quota_exceeded`. **Ни одного нового S3E3-A01 в статусе APPROVED нет**. `ART_QUEUE` для S3E3 остаётся `not_started`, ни один из двух кадров stage 1 не загружался и не интегрировался.
- При возобновлении генерации строго сцена 12-летнего Темура у окна утром тревожного колокола, без склада/лесной поляны/карты, RU+UZ якоря выше. Не повторять прошлые неудачные попытки вслепую; использовать импортированные эталоны.

## Реальный арт-результат — 2026-11-16

- **S3E3-A01 ACCEPTED**, `seven_roads_s3e3_morning_alarm_window_01_APPROVED`: Темур 12 лет, в бирюзово-синей дорожной одежде без церемониального пояса (он получает его позднее), наблюдает из окна дома за жителями, направляющимися к центру утреннего Араса по сигналу тревожного колокола. Никакого знания об ограблении, ключевых преступников, сундука/сургуча или выбранного пути расследования.
- Утверждено по действующему условию владельца после сверки RU `Люди двигались в сторону центра города.` и UZ `Odamlar shahar markazi tomon ketayotgandi.` с `story2_part_5_first_investigation`, `story_text`, читательская **S3E3**.
- PNG 1672×941, SHA256 `f7a9db4557d5522f4772ce2ed5968ddda5b5c8738cb81ab2215a76b57224e3f6`; WebP **249700** байт, SHA256 `60ce0110b06f70885e7ab8c2e0e3e744ecea4a19b0517c8d955a593b94a91271`; PNG/WebP/metadata.json сохранены в QISSA Library `/QISSA/production/seven_roads/series30/stage1/S3E3/`.
- **Storage: not uploaded. Runtime: not integrated.** Нельзя добавлять в приложение до проверки публичных GET/MIME/bytes/SHA.
- **S3E3-A02 REJECTED candidate #1**: Темур и Самира в загородном лагере, следы копыт и лошади; неверные персонажи, место и спойлер.
- **S3E3-A02 REJECTED candidate #2**: повторение интерьера отца Камрана с картой S2E4-A02, не соответствует серии. Оба файла НЕ APPROVED, не интегрировать.
- Следующий корректный S3E3-A02: 12-летний Темур **один** посреди городского караванного двора Араса, в широком поясе Всадника короля с церемониальной саблей в ножнах, вокруг торговцы, повозки и стража возле ворот. Точный RU `Темур остановился посреди двора.` / UZ `Temur hovli o‘rtasida to‘xtadi.`, `story_text`. Героям нельзя действовать по результату ещё не выбранного способа расследования.

## Окончательная фиксация ошибок S3E3-A02 (2026-11-16)

- **REJECTED candidate #3**: генератор снова изобразил лесной эпизод S2E4 с четырьмя всадниками, включая Данияра на сером коне. Это не Темур в городском караванном дворе; не принять и не регистрировать как ассет.
- Canva для сцены S3E3 ранее сообщила `quota_exceeded`; Gamma для отдельного кадра вернула **HTTP 402 Insufficient credits** (на момент ответа у workspace 68 кредитов, но генерация не разрешена). Исполнение отложено только для этого одного кадра, не для проекта в целом. Не вводить пользователя в заблуждение о наличии A02.
- Следующее художественное действие: изолированная генерация после устранения контекстного смешения / сброса контекста визуального генератора с точным storyboard выше. Сохранять как APPROVED только новое изображение Темура с поясом, одной саблей в ножнах, внутри городского караванного двора Араса, до выбора расследования. Принятый A01 и все более ранние файлы не менять.

## S3E3-A01 Storage verification and runtime wiring — 2026-11-16

- Uploaded `seven_roads_s3e3_morning_alarm_window_01_APPROVED.webp` found in Supabase `story-images/seven-roads/season2_tier_a_v2/`; size **249700**, MIME **image/webp**.
- Independent CI **Season 2 Tier A Slot Check #43824224155** verified public GET/MIME/length/SHA-256 `60ce0110b06f70885e7ab8c2e0e3e744ecea4a19b0517c8d955a593b94a91271`; all **12/12** approved WebPs matched. No remote file missing.
- Added `SERIES30-S3E3-A01` to `src/data/series30ApprovedSceneSlots.ts` and URL to `src/data/authoredStoryAssets.ts`. RU anchor `Люди двигались в сторону центра города.`; UZ `Odamlar shahar markazi tomon ketayotgandi.`; in `story_text` of authored `story2_part_5_first_investigation`, reader episode **S3E3** before previously approved wax discovery frame.
- Added RU/UZ reader/gallery regression for correct image order and exclusion from S3E4. **Runtime CI/browser result pending** for new commit, do not claim success prematurely.
- S3E3-A02 remains **NOT APPROVED**; no substitutions or duplicate accepted art. Source literary RU/UZ JSON, choices and progress remain unchanged, PR Draft, no merge/deploy.

## Итог художественной приёмки S3E3-A02 — 2026-11-16

- **S3E3-A01 technical QA PASSED**: public SHA/MIME/bytes 12/12, 24 RU+UZ anchors, chronological gallery alarm → pre-existing wax discovery, right reader episode S3E3 and no S3E4 leak; Seven Roads CI **#43824446846** and Season 2 Tier A Slot Check **#43824446863** both **SUCCESS**, including typecheck/build/browser smoke.
- **S3E3-A02 NEW ACCEPTED** (not a reuse of three previously rejected candidates): `seven_roads_s3e3_temur_caravan_courtyard_02_APPROVED`. Correct actual frame depicts recognizable 12-year-old Temur in turquoise-blue embroidered costume, in broad King's Rider belt and ceremonial sabre in sheath, standing among older merchants and city guards inside the lively urban Aras caravan courtyard. No Samira, Danyar, Kamran, father-map, horses in a camp, wax, arrest, or outcome of next branching choice.
- Exact unique `story_text` anchor in authored `story2_part_5_first_investigation`: RU `Темур остановился посреди двора.`; UZ `Temur hovli o‘rtasida to‘xtadi.`. Visible reader episode: **S3E3**, before choice. Existing `seven_roads_story2_p5_img_01_v1` remains in use.
- PNG original 1672×941, 2895415 bytes, SHA-256 `2b8ff34e83a7dbd40b09c1fa2f3905ea38d5d489369745669afd9c3602bb0b48`; optimized WebP **299718** bytes, SHA-256 `ba66f3835ed7acea64dfcf3da17985f131a93d813310e5d9930d284bd1701c14`; metadata JSON. All stored in QISSA Library `/QISSA/production/seven_roads/series30/stage1/S3E3/`.
- **A02 Storage NOT uploaded yet, runtime NOT integrated.** After user uploads exactly `seven_roads_s3e3_temur_caravan_courtyard_02_APPROVED.webp` to `story-images/seven-roads/season2_tier_a_v2/`, verify public GET/MIME/bytes/SHA and then wire additive overlay and gallery, rerun both CI workflows.
- S3E3 Stage1 **2/2 art accepted**, **1/2 technically complete**, no alteration of literary JSON, choices, progress keys or pre-existing art. PR remains Draft without merge/deploy.
