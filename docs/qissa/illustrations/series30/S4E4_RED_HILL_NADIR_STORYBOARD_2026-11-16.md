> **2026-11-17 S4E4-A01 runtime integration verified:** public WebP `seven-roads/season2_tier_a_v2/seven_roads_s4e4_nadir_wooden_tokens_01_APPROVED.webp` fetched by Seven Roads CI #44015567471 with GET/MIME 346950 bytes and SHA-256 `7ded6261bbb78d8dc94de6d922f238057a7cc54ea01e5f0fe37cc027fc3c45e6`. All 21/21 remote WebPs and 42/42 RU/UZ scene anchors pass. Gallery S4E4 existing Nadir meeting → token verification (locked until read); image does not leak to S4E3, which remains false notice → wagon lock → road fork. Typecheck/build/four-seasons/reader/browser smoke PASS, Season 2 Tier A #44015567549 PASS. Stage1 S4E4 is **partially integrated 1/2**, total Stage1 **21/29 accepted and integrated**. A02 not started. No merge, deploy, literary sources or saved progress changes.

# QISSA — S4E4 «Красный холм»: Stage 1 storyboard

**Дата:** 2026-11-16; дополнено 2026-11-17. **Статус:** S4E4-A01 художественно принят владельцем, PNG/WebP/metadata сохранены в QISSA Library; Storage и runtime ещё не интегрированы. S4E4-A02 не начат. Утверждённая квота S4E4: Stage1 **2 общих изображения**, Stage2 **2 общих изображения**; сохранять план 29+19+отдельная обложка, сезоны 5/4/11/10.

## Источник литературной истины

- `src/data/authored/staging/season2Story4WaitedMan.ru.json`, `.uz.json`: `story_id=seven_roads_chelovek_kotorogo_zhdut`, `part_id=story4_part_2_nadir_red_hill_clue`, исходная версия `interactive-v4`.
- Виртуальная S4E4 начинается в `story_text` после RU `В караванном дворе Хамида день начался позже.` / UZ `Hamidning karvon hovlisida kun kechroq boshlandi.`. До этого S4E3 «Ложное уведомление» со сворачиванием закрытой повозки на патрульную дорогу.
- Надир работает во дворе Хамида, когда к нему подходит **неизвестный человек сети**. Существующая утверждённая сцена `seven_roads_s2_story4_nadir_contact_01_APPROVED` показывает начальную встречу (две ведра воды); asset фактически разрешается через `seven_roads_s2_story4_nadir_contact_01_DRAFT_v2.webp` в `authoredStoryAssets.ts`. **Не заменять** эту иллюстрацию.
- Незнакомец сверяет общий знак и рисунок двух башен на жетоне Надира. Затем объясняет поручение о двух свежих лошадях и Красном холме. После читательского выбора в общем `post_choice_text` Надир оставляет сообщение под пробкой фляги и вешает флягу на **левый задний крюк повозки Хамида**. После этого сообщение незаметно заберёт человек капитана; показывать получение записки в кадре оставления фляги **нельзя**, это следующее событие.
- Нельзя показывать исход возможной засады, Фарида вне закрытой повозки, подменять Надира Данияром, Камраном или Темуром/Самирой.

## Визуальные источники

- Основной художественный канон `seven_roads_painterly_v1`, горизонтально 16:9, тёплая книжная живопись мира QISSA, без надписей, гербов или водяных знаков.
- `/QISSA/production/seven_roads/season2_visual_final/refs/seven_roads_two_towers_ref_01_APPROVED.png`: архитектура старого двора в Сарване и визуальный силуэт **ровно двух башен** как каноническая структура символа; не заменять его иной эмблемой. Это референс места/символа, не сцена с Надиром.
- `seven_roads_s2_story4_nadir_contact_01_APPROVED`: существующий утверждённый кадр Надира и незнакомца. Его public hosted файл имеет историческое имя `..._DRAFT_v2.webp`. Если точный персонажный портрет недоступен к просмотру, делать **крупный кадр рук/предметов без нового лица**, а не придумывать внешность Надира.
- Караванный двор Орданы с тюками, простыми конюшнями и деревянной повозкой Хамида; не повторять стражу Орданы, приказы или карту.

