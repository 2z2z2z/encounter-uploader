# План реализации новой архитектуры типов уровней

## Общие принципы реализации

- Новая архитектура создается полностью с нуля в отдельной области файловой системы
- **КРИТИЧНО: Старая архитектура level-system остается ПОЛНОСТЬЮ нетронутой** - она активно используется!
- Новая и старая системы работают **параллельно и независимо** во время разработки
- 100% использование PrimeVue компонентов
- Динамическое построение компонентов на основе конфигов
- Сохранение совместимости с существующими API пейлоадами
- Создание новых унифицированных форматов экспорта/импорта для блоков (табов)
- Не разбивать сущности на множество файлов без необходимости
- Строгое соблюдение @CLAUDE.md, особенно правил написания кода и "Always Works™"
- Переиспользование существующих компонентов где это целесообразно
- **Постепенная миграция**: каждый шаг должен сохранять работоспособность текущей системы
- **Независимое тестирование**: новая система тестируется на отдельных роутах
- **Безопасный переход**: возможность откатиться к старой системе на любом этапе

## Детальная структура файлов новой архитектуры

```
frontend/src/components/level-system-v2/
├── bases/
│   ├── fields/                    # База полей
│   │   ├── index.ts              # Экспорт всех полей + типы
│   │   ├── fieldDefinitions.ts   # Определения полей (метаданные)
│   │   └── tableRenderers.ts     # Рендер-функции полей для DataTable колонок
│   ├── controls/                 # База контрол-сниппетов
│   │   ├── index.ts              # Экспорт всех контролов
│   │   ├── SectorModeControl.vue # "Закрытие уровня"
│   │   ├── BonusTimeControl.vue  # "Бонусное время (ч, м, с)"
│   │   ├── ClosedSectorControl.vue # "Название закрытого сектора"
│   │   ├── OpenSectorControl.vue # "Заполнить открытые сектора"
│   │   ├── SectorNameControl.vue # "Название секторов"
│   │   ├── BonusNameControl.vue  # "Название бонусов"
│   │   ├── DelayControl.vue      # "Задержка (ч, м, с)"
│   │   ├── LimitControl.vue      # "Ограничение (ч, м, с)"
│   │   ├── BonusTaskControl.vue  # "Бонусные задания"
│   │   ├── HintControl.vue       # "Подсказки (по факту выполнения)"
│   │   └── BonusLevelsControl.vue # "Уровни бонусов"
│   └── buttons/                  # База кнопок
│       ├── index.ts              # Экспорт всех кнопок
│       ├── NavigationButtons.vue # Левая часть футера (Назад)
│       ├── FunctionalButtons.vue # Центральная часть футера (Очистить, Экспорт, Импорт, Предпросмотр, Добавить коды)
│       └── ActionButtons.vue     # Правая часть футера (Залить задание, секторы, бонусы)
├── payloads/                     # Пейлоады
│   ├── index.ts                  # Экспорт всех пейлоадов
│   ├── TaskPayload.ts           
│   ├── SectorPayload.ts         
│   └── BonusPayload.ts          
├── configs/                      # Конфиги типов уровней
│   ├── index.ts                  # Экспорт + реестр типов
│   ├── olymp.ts                  # Конфиг "Олимпийка"
│   └── type100500.ts             # Конфиг "100500"
├── components/                   # Компоненты слотов
│   ├── LevelHeader.vue           # Слот "шапка"
│   ├── LevelTabs.vue             # Слот "блоки (табы)" - новый слот
│   ├── LevelControlPanel.vue     # Слот "контрол-панель"
│   ├── LevelContent.vue          # Слот "таблица контента"
│   ├── LevelFooter.vue           # Слот "подвал с кнопками"
│   └── LevelUploadPage.vue       # Общий шаблон страницы
├── composables/                  # Композаблы для логики
│   ├── useLevelFields.ts         # Логика работы с полями
│   ├── useLevelControls.ts       # Логика контрол-панели
│   └── useLevelPayloads.ts       # Логика пейлоадов
├── store/                        # Store для v2
│   └── index.ts                  # Новый store для новой архитектуры
└── types/                        # Типы TypeScript
    ├── index.ts                  # Экспорт всех типов
    ├── fields.ts                 # Типы для полей
    ├── configs.ts                # Типы для конфигов
    └── payloads.ts               # Типы для пейлоадов
```

