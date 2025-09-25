# Encounter Uploader

## Назначение
Encounter Uploader — внутренняя утилита для подготовки и заливки уровней Encounter. В составе монорепозитория находятся Vue 3 SPA (редактор уровней) и Express-прокси (авторизация и загрузка HTML-форм EN). Проект закрыт, код и документация хранятся в этом репозитории.

## Структура
- `frontend/` — клиент: Vite + Vue 3 + TypeScript, PrimeVue 4, TailwindCSS, Pinia, Vue Router, тестовые JSON-файлы в `test-configs/`.
- `server/` — Node.js/Express-прокси, перенаправляет `/api/*` запросы на EN, управляет сессиями.
- `docs/` — архитектурные материалы (`context.md`, `level-plan.md`, `new-level-types.md`).
- `en-uploader-example.gs` — пример Google Apps Script с ожидаемым форматом пейлоадов.
- Корень: `package.json`, `docker-compose.yml`, общая `.env` с тестовыми учётными данными.

## Установка и запуск
1. Установить зависимости:
   - `npm install --prefix frontend`
   - `npm install --prefix server`
2. Локальная разработка:
   - `npm --prefix frontend run dev` (порт 5173)
   - `npm run start:server` (порт 3001)
3. Комплексный запуск: `docker compose up --build` (Nginx + прокси, http://127.0.0.1:8099).
4. Сборка фронтенда: `npm run build:frontend`.
5. Линтер: `npm --prefix frontend run lint` и затем `npm --prefix frontend run lint:check`.

## Конфигурация
- Обязательные переменные: `SESSION_SECRET`, `PORT` для прокси; `VITE_`-префиксированные параметры для фронтенда (домен по умолчанию, задержки, тестовые креды).
- Локальная `.env` в корне — общие значения (пример: `test/test`, `domain=test`). Модули могут переопределять параметры в `frontend/.env` или `server/.env`.
- Продакшен-секреты не храним в репозитории. Перед выкаткой заполнить переменные окружения на сервере.

## Основные пользовательские потоки
1. Авторизация (`/login` → `frontend/src/components/LoginForm.vue`): прокси сохраняет куки EN в сессии Express.
2. Настройка игры (`/settings` → `frontend/src/components/SettingsForm.vue`): домен, GameId, LevelId, выбор типа уровня; сохраняется в Pinia + localStorage (кроме тестового режима).
3. Редактор уровня (`/:levelType/:subtype?` → `LevelUploadPage.vue`):
   - Контрол-панель (массовые операции) из `@/components/ui/controls`.
   - Таблицы контента (`LevelContent.vue`) на базе PrimeVue DataTable.
   - Табы (`LevelTabs.vue`) для многоблочных типов.
4. Загрузка (`frontend/src/services/uploader.ts`): формирование payload, отправка на `/api/admin/*`, контроль пауз/ошибок через `useProgressStore`.
5. Тестовый режим (`/test/:levelType` → `TestUploadPage.vue`): данные берутся из `frontend/test-configs/*.json`, авторизация и localStorage отключены.

## Архитектура фронтенда
### Маршрутизация
`frontend/src/router/index.ts` описывает пользовательские и тестовые маршруты. Переход `/upload` прокидывает в актуальный тип из стора.

### Хранилище Pinia
- `useAuthStore` (`src/store/auth.ts`) — логин и тестовый режим.
- `useLevelStore` (`src/store/levels.ts`) — основное состояние уровней: метаданные, табы, конфиг, автосохранение в localStorage, undo-хуки.
- `useBonusLevelsStore` (`src/store/bonusLevels.ts`) — загрузка чекбоксов уровней EN через прокси.
- `useProgressStore` (`src/store/progress.ts`) — модаль прогресса с паузами/ошибками.
- `useSettingsStore` (`src/store/settings.ts`) — предпочитаемый вид прогресса.

### Система типов уровней
- Реестр типов: `frontend/src/entities/level/configs.ts`. Каждая запись описывает `id`, `subtypes`, `fields`, `controls`, `buttons`, `payloads`, `defaults`. Регистрация выполняется вызовом `registerLevelType` в конце модуля.
- Типы данных: `frontend/src/entities/level/types.ts` — единый контракт для полей, табов, конфигов, пейлоадов и стора.
- Поля: `frontend/src/entities/level/fields/fieldDefinitions.ts` (канонический список 13 полей, их порядок = порядок колонок). Рендеры PrimeVue-компонентами описаны в `tableRenderers.ts` и подключаются динамически в `LevelContent.vue`.
- Контролы: `frontend/src/components/ui/controls/*.vue`, реестр в `index.ts`, выбирается по `ControlId` из конфига типа.
- Кнопки: `frontend/src/components/ui/buttons`, три группы (navigation/functional/action), управляются конфигом типа.
- Импорт/экспорт: реализован в `FunctionalButtons.vue`, использует структуру `TabData`. JSON сохраняет все табы; CSV использует колонку `tab`.
- Генераторы пейлоадов: `frontend/src/services/levelPayloads/*` — собирают формы EN для task/sector/bonus. Простые типы могут включать `true`, сложные — ссылку на генератор (`generator: 'olymp.task'`).

### UI-слой
- `LevelUploadPage.vue` — главный контейнер: инициализация стора, перехват переключения подтипов, показ `UploadProgress.vue`.
- `LevelControlPanel.vue` — mass-edit, читает список контролов из конфига.
- `LevelContent.vue` — DataTable, модаль `LevelsModal` для выбора конкретных уровней бонуса.
- `LevelFooter.vue` — вывод статистики по активному табу и массовые действия (очистка, генерация таба).
- Общие модалки (`components/common/modals/*`) и уведомления (`components/common/notifications`) подключаются через PrimeVue сервисы.

### Тестовые конфиги
`frontend/test-configs/config.json` сопоставляет алиасы (`olymp15`, `type100500`) файлам с данными. Композабл `useTestConfig` загружает JSON и env-креды, `useTestUrlMode` отключает persist.

## Добавление нового типа уровня
1. Создать конфиг в `frontend/src/entities/level/configs.ts`:
   - Уникальный `id`, `name`, `category`, флаги (`isMultiBlocks`, `manualCodeAddition`).
   - Опциональные `subtypes` со своей `dimension` и настройками по умолчанию.
   - Указать `fields`, `controls`, `buttons`, `payloads`, `defaults`.
   - Вызвать `registerLevelType(newConfig)`.
2. При необходимости расширить базу полей:
   - Добавить запись в `fieldDefinitions.ts` (label, type, defaults, controlId).
   - Реализовать рендер в `tableRenderers.ts` и экспортировать через `fieldRenderers`.
3. Добавить/переиспользовать контролы (`components/ui/controls`) и кнопки (`components/ui/buttons`), обновить перечисления в `types.ts`.
4. Если нужны новые генераторы пейлоадов — реализовать в `src/services/levelPayloads` и зарегистрировать в `payloads` конфига.
5. Обновить тестовый JSON в `frontend/test-configs` и `config.json`, чтобы режим `/test/<type>` отражал новый тип.
6. Дополнить документацию в `docs/` при изменении сценариев.

## Расширение функциональности
- Массовые операции реализованы в контрол-компонентах — добавляя новый control, обеспечьте связь со `store.config` и экшенами стора.
- Новые колонные действия интегрируются через `LevelContent.vue`: добавьте обработчики, бейджи или модалки.
- Для дополнительных проверок при загрузке используйте `useProgressStore.reportError` и ставьте процесс на паузу (`progress.pause()`), чтобы пользователь принимал решение.

## Сервис загрузки
`frontend/src/services/uploader.ts` отвечает за:
- Формирование параметров `URLSearchParams` для Task/Sector/Bonus (`buildTaskPayload`, `buildSectorPayload`, `buildBonusPayload`).
- Отправку батчей (`sendTasks`, `sendSectors`, `sendBonuses`) с задержками `SLEEP_MS` и учётом паузы.
- Получение списка чекбоксов уровней (`fetchBonusLevels`) и преобразование `closedText` в ссылку/картинку.
- Обработку ошибок Axios, агрегацию статуса, паузы при неудачах.
При добавлении нового payload-канала повторяйте структуру: builder → sender → интеграция в `ActionButtons.vue` и конфиг типа.

## Backend-прокси
`server/index.js` — единственная точка входа.
- Сессии Express (`express-session`) хранят куки EN (`authCookie`).
- Ручки:
  - `POST /api/auth/login` — форвард на `Login.aspx`, сохраняет `Set-Cookie` в сессии.
  - `POST /api/admin/task` — отправляет HTML задания.
  - `POST /api/admin/sector` — редактирует LevelEditor, умеет принимать динамический набор полей.
  - `POST /api/admin/bonus` — сохраняет бонусы.
  - `GET /api/admin/bonus-form` — возвращает HTML формы для парсинга чекбоксов.
- Ретраи Axios (3 попытки) для GET/POST, автоматическое обновление куки через `refreshAuthCookie`.
- Переменные окружения: `PORT`, `SESSION_SECRET`. В продакшене включить `cookie.secure = true`.

## Тестовые данные и проверки
- Демо авторизация: логин `test`, пароль `test` — пропускает реальную валидацию.
- Основные тестовые URL:
  - UI с авторизацией: http://192.168.0.12:5173/
  - Прямой доступ к типам без логина: `/test/olymp15`, `/test/olymp31`, `/test/olymp63`, `/test/olymp127`, `/test/type100500`.
- Перед заливкой уровня рекомендуется прогнать сценарий: заполнение, экспорт, импорт, загрузка Task/Sector/Bonus, проверка прогресса с паузой и резюме.

## Контроль качества
- Обязательно: `npm --prefix frontend run lint`, затем `npm --prefix frontend run lint:check`.
- Проверить Vue/TypeScript диагностикой IDE (`mcp__ide__getDiagnostics` по необходимости).
- Соблюдать принципы из `CLAUDE.md`: TypeScript strict, PrimeVue-only UI, "Always Works™" (проверить руками отклик UI, логи, ошибки).
- Фиксировать изменения в `docs/` при обновлении флоу.

## Обязанности при изменениях
- Любое изменение в типах уровней → обновить README (этот документ).
- Новые кнопки/контролы → синхронизировать реестр и конфиги, добавить тестовые данные.
- Изменения API EN → корректировать прокси и сервисы загрузки, документировать требования к сессии.
