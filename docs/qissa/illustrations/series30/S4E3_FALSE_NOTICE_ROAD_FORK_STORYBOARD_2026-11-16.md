> **2026-11-17 verified runtime checkpoint:** S4E3-A01 is uploaded (361280 bytes, image/webp, SHA256 f00477166ae90ae020dfc108756a833f7db1b034c9fecb92612a9a56d3decab7). Seven Roads CI #44002012158 and Season 2 Tier A #44002011982 both SUCCESS; public GET/MIME/bytes/SHA, 20/20 remote assets, 40/40 RU/UZ anchors, S4E3 gallery false notice → wagon lock → road fork, no S4E4 spill, typecheck, build and browser smoke confirmed. Stage1 S4E3 fully integrated, Stage1 total **20/29**. Unpublished Draft PR only; literary JSON, existing art and progress unchanged.

# QISSA — S4E3 «Ложное уведомление» — Stage 1 storyboard

**Дата:** 2026-11-16. **Статус:** текст и визуальные референсы проверены, новый кадр **не генерировался и не принят**. Stage 1: **ровно 1 новая общая иллюстрация**, Stage 2: **0** (согласно ART_QUEUE). Четыре сезона 5/4/11/10 и общий план 29+19+обложка неизменны.

## Источники и виртуальные границы

- Source authored RU/UZ: `src/data/authored/staging/season2Story4WaitedMan.ru.json` и `season2Story4WaitedMan.uz.json`, `story_id=seven_roads_chelovek_kotorogo_zhdut`, `story_version=interactive-v4`.
- Reader layout `src/data/sevenRoadsReadingSeries.ts`: группа **S4E3** состоит из конца `story4_part_1_false_notice_and_route_check/story_text`, начиная с RU `Тюремную повозку готовили к утру.` / UZ `Qamoqxona aravasini tongga tayyorlashayotgan edi.`, и начала `story4_part_2_nadir_red_hill_clue/story_text`, **до** RU `В караванном дворе Хамида день начался позже.` / UZ `Hamidning karvon hovlisida kun kechroq boshlandi.`. Далее уже S4E4; не переносить кадр за границу.
- События S4E3: готовится тяжёлая закрытая тюремная повозка с двумя лошадьми; Данияр сопровождает Фарида, дети остаются в Ордане. Вечером получено формально убедительное сообщение из Араса о просевшей опоре моста. Начальник стражи решил пустить закрытую повозку по официальному объезду; утром возница, Данияр и охрана выезжают по старой патрульной дороге. **Никто ещё не знает об опасности**, никакой засады и итогов следующей серии.

## Существующие утверждённые сцены — не повторять

- `/QISSA/production/seven_roads/season2_visual_final/tier_a_story_frames/seven_roads_s2_story4_false_aras_notice_01_APPROVED.png`: начальник, Данияр, дети изучают обычное дорожное уведомление с красной печатью. Не повторять письмо, кабинет, печать.
- `/QISSA/production/seven_roads/season2_visual_final/tier_a_story_frames/seven_roads_s2_story4_wagon_lock_dawn_01_APPROVED.png`: замок задней двери тяжёлой закрытой повозки, охрана во дворе перед выездом. Не повторять проверку замка/старт из внутреннего двора.
- Данияр — `/QISSA/production/seven_roads/season2_visual_final/tier_a_story_frames/seven_roads_s2_story1_danyar_pursuit_01_APPROVED.png`, также `/QISSA/production/seven_roads/season2_visual_final/refs/seven_roads_danyar_ref_01_APPROVED.png`: взрослый, не старик, тёмные волосы и короткая тёмная борода, ярко-синий шарф, дорожная кожаная экипировка, **серый конь**.
- Стражники — обычная утверждённая форма, не придумывать новые флаги/гербы; использовать внешний вид и экипировку из старого `wagon_lock_dawn`.

## S4E3-A01 — «Поворот на старую патрульную дорогу»