## Дополнительные правила для разработки

**Правила совместимости:**
- НИКОГДА не изменять импорты из `level-system` в существующих файлах
- Новые роуты `/v2/test/:levelType` должны работать независимо от основных роутов
- На каждом шаге проверять что основные роуты (`/test/:levelType`) продолжают работать
- Использовать разные store для старой и новой систем

**Правила безопасности:**
- При любой критической ошибке - возможность быстрого отката к старой системе
- Тестирование каждого шага в изоляции от основной системы
- Проверка отсутствия конфликтов имен компонентов и функций

**Правила миграции компонентов:**
- При портировании из старой архитектуры - копировать код, НЕ перемещать файлы
- Сохранять исходные файлы для возможности сравнения
- Документировать все изменения в портированном коде

**Правила тестирования:**
- Каждый новый компонент тестировать изолированно
- Проверять работу с реальными данными из localStorage
- Тестировать взаимодействие с существующими API

## Этапы реализации

### ☐ Шаг 1: Анализ неиспользуемых файлов level-system

**Детальные инструкции:**

1. **Анализ импортов** - найти все файлы, которые импортируются из level-system:
   ```bash
   cd frontend/src
   grep -r "from.*level-system" . --include="*.vue" --include="*.ts" --include="*.js"
   ```
   
2. **Проверка использования конкретных файлов:**
   - `useOlympControls.ts`: `grep -r "useOlympControls" frontend/src` (ожидается 0 результатов)
   - `controls.ts`: `grep -r "from.*level-system/registry/controls" frontend/src` (ожидается 0 результатов)
   - `fields.ts`: `grep -r "from.*level-system/registry/fields" frontend/src` (ожидается 0 результатов)

3. **КРИТИЧНО - НЕ удалять эти файлы** (используются в рабочей системе):
   - `schema.ts` - импортируется в OlympBase.vue, Type100500/index.vue
   - `types/index.ts` - импортируется в 4 рабочих файлах  
   - `types/olymp.ts` - используется через types/index.ts
   - `types/type100500.ts` - используется через types/index.ts

4. **Безопасное удаление** только после 100% подтверждения неиспользования:
   ```bash
   rm frontend/src/components/level-system/useOlympControls.ts
   rm frontend/src/components/level-system/registry/controls.ts  
   rm frontend/src/components/level-system/registry/fields.ts
   ```

5. **Обновить index.ts** - убрать экспорты удаленных файлов:
   - Открыть `level-system/registry/index.ts`
   - Удалить строки экспорта controls и fields (если есть)

**Критерии завершения:**
- ✅ Команды grep подтверждают отсутствие импортов удаляемых файлов
- ✅ Основные роуты `/test/olymp15`, `/test/type100500` работают без ошибок
- ✅ Консоль браузера не показывает ошибки импортов

**Проверки:**
- ☐ ESLint без ошибок: `cd frontend && npm run lint`
- ☐ Сборка проекта без ошибок: `cd frontend && npm run build`
- ☐ Основные роуты работают: открыть http://192.168.0.12:5173/test/olymp15 и http://192.168.0.12:5173/test/type100500

### ☐ Шаг 2: Создание папочной структуры level-system-v2

**Детальные инструкции:**

1. **Создание основной папки:**
   ```bash
   mkdir -p frontend/src/components/level-system-v2
   cd frontend/src/components/level-system-v2
   ```

2. **Создание структуры папок:**
   ```bash
   # Создать все папки одной командой
   mkdir -p bases/fields bases/controls bases/buttons payloads configs components composables store types
   ```

