# QISSA — S2E3 «Фарид»: художественный производственный checkpoint

Дата: 2026-11-14. Основа: PR #334, ветка `qissa/four-seasons-chronological-runtime-20261112`.
Исходный литературный пакет: `seven_roads_korolevskoe_serebro` / `interactive-v5`, `part_id=story1_part_3_network_sign`.
**Не изменять литературный текст, choices, прогресс и существующие утверждённые изображения.**

## Актуальная проверка
- Исходные RU/UZ JSON прочитаны по HEAD `670fa9ba23eb43a1143154e3b483116e18f03502`.
- Виртуальная граница S2E3/S2E4: `post_choice_text` **перед** RU `К вечеру Ордан снова выглядел обычным.` / UZ `Kechga kelib Ordan yana odatdagidek ko‘rina boshladi.`.
- В реестре S2E3 изначально нет сюжетных картинок; план этапа 1: **три новых общих кадра**.
- Оригинальные одобренные визуальные образцы найдены и просмотрены: `QISSA_MASTER_REFERENCE_user_selected.png`, `01_heroes_horses_approved.png`, `seven_roads_s2_story1_danyar_pursuit_01_APPROVED.png`, `seven_roads_s2_story1_kamran_rescues_comrade_01_APPROVED.png`, `seven_roads_s2_story1_royal_silver_attack_01_APPROVED.png`.
- Всего по 30 сериям структурный аудит исходных RU JSON и девяти разрезов сошёлся с очередью: **30/30** серий, **73/73** видимых изображений в одном маршруте; этап 1 **29/29**.

## S2E3-A01 — «Он назвался Фаридом»
- Состояние: **изображение принято владельцем условно, соответствие RU/UZ сцене вручную подтверждено; master + WebP + метаданные сохранены в QISSA Library**.
- `kind=shared`; `phase=story_text`; RU `after_text: — Фарид.`; UZ `after_text: — Farid.`. Оба точных якоря единственны в тексте.
- В кадре: Камран задержан возле старых скотных ворот Орданы; оружие отобрано, руки связаны, два стражника и Данияр наблюдают. Кадр сверялся с ранее утверждённой внешностью Камрана и Данияра.
- `asset_id=seven_roads_s2e3_farid_gate_arrest_01_APPROVED`.
- Library: `/QISSA/production/seven_roads/series30/stage1/S2E3/`.
- PNG: `seven_roads_s2e3_farid_gate_arrest_01_APPROVED.png` (1672×941, 2,958,487 байт, SHA-256 `b685be81a6acf81a17abc428e0bf10671797483eac63c2afa29d4139e03218c9`).
- WebP: `seven_roads_s2e3_farid_gate_arrest_01_APPROVED.webp` (532,314 байт, SHA-256 `00f1c705bbd1c446c354a00852039b57a867ff7166839dc88da5170e03c9a8b1`).
- **Supabase Storage upload: NOT DONE; public URL: NOT VERIFIED; reader/gallery integration: NOT DONE; runtime QA: PENDING.**

## S2E3-A02 — «Возница и Данияр: после нападения»
- Состояние: **композиция согласована, изображение ещё не создано**; две попытки генерации завершились ошибкой сервиса. Не считать art approved и не повторять генерацию без нового пользовательского запроса.
- `kind=shared`; `phase=story_text`.
- Точный RU `after_text`: `— Пока не знаю. Но я ещё подумаю.`
- Точный UZ `after_text`: `— Hozircha bilmayman. Lekin yana o‘ylab ko‘raman.`
- Якоря уникальны (1 совпадение каждый). Возница уже спрыгнул с козел, серьёзно объясняет нападение сухой пылью; Данияр отвечает удивлённым скептическим взглядом. **На переднем плане диалог двух людей.** Повозка лишь незначительным фрагментом на дальнем плане, без сцены движения, чтобы не повторять утверждённое изображение её выезда (прямое требование владельца). Не показывать преждевременную улыбку молодого стражника: она появляется в следующем абзаце.

## S2E3-A03 — «В столице»
- Состояние: композиция согласована, ещё не создано.
- `kind=shared`; `phase=post_choice_text` **до виртуального разреза**.
- Точный RU `after_text`: `Данияр заметил этот взгляд.`
- Точный UZ `after_text`: `Daniyar bu qarashni payqadi.`
- Якоря уникальны (1 совпадение каждый). Камран в обычной каменной тюрьме Орданы реагирует на сообщение о будущем суде в столице; Данияр замечает его взгляд. Не показывать дальнейшую транспортировку или план побега.

## Следующее техническое действие — только после доступной проверенной загрузки
1. Для утверждённого A01 загрузить существующий WebP в реальный Storage через поддерживаемое действие, проверить GET, content-type, размеры и SHA-256. Не придумывать публичный URL.
2. Добавить `image_slot` с точным RU `after_text` в исходный RU JSON и `image_anchor_texts[slot_id]` в UZ overlay; UZ локализатор наследует RU слоты. Никаких текстовых правок.
3. Проверить `sevenRoadsReadingSeries.ts` границу и отсутствие спойлера в галерее, обе ветви, RU/UZ.
4. Запустить `npm run check:reading-series-30`, `npm run check:four-seasons`, `npm run typecheck`, `npm run build` и визуальный smoke.
5. Только после фактического успеха отметить `stored → runtime_integrated → qa_passed`. Не деплоить, не merge PR без отдельного разрешения владельца.