## S4E4-A01 — «Проверка двух жетонов»

**Общий кадр до выбора:** крупный план двух пар рук у грубой деревянной скамьи во дворе Хамида. В руках незнакомца и Надира — два небольших **деревянных** жетона; один жетон он **переворачивает, сверяя сторону с двумя башнями**, другие знаки либо скрыты пальцами, либо обращены внутрь, чтобы не придумывать символику. На земле у ног **два ведра воды**, фон с тюками и навесом размытый. Оба взрослых стоят, **не сидят за официальным столом**, нет красной сургучной печати, полицейских, оружия, картины будущего Красного холма. Сцена отлична от уже принятой общей встречи: фокус именно на визуальной проверке жетонов.

**Точные полные якоря, `story_text`, по одному совпадению:**
- RU `Незнакомец сверил общий знак, перевернул жетон с двумя башнями и вернул его.`
- UZ `Notanish odam umumiy belgini solishtirdi, ikki minora tushirilgan nishonchani ag‘dardi va qaytarib berdi.`

`story4_part_2_nadir_red_hill_clue/story_text`, абзац 40 (0-based), после начального существующего кадра `NADIR-CONTACT`, в virtual **S4E4**.

## S4E4-A02 — «Фляга на левом заднем крюке»

**Общий кадр после выбора:** Надир в простой караванной одежде, со спины/сбоку, **один** незаметно вешает старую пустую дорожную флягу с пробкой на **левый задний крюк деревянной грузовой повозки Хамида**. Небольшая сложенная записка находится **под пробкой**, не открыта и не читается. Надир делает вид, что поправляет ремень. Тюки и мешки на телеге, дальний навес, спокойное дневное освещение, несколько размытых работников вдали допустимы, но **никто не смотрит прямо на флягу и не берёт её** — получение записки будет позднее. Это **не** тюремная повозка Данияра: повозка обычная грузовая.

**Точные полные якоря, `post_choice_text`, по одному совпадению:**
- RU `Повесил флягу на левый задний крюк — это и был условленный знак.`
- UZ `Suv idishini chap orqa ilgakka osdi. Bu oldindan kelishilgan ishora edi.`

`story4_part_2_nadir_red_hill_clue/post_choice_text`, абзац 13 (0-based), виртуальная серия **S4E4** после общей развязки двух вариантов, не зависеть от конкретного choice ID.

## Художественная/техническая приёмка

Перед генерацией каждого кадра просмотреть доступные утверждённые изображения и RU/UZ соседние абзацы; один кадр за раз. Если отсутствует необходимый персонажный референс — использовать close-up, не придумывать лицо. При изображении неверного эпизода или символики ставить **REJECTED**. Точно сохранить stage1 quota 2; stage2 ещё 2 по последующему плану.

Только при принятии: master PNG → оптимизированный WebP → SHA256 → QISSA Library → подтверждённая Supabase Storage загрузка `story-images/seven-roads/season2_tier_a_v2/` → независимая проверка публичных bytes/MIME/SHA в CI → additive scene overlay `src/data/series30ApprovedSceneSlots.ts` + URL `src/data/authoredStoryAssets.ts` → RU/UZ/галерея/S4E4 only/choice unlocks/typecheck/build/browser smoke. Не изменять литературные JSON, выборы, ID, прогресс, старые approved кадры, не merge/deploy.

## First art attempt S4E4-A01 REJECTED — 2026-11-16

- ImageGen ignored the tightly scoped two wooden tokens and Nadyr's water buckets scene, returning instead S4E3 prison wagon/road fork with invented decorative signpost and guards. **REJECTED**; no asset or status changed. S4E4 Stage1 **0/2**, Stage2 still 2 planned. Do not use this image, no Storage/upload/runtime.
- Source and anchor details above remain unchanged; original `seven_roads_s2_story4_nadir_contact_01_APPROVED` still preserved. On retry use a clean visual context focused only on hands with wooden tokens (twin tower silhouette, no invented heraldry) and two buckets at Hamid's courtyard.

## S4E4-A01 — две новые генерации REJECTED (2026-11-16)