3. **Создание базовых индексных файлов:**
   
   **bases/fields/index.ts:**
   ```typescript
   // Экспорт всех полей + типы
   export * from './fieldDefinitions'
   export * from './tableRenderers'
   ```
   
   **bases/controls/index.ts:**
   ```typescript  
   // Экспорт всех контрол-сниппетов
   // Файлы будут добавлены в последующих шагах
   ```
   
   **bases/buttons/index.ts:**
   ```typescript
   // Экспорт всех кнопок
   // Файлы будут добавлены в последующих шагах  
   ```
   
   **payloads/index.ts:**
   ```typescript
   // Экспорт всех пейлоадов
   // Файлы будут добавлены в последующих шагах
   ```
   
   **configs/index.ts:**
   ```typescript
   // Экспорт + реестр типов
   // Файлы будут добавлены в последующих шагах
   ```
   
   **store/index.ts:**
   ```typescript
   // Новый store для level-system-v2
   // Реализация будет добавлена в следующих шагах
   ```
   
   **types/index.ts:**
   ```typescript
   // Экспорт всех TypeScript типов
   export * from './fields'
   export * from './configs'  
   export * from './payloads'
   ```

4. **Проверка создания структуры:**
   ```bash
   # Из корня проекта
   tree frontend/src/components/level-system-v2 -I node_modules
   ```
   
   **Ожидаемый результат:**
   ```
   level-system-v2/
   ├── bases/
   │   ├── fields/
   │   │   └── index.ts
   │   ├── controls/
   │   │   └── index.ts
   │   └── buttons/
   │       └── index.ts
   ├── payloads/
   │   └── index.ts
   ├── configs/
   │   └── index.ts
   ├── components/
   ├── composables/
   ├── store/
   │   └── index.ts
   └── types/
       └── index.ts
   ```

5. **Тест независимости от старой системы:**
   - Убедиться что НЕТ импортов из `../level-system` ни в одном файле
   - Все пути должны быть относительными внутри level-system-v2

**Критерии завершения:**
- ✅ Все папки созданы согласно структуре
- ✅ Все базовые index.ts файлы созданы с заглушками экспортов
- ✅ `tree` команда показывает правильную структуру
- ✅ НЕТ импортов из старой level-system

**Проверки:**
- ☐ ESLint без ошибок: `cd frontend && npm run lint`
- ☐ Сборка проекта без ошибок: `cd frontend && npm run build`
- ☐ Структура папок соответствует плану: `tree frontend/src/components/level-system-v2`

### ☐ Шаг 3: Создание TypeScript типов

**Детальные инструкции:**

1. **Создание types/fields.ts** - типы для системы полей:
   ```typescript
   // Типы полей на основе документации new-level-types.md
   export type LevelFieldId = 
     | 'answer'          // Ответ
     | 'sector'          // Сектор  
     | 'bonus'           // Бонус
     | 'bonusLevels'     // Уровни бонуса
     | 'bonusTime'       // Бонусное время
     | 'delay'           // Задержка
     | 'limit'           // Ограничение  
     | 'closedSector'    // Закрытый сектор
     | 'openSector'      // Открытый сектор
     | 'sectorName'      // Название сектора
     | 'bonusName'       // Название бонуса  
     | 'bonusTask'       // Бонусное задание
     | 'hint'            // Подсказка

   export interface LevelFieldDefinition {
     id: LevelFieldId
     columnTitle: string              // Название колонки в таблице
     hasControlSnippet: boolean       // Есть ли контрол-сниппет
     renderInTable: boolean           // Отображать ли в таблице
   }

   export interface TimeValue {
     hours: number
     minutes: number  
     seconds: number
     negative?: boolean  // Только для bonusTime
   }
   ```

2. **Создание types/configs.ts** - типы для конфигурации:
   ```typescript
   export interface LevelSubtype {
     id: string
     name: string                     // "15 секторов", "31 сектор" и т.д.
     dimension: number                // 15, 31, 63, 127
   }

   export interface LevelTypeConfig {
     id: string
     name: string                     // "Олимпийка", "100500 секторов и бонусов"  
     subtypes?: LevelSubtype[]        // Подтипы (если есть)
     manualCodeAddition: boolean      // Ручное добавление кодов
     hasMultipleBlocks: boolean       // Блоки (табы)
     fields: LevelFieldId[]           // Поля для этого типа
     navigationButtons: string[]      // ["Назад"]
     functionalButtons: string[]      // ["Очистить", "Экспорт", ...]  
     actionButtons: ActionButtonConfig[] // Экшн-кнопки с настройками
   }

   export interface ActionButtonConfig {
     type: 'task' | 'sectors' | 'bonuses'
     label: string
     combineSectors?: boolean         // Для кнопки "Залить секторы"
   }
   ```