**Точный сюжетный кадр:** раннее утро, широкая главная дорога к Арасу разветвляется; тяжёлая **закрытая деревянная тюремная повозка** на усиленных колёсах, запряжённая **ровно двумя** дорожными лошадьми, уже начала поворачивать на более узкую старую патрульную дорогу. Взрослый Данияр на **своём сером коне**, узнаваемый по ярко-синему шарфу, руководит охраной; с возницей сопровождают **шесть конных стражников** (пара впереди, по одному с каждой стороны и пара сзади), если все помещаются в композицию; не выдумывать дополнительных главных персонажей. В глубине, далеко от группы или на краю дороги, Темур в бирюзово-синем может наблюдать за удаляющимися колёсами, не присоединяясь к конвою. **Фарид находится внутри запертого кузова, не виден**. Спокойная, настороженная атмосфера, никаких преследователей, верёвок, засады или столкновений.

**Уникальный буквальный якорь** `story4_part_2_nadir_red_hill_clue` / `story_text` (оба 1/1):
- RU `На развилке повозка оставила главную дорогу на Арас и свернула на старую патрульную.`
- UZ `Ayrilishda arava Arasga boradigan asosiy yo‘ldan chiqib, eski patrul yo‘liga burildi.`

Абзац 25 (нумерация от 0) в исходной части 2, **до** split-абзаца начала S4E4 (номер 27). Положение в S4E3 gallery после сохранённых false notice и wagon lock изображений, без утечки в S4E4.

**Композиция:** горизонтальный 16:9, `seven_roads_painterly_v1`, дорога и поворот читаются сразу, повозка занимает средний план, Данияр в боковом переднем плане; свет зари над каменистым степным ландшафтом. Никакого текста/гербов/современных объектов, не менять пропорции лошадей, не показывать трёх столбов из ранней серии и не смешивать с S4E1 (Темур+Самира на белом/чёрном конях).

## Приёмка и технические правила

Генерировать одну сцену; сравнить с реальными каноническими PNG прежде статуса APPROVED. При сюжете или реквизите, противоречащем тексту, ставить REJECTED. После художественной приёмки: PNG → WebP → SHA256 → QISSA Library → проверенный user upload Supabase `story-images/seven-roads/season2_tier_a_v2/` → независимый HTTP/MIME/bytes/SHA CI → additive overlay `series30ApprovedSceneSlots.ts` и URL `authoredStoryAssets.ts` → RU/UZ/gallery/5-4-11-10/typecheck/build/browser smoke CI.

Нельзя менять литературные RU/UZ JSON, выборы, story/choice IDs, существующие утверждённые кадры, сохранённый прогресс, merge/deploy без отдельного разрешения.

## New illustration S4E3-A01: REVIEW only, 2026-11-16

- Candidate #1 depicts correct story moment (closed prison wagon pulled by two horses turning toward uphill old patrol road, Danyar with dark hair/short beard and bright blue scarf on gray horse), but **NOT APPROVED**: around seven mounted guards instead of six, and their cloaks are brown instead of established blue guard uniform from `seven_roads_s2_story4_wagon_lock_dawn_01_APPROVED.png`. No literary spoilers visible.
- `seven_roads_s4e3_prison_wagon_road_fork_REVIEW_v1.png` 1672×941, PNG SHA256 `04148be4a7ff2eff1d3ea104693f88301450bb1cf20905f3eca2dafcafa22174` and metadata saved in QISSA Library `/QISSA/production/seven_roads/series30/review/S4E3/`. **No approved WebP, no Storage, no runtime**.
- Candidate #2 after attempting uniform/cast correction **REJECTED**: generated S4E1 children riding near-black and white horses with an unhelmeted escort (wrong story entirely). Do not reuse or upload. S4E3 stage1 remains **0/1**. Next edit must keep the prison wagon/road fork and Danyar but correct guard colors/count; use isolated composition to avoid repeating S4E1.