- После успешной художественной приёмки S4E3 и отдельного поручения **только** о двух деревянных жетонах, обе новые попытки ImageGen ошибочно воспроизвели Данияра, закрытую тюремную повозку и дорогу S4E3. Вторая добавила неканоничный деревянный дорожный указатель с символом трёх столбов. **Обе REJECTED.**
- Ни в одном кадре нет основной сцены S4E4: рук Надира и незнакомца, деревянных жетонов с двумя башнями и стоящих рядом двух ведер. Не приписывать кадры S4E4, не загружать в Storage и не интегрировать.
- С учётом предыдущего аналогичного сбоя уже **три** неудачные генерации A01. Следующая попытка должна быть в действительно отдельном, не наследующем предыдущие кадры контексте либо с другой разрешённой художественной процедурой; только крупный план рук и жетонов, без конвоя, стражников, лошадей, тюремной повозки и дорожных указателей. Исходные точные RU/UZ якоря и утверждённая квота без изменений. **S4E4-A01 0/1, S4E4-A02 0/1, всего Stage1 S4E4 0/2.**

## S4E4-A01 — новый кандидат REVIEW (2026-11-17)

- Generated **one** independent candidate in current chat. ImageGen generation ID: `e119e63f-e0d2-4754-920e-1fa41b762f63`. Local review attachment: 1672×941 PNG, 2533096 bytes, SHA256 `f462f15fcd824b229846f489ad6dcba38f6850bca54e57aa52ae87efded8956e`. File exists as a chat output; **not archived as APPROVED in production Library**, not uploaded to Storage.
- Preliminary visual QA: tight close-up; exactly two pairs of adult hands; exactly two wooden tokens (second largely turned away); a visible carved **two-tower** emblem; exactly two wooden water buckets; blurred Hamid-style caravan yard with bales and wooden shelter. No faces, prison wagon, royal guards, road fork or invented signposts. The three historical wagon-repeat candidates remain rejected.
- **REVIEW / owner artistic approval pending.** The actual old master-ref pixels were not available for a side-by-side paint-style comparison, so final approval of visual continuity remains with the owner. No permanent asset ID, WebP, queue acceptance, Storage, runtime slot or count increase. S4E4 Stage1 **0/2**. Do not promote to APPROVED automatically.

## S4E4-A01 — explicit owner approval и производственные файлы (2026-11-17)

- Владелец явно утвердил **именно текущий** визуальный кандидат; никаких изменений пикселей PNG, повторной генерации либо ретуши нет. Candidate `e119e63f-e0d2-4754-920e-1fa41b762f63` → `seven_roads_s4e4_nadir_wooden_tokens_01_APPROVED`.
- Permanent QISSA Library: `/QISSA/production/seven_roads/series30/stage1/S4E4/` содержит final PNG, WebP и metadata JSON под одним `asset_id`. PNG 1672×941, **2533096** bytes, SHA256 `f462f15fcd824b229846f489ad6dcba38f6850bca54e57aa52ae87efded8956e`; optimized WebP same dimensions **346950** bytes, SHA256 `7ded6261bbb78d8dc94de6d922f238057a7cc54ea01e5f0fe37cc027fc3c45e6` (Pillow WebP quality 92/method 6). Metadata uploaded and file integrity verified locally.
- User upload target: Supabase Storage bucket `story-images`, object `seven-roads/season2_tier_a_v2/seven_roads_s4e4_nadir_wooden_tokens_01_APPROVED.webp`. Read-only Supabase `storage.objects` check on 2026-11-17 returned **no such object**. This is a planned object path, not a confirmed public URL. **Do not** add to runtime registry until independent public GET/MIME/bytes/SHA succeeds.
- Exact RU/UZ anchored `story4_part_2_nadir_red_hill_clue/story_text` paragraph 40 checked 1/1 in each source. In virtual S4E4 only, after already-approved `seven_roads_s2_story4_nadir_contact_01_APPROVED`; no spill to S4E3, no choice-dependent changes. Historical authored JSON and approved Nadir contact remain unchanged.
- Accounting: S4E4 Stage1 **1/2 ART approved, 0/2 technically integrated**, S4E4-A02 still unstarted; whole Stage1 **21/29 artistically accepted, 20/29 fully integrated**. No merge/deploy/publish or saved-progress updates.