3. **Создание types/payloads.ts** - типы для пейлоадов:
   ```typescript
   export interface BasePayload {
     domain: string
     gameId: string
     levelId: string
   }

   export interface TaskPayload extends BasePayload {
     inputTask: string                // HTML контент
   }

   export interface SectorPayloadItem {
     answerText: string
     closedText: string
     displayText: string
     bonusTime?: TimeValue
   }

   export interface BonusPayloadItem {
     answerText: string
     bonusName: string
     bonusTask?: string
     bonusHint?: string
     bonusTime?: TimeValue
     delay?: TimeValue
     limit?: TimeValue
     targetLevels?: string[]
   }
   ```

4. **Обновление types/index.ts** - добавить импорты созданных типов:
   ```typescript
   // Экспорт всех TypeScript типов
   export * from './fields'
   export * from './configs'  
   export * from './payloads'
   
   // Переэкспорт для удобства
   export type { LevelFieldId, LevelFieldDefinition, TimeValue } from './fields'
   export type { LevelTypeConfig, LevelSubtype, ActionButtonConfig } from './configs'
   export type { BasePayload, TaskPayload, SectorPayloadItem, BonusPayloadItem } from './payloads'
   ```

5. **Проверка типов компилятором:**
   ```bash
   cd frontend
   npx tsc --noEmit --project tsconfig.json
   ```

6. **Тест импорта типов** - создать временный тестовый файл:
   ```typescript
   // Создать frontend/src/components/level-system-v2/__test-types.ts
   import type { LevelFieldId, LevelTypeConfig, BasePayload } from './types'
   
   // Проверить что типы доступны
   const testField: LevelFieldId = 'answer'
   const testConfig: Partial<LevelTypeConfig> = { id: 'test' }
   const testPayload: Partial<BasePayload> = { domain: 'test' }
   
   export { testField, testConfig, testPayload }
   ```

7. **Очистка** - удалить тестовый файл после проверки:
   ```bash
   rm frontend/src/components/level-system-v2/__test-types.ts
   ```

**Критерии завершения:**
- ✅ Все 4 файла типов созданы (fields.ts, configs.ts, payloads.ts, index.ts)
- ✅ TypeScript компиляция проходит без ошибок
- ✅ Тестовый импорт работает корректно
- ✅ Типы соответствуют документации new-level-types.md

**Проверки:**
- ☐ ESLint без ошибок: `cd frontend && npm run lint`
- ☐ Сборка проекта без ошибок: `cd frontend && npm run build`
- ☐ TypeScript компиляция: `cd frontend && npx tsc --noEmit`

### ☐ Шаг 4: Создание store для новой архитектуры
- Создание нового Pinia store для level-system-v2
- Реализация логики управления состоянием без привязки к конкретным типам
- **ВАЖНО**: НЕ конфликтовать с существующим store

**Проверки:**
- ☐ ESLint без ошибок
- ☐ Сборка проекта без ошибок
- ☐ Основные роуты продолжают работать с существующим store

### ☐ Шаг 5: Добавление тестового роутинга
- Создание роутов `/v2/test/:levelType` для тестирования
- Создание заглушки компонента для тестирования доступности

**Проверки:**
- ☐ ESLint без ошибок
- ☐ Сборка проекта без ошибок
- ☐ Тестирование UI с playwright - доступность новых роутов

### ☐ Шаг 6: Создание базового общего шаблона
- Создание LevelUploadPage.vue с основными слотами (включая новый слот для табов)
- Реализация каркаса без конкретной логики

**Проверки:**
- ☐ ESLint без ошибок
- ☐ Сборка проекта без ошибок
- ☐ Тестирование UI с playwright - отображение базовой структуры

### ☐ Шаг 7: Реализация слота LevelHeader
- Создание компонента LevelHeader.vue
- Интеграция с существующими мета-данными (переиспользование логики)

**Проверки:**
- ☐ ESLint без ошибок
- ☐ Сборка проекта без ошибок
- ☐ Тестирование UI с playwright - отображение заголовка