## S4E3-A01 — new blue-uniform REVIEW v2 and further rejected attempts, 2026-11-16

- **REVIEW v2 (NOT APPROVED):** new image now uses appropriate blue/gold guard cloaks, correct Danyar dark hair/short beard, cream tunic + blue scarf on gray horse, two draft horses and a closed iron-reinforced prison wagon already turning off the main road. However count remains **seven mounted guards instead of six**, so it fails exact escort canon. `/QISSA/production/seven_roads/series30/review/S4E3/seven_roads_s4e3_prison_wagon_road_fork_REVIEW_v2.png`, 1672×941, SHA256 `7b3f3278224bc7cfa1a9feb62f4de2303dcbb7d87adfe596651138da7806e6cb`, metadata in Library. No APPROVED WebP, no Storage/runtime slot.
- **REJECTED two further image generations:** one added invented road-marker arrow signs and lost recognizable Danyar; the other replaced Danyar with black-armored guard on brown horse and visibly showed prisoner in barred wagon, breaking source image continuity and count. Do not register, download for Supabase or integrate either.
- S4E3 remains **0/1 Stage1**, not silently accepted. Next fix must remove exactly one extra blue guard from REVIEW v2 while preserving Danyar/gray horse, two draft horses, six blue mounted guards and closed no-visible-prisoner wagon. Further retries should use genuinely isolated context or precise authorized image editing, not change plot or the existing approved scenes.

## S4E3-A01 — corrected six-guard frame accepted (2026-11-16)

- Новый кандидат `seven_roads_s4e3_prison_wagon_road_fork_01_APPROVED` создан редактированием `REVIEW_v2` с точечным удалением одного дополнительного конного стражника за левой стороной повозки; остальные шесть (один слева, один рядом с повозкой, двое впереди и двое на заднем правом плане) оставлены. Данияр взрослый, тёмные волосы и короткая борода, ярко-синий шарф, светлая туника/кожа, верхом на сером коне; форма шести стражников синяя с золотой отделкой, сабли в ножнах. Закрытая тюремная повозка с возницей и двумя упряжными конями начинает поворот на старую патрульную дорогу. Фарид внутри не виден, ни погони, ни нападения, ни новых гербов или дорожных знаков. **Художественно принято по действующему условию владельца** после проверки кадра и RU/UZ текста.
- Единственные буквальные RU/UZ якоря `story4_part_2_nadir_red_hill_clue/story_text` (оба 1/1): RU `На развилке повозка оставила главную дорогу на Арас и свернула на старую патрульную.`; UZ `Ayrilishda arava Arasga boradigan asosiy yo‘ldan chiqib, eski patrul yo‘liga burildi.` Размещать в virtual S4E3 до перехода к Надиру в S4E4.
- Master PNG **1672×941**, SHA256 `749d9596566972e6d8efa224769b4e6d49979d6cb3599c55bd6caaf307de7346`; WebP **361280 bytes**, SHA256 `f00477166ae90ae020dfc108756a833f7db1b034c9fecb92612a9a56d3decab7`. PNG/WebP/metadata сохранены в QISSA Library `/QISSA/production/seven_roads/series30/stage1/S4E3/`. Прошлые `REVIEW_v1`/`REVIEW_v2` остаются неутверждёнными, нельзя загружать их вместо финального файла.
- **Storage ещё не загружен, runtime не интегрирован**. Следующее действие: Supabase bucket `story-images` / `seven-roads/season2_tier_a_v2/` / `seven_roads_s4e3_prison_wagon_road_fork_01_APPROVED.webp`, затем независимый public GET/MIME/size/SHA256 через GitHub Actions и additive overlay `series30ApprovedSceneSlots.ts` + `authoredStoryAssets.ts`, RU/UZ gallery после существующих двух S4E3 кадров, smoke/typecheck/build. PR Draft, нет merge/deploy.