### ☐ Шаг 8: Реализация слота LevelTabs
- Создание компонента LevelTabs.vue с PrimeVue Tabs
- Поддержка одного таба (для Олимпийки) и множественных (для 100500)

**Проверки:**
- ☐ ESLint без ошибок
- ☐ Сборка проекта без ошибок
- ☐ Тестирование UI с playwright - работа табов

### ☐ Шаг 9: Создание базы полей - определения
- Создание fieldDefinitions.ts со всеми полями из документа
- Только метаданные полей без компонентов

**Проверки:**
- ☐ ESLint без ошибок
- ☐ Сборка проекта без ошибок

### ☐ Шаг 10: Создание базы полей - рендеры (часть 1)
- Реализация рендер-функций для полей: Answer, Sector, Bonus
- Портирование логики из существующего Answers.vue

**Проверки:**
- ☐ ESLint без ошибок
- ☐ Сборка проекта без ошибок

### ☐ Шаг 11: Создание базы полей - рендеры (часть 2)  
- Реализация рендер-функций: BonusTime, ClosedSector, OpenSector
- Портирование логики из существующего Answers.vue

**Проверки:**
- ☐ ESLint без ошибок
- ☐ Сборка проекта без ошибок

### ☐ Шаг 12: Создание базы полей - рендеры (часть 3)
- Реализация рендер-функций для 100500: BonusLevels, Delay, Limit
- Создание с нуля на PrimeVue

**Проверки:**
- ☐ ESLint без ошибок
- ☐ Сборка проекта без ошибок

### ☐ Шаг 13: Создание базы полей - рендеры (часть 4)
- Реализация рендер-функций: SectorName, BonusName, BonusTask, Hint
- Создание с нуля на PrimeVue

**Проверки:**
- ☐ ESLint без ошибок
- ☐ Сборка проекта без ошибок

### ☐ Шаг 14: Реализация слота LevelContent
- Создание LevelContent.vue с DataTable
- Интеграция с базой полей для динамического рендеринга колонок

**Проверки:**
- ☐ ESLint без ошибок
- ☐ Сборка проекта без ошибок
- ☐ Тестирование UI с playwright - отображение таблицы с полями

### ☐ Шаг 15: Создание базы контрол-сниппетов (часть 1)
- Реализация SectorModeControl, BonusTimeControl
- Портирование из OlympBase.vue

**Проверки:**
- ☐ ESLint без ошибок
- ☐ Сборка проекта без ошибок

### ☐ Шаг 16: Создание базы контрол-сниппетов (часть 2)  
- Реализация ClosedSectorControl, OpenSectorControl
- Портирование из OlympBase.vue

**Проверки:**
- ☐ ESLint без ошибок
- ☐ Сборка проекта без ошибок

### ☐ Шаг 17: Создание базы контрол-сниппетов (часть 3)
- Реализация контролов для 100500: SectorNameControl, BonusNameControl
- Создание с нуля на PrimeVue

**Проверки:**
- ☐ ESLint без ошибок
- ☐ Сборка проекта без ошибок

### ☐ Шаг 18: Создание базы контрол-сниппетов (часть 4)  
- Реализация DelayControl, LimitControl, BonusTaskControl, HintControl, BonusLevelsControl
- Создание с нуля на PrimeVue

**Проверки:**
- ☐ ESLint без ошибок
- ☐ Сборка проекта без ошибок

### ☐ Шаг 19: Реализация слота LevelControlPanel
- Создание LevelControlPanel.vue
- Динамическое отображение контрол-сниппетов на основе конфига

**Проверки:**
- ☐ ESLint без ошибок
- ☐ Сборка проекта без ошибок
- ☐ Тестирование UI с playwright - работа контрол-панели

### ☐ Шаг 20: Создание базы кнопок - навигационные
- Реализация NavigationButtons.vue (кнопка "Назад")

**Проверки:**
- ☐ ESLint без ошибок
- ☐ Сборка проекта без ошибок

### ☐ Шаг 21: Создание базы кнопок - функциональные
- Реализация FunctionalButtons.vue (Очистить, Экспорт, Импорт, Предпросмотр, Добавить коды)
- Интеграция с существующими модальными окнами (ExportModal, ImportModal, PreviewModal)

**Проверки:**
- ☐ ESLint без ошибок
- ☐ Сборка проекта без ошибок

### ☐ Шаг 22: Создание базы кнопок - экшн-кнопки
- Реализация ActionButtons.vue (Залить задание, Залить секторы, Залить бонусы)
- Подготовка к интеграции с пейлоадами

**Проверки:**
- ☐ ESLint без ошибок
- ☐ Сборка проекта без ошибок

### ☐ Шаг 23: Реализация слота LevelFooter  
- Создание LevelFooter.vue с тремя областями (левая, центральная, правая)
- Интеграция всех групп кнопок

**Проверки:**
- ☐ ESLint без ошибок
- ☐ Сборка проекта без ошибок
- ☐ Тестирование UI с playwright - работа футера с кнопками

### ☐ Шаг 24: Создание TaskPayload
- Реализация логики формирования пейлоада для заливки заданий
- Портирование из services/uploader.ts

**Проверки:**
- ☐ ESLint без ошибок
- ☐ Сборка проекта без ошибок

### ☐ Шаг 25: Создание SectorPayload
- Реализация логики формирования пейлоада для заливки секторов
- Портирование из services/uploader.ts

**Проверки:**
- ☐ ESLint без ошибок
- ☐ Сборка проекта без ошибок

### ☐ Шаг 26: Создание BonusPayload
- Реализация логики формирования пейлоада для заливки бонусов
- Портирование из services/uploader.ts

**Проверки:**
- ☐ ESLint без ошибок
- ☐ Сборка проекта без ошибок

### ☐ Шаг 27: Создание конфига "Олимпийка"
- Создание конфига olymp.ts с подтипами и настройками
- Определение полей, контролов, кнопок для Олимпийки

**Проверки:**
- ☐ ESLint без ошибок
- ☐ Сборка проекта без ошибок

### ☐ Шаг 28: Создание реестра типов уровней
- Создание системы регистрации типов уровней
- Интеграция конфига "Олимпийка"

**Проверки:**
- ☐ ESLint без ошибок
- ☐ Сборка проекта без ошибок

### ☐ Шаг 29: Полная интеграция "Олимпийка"
- Подключение всех компонентов для работы с "Олимпийкой"
- Тестирование всех подтипов (15, 31, 63, 127 секторов)

**Проверки:**
- ☐ ESLint без ошибок
- ☐ Сборка проекта без ошибок
- ☐ Тестирование UI с playwright - полный функционал "Олимпийка"

### ☐ Шаг 30: Создание конфига "100500"
- Создание конфига type100500.ts с настройками
- Определение полей, контролов, кнопок для 100500

**Проверки:**
- ☐ ESLint без ошибок
- ☐ Сборка проекта без ошибок

### ☐ Шаг 31: Полная интеграция "100500"
- Подключение всех компонентов для работы с "100500"
- Тестирование уникального функционала (ручное добавление кодов, табы)

**Проверки:**
- ☐ ESLint без ошибок
- ☐ Сборка проекта без ошибок
- ☐ Тестирование UI с playwright - полный функционал "100500"

### ☐ Шаг 32: Финальный рефакторинг
- Анализ и устранение дублированного кода
- Оптимизация производительности
- Добавление JSDoc комментариев к сложным участкам

**Проверки:**
- ☐ ESLint без ошибок
- ☐ Сборка проекта без ошибок
- ☐ Тестирование UI с playwright - финальная проверка всех функций

---

## Дополнительные материалы

**📋 Техническая карта проекта**: [docs/context.md](./context.md) - исчерпывающая информация о текущей архитектуре, зависимостях, структуре данных и готовых компонентах для переиспользования.

**📚 Концептуальная документация**: [docs/new-level-types.md](./new-level-types.md) - источник истины для новой архитектуры, описание всех полей, контролов и принципов.

---

**ВАЖНО!** 
- Этот документ будет актуализироваться после каждого выполненного шага с добавлением технических деталей реализации
- **Остальные шаги (4-32) должны быть детализированы по тому же принципу** с конкретными инструкциями, примерами кода, командами и критериями завершения
- Каждый новый разработчик должен иметь 100% контекст для выполнения любого шага без дополнительных вопросов