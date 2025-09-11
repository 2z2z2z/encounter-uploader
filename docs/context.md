# Техническая карта проекта encounter-uploader

**Цель документа**: Предоставить полный контекст проекта для разработчиков новой архитектуры level-system-v2.

## Бизнес-контекст и проблемы

### Зачем нужна новая архитектура?
**Основные проблемы текущей системы:**
- **Дублирование кода** между типами уровней (Олимпийка vs 100500)
- **Сложность добавления новых типов** - каждый тип = отдельный компонент с копипастом
- **Несконсистентный UX** - разный интерфейс для похожих действий
- **Технический долг** - смешение PrimeVue и кастомных компонентов в 100500
- **Сложность поддержки** - изменения нужно делать в нескольких местах

### Цели новой архитектуры:
- **Конструкторный подход** - собирать типы уровней из готовых кирпичиков
- **Реестры** - единая база полей, контролов и кнопок
- **Консистентный UX** - одинаковый интерфейс для всех типов
- **Легкое масштабирование** - добавление нового типа = создание конфига
- **100% PrimeVue** - отказ от кастомных UI решений

### Стратегия миграции:
1. **Фаза 1**: Полная независимая разработка level-system-v2
2. **Фаза 2**: Тестирование на отдельных роутах `/v2/*`  
3. **Фаза 3**: Постепенный переход пользователей (по типам уровней)
4. **Фаза 4**: Упразднение старой системы после полной миграции

## Текущая архитектура (level-system)

### Активно используемые файлы
**НЕ ТРОГАТЬ! Эти файлы используются в рабочей системе:**

- `level-system/registry/types/index.ts` - экспорт `getTypeConfig()` (используется в 4 компонентах)
- `level-system/registry/types/olymp.ts` - конфиги подтипов Олимпийки  
- `level-system/registry/types/type100500.ts` - конфиг 100500
- `level-system/registry/schema.ts` - TypeScript типы (используется в OlympBase.vue, Type100500)

### Неиспользуемые файлы
**МОЖНО БЕЗОПАСНО УДАЛИТЬ:**

- `level-system/useOlympControls.ts` - не импортируется нигде
- `level-system/registry/controls.ts` - не импортируется нигде  
- `level-system/registry/fields.ts` - не импортируется нигде

### Импорты в рабочих компонентах
```typescript
// UploadForm.vue:11
import { getTypeConfig } from './level-system/registry/types'

// TestUploadPage.vue:101  
import { getTypeConfig } from './level-system/registry/types'

// OlympBase.vue:181-182
import { getTypeConfig } from '../level-system/registry/types'
import type { TypeButtonsConfig } from '../level-system/registry/schema'

// Type100500/index.vue:346-347
import { getTypeConfig } from '../../level-system/registry/types'
import type { ControlId } from '../../level-system/registry/schema'
```

## Компоненты для переиспользования

### Модальные окна (готовы к использованию)
- `common/modals/ExportModal.vue` - экспорт данных
- `common/modals/ImportModal.vue` - импорт данных  
- `common/modals/PreviewModal.vue` - предпросмотр пейлоада
- `common/modals/CodesModal.vue` - модальное окно с кодами
- `common/modals/LevelsModal.vue` - выбор уровней

### UI компоненты (готовы к использованию)
- `ui/LoadingOverlay.vue` - оверлей загрузки
- `ui/BaseModal.vue` - базовая модалка
- `ui/TimeInput.vue` - ввод времени (ч:м:с)
- `UploadProgress.vue` - прогресс загрузки

### Уведомления и диалоги (готовы к использованию)
- `common/notifications/ToastNotification.vue` - toast уведомления
- `common/notifications/ConfirmDialog.vue` - диалоги подтверждения

### Правила переиспользования
Компоненты из директорий `common/` и `ui/` считаются общими для всего приложения. Их **можно и нужно** импортировать и использовать в `level-system-v2` напрямую. Принцип независимости новой архитектуры относится к ее основной бизнес-логике и состоянию, но не запрещает переиспользование универсальных UI-элементов. Копирование этих компонентов в `level-system-v2` не требуется.

## Структура данных

### Store (v1: useUploadStore, v2: useLevelV2Store)
**Локация**: `src/store/index.ts`

**LocalStorage v2 формат:**
```typescript
// Разделение по типам для изоляции данных
'v2-olymp15-data'    // данные Олимпийки 15
'v2-olymp31-data'    // данные Олимпийки 31
'v2-olymp63-data'    // данные Олимпийки 63
'v2-olymp127-data'   // данные Олимпийки 127
'v2-type100500-data' // данные 100500

// Структура каждого ключа
{
  schemaVersion: 1,
  tabs: TabData[],    // массив табов с данными
  config: {...},      // настройки типа уровня
  timestamp: number   // время последнего сохранения
}
```

**Основные поля:**
```typescript
// Настройки игры
domain: string
gameId: string  
levelId: string
uploadType: string  // 'olymp15', 'olymp31', 'olymp63', 'olymp127', '100500'

// Конфигурация уровня
config: {
  sectorMode: 'all' | 'initialAndFinal' | 'finalOnly'
  bonusTime: { hours, minutes, seconds, negative }
}

// Данные полей
closedPattern: string
answers: Answer[]  // массив ответов
```

**Ключевые функции:**
- `setUploadType(type, prevType)` - смена типа с сохранением данных
- `saveTypeData(type)` - сохранение в localStorage  
- `loadTypeData(type)` - загрузка из localStorage
- `clearTypeData()` - очистка данных

### Структура Answer (базовая модель)
```typescript
interface Answer {
  number: number
  variants: string[]           // варианты ответов
  inSector: boolean           // участвует в секторе
  inBonus: boolean            // участвует в бонусе
  bonusTime: {
    hours: number
    minutes: number  
    seconds: number
    negative: boolean
  }
  closedText: string          // закрытый сектор
  displayText: string         // открытый сектор
}
```

## API и пейлоады

### Сервис загрузки  
**Локация**: `src/services/uploader.ts`

**Основные функции:**
- `buildTaskPayload()` - формирование пейлоада для заданий (строки 94-100)
- `buildSectorPayload()` - формирование пейлоада для секторов  
- `buildBonusPayload()` - формирование пейлоада для бонусов
- `uploadTask()` - загрузка заданий (строки 176-227)
- `uploadSectors()` - загрузка секторов (строки 229-290)  
- `uploadBonuses()` - загрузка бонусов (строки 292-436)

**API эндпоинты:**
- `POST /api/upload-task` - загрузка заданий
- `POST /api/upload-sectors` - загрузка секторов
- `POST /api/upload-bonuses` - загрузка бонусов
- `GET /api/admin/bonus-form` - получение списка уровней для бонусов

### Формат пейлоадов
```typescript
// TaskPayload
URLSearchParams {
  domain, gid, level, inputTask (HTML)
}

// SectorPayload  
URLSearchParams {
  domain, gid, level, 
  + поля для каждого сектора
}

// BonusPayload
URLSearchParams {
  domain, gid, level,
  + поля для каждого бонуса
}
```

## Маршрутизация

### Текущие роуты
- `/` - редирект на `/login`  
- `/login` - LoginForm.vue
- `/settings` - SettingsForm.vue
- `/upload` - UploadForm.vue  
- `/test/:levelType` - TestUploadPage.vue

### Планируемые роуты v2
- `/v2/test/:levelType` — новая архитектура (независимо от основных)
- Минимальный набор: `/v2/test/olymp15|31|63|127`, `/v2/test/type100500`
- Без гардов на настройки (изолированные тестовые страницы)

## Тестовые данные

### Демо доступы
- Логин: `test` / Пароль: `test`
- Домен: `test`, gameId: `test`, levelId: `1`
- uploadType: `uploadType_0` (Олимп) или `uploadType_4` (100500)

### Тестовые URL
- http://192.168.0.12:5173/test/olymp15
- http://192.168.0.12:5173/test/olymp31
- http://192.168.0.12:5173/test/olymp63  
- http://192.168.0.12:5173/test/olymp127
- http://192.168.0.12:5173/test/type100500

## Стилизация и темы

### PrimeVue настройки
- Кастомная тема Aura
- Конфиг: `frontend/tailwind.config.js`
- Все стили через TailwindCSS классы

### Консистентный дизайн
- Олимпийка имеет устоявшийся дизайн - **сохранить как есть**
- Все новые компоненты должны соответствовать дизайну Олимпийки
- Использовать только PrimeVue компоненты

## Зависимости между компонентами

### Олимпийка (OlympBase.vue)
**Зависит от:**
- `Answers.vue` - таблица с ответами
- `LevelUploadLayout.vue` - основной лейаут
- Модальные окна (Export, Import, Preview)  
- `level-system/registry/types` - getTypeConfig()

### 100500 (Type100500/index.vue)  
**Зависит от:**
- `LevelUploadLayout.vue` - основной лейаут
- `level-system/registry/types` - getTypeConfig()
- Встроенная таблица (НЕ на PrimeVue - нужно портировать)

### TestUploadPage.vue
**Универсальный компонент** для тестирования типов уровней:
- Автоматически определяет тип по роуту
- Инициализирует тестовые данные
- Показывает отладочную информацию

## Критические моменты для level-system-v2

### Обязательные требования
1. **Полная независимость** от level-system
2. **Сохранение работоспособности** старых роутов  
3. **Копирование кода**, НЕ перемещение файлов
4. **100% PrimeVue** компоненты
5. **Идентичный UI** с Олимпийкой

### Потенциальные проблемы
- Конфликты имен компонентов/функций
- Конфликты в localStorage ключах
- Конфликты в роутинге  
- Несовместимость с существующим store

### Стратегия миграции
- Создать отдельный store для v2
- Использовать префиксы для всех имен (LevelV2*)  
- Отдельные роуты `/v2/*`
- Возможность быстрого отката к старой системе

## Правила level-system-v2 (сводка)

- Скоп операций, контролов и кнопок — только активный таб.
- Выбор строк в DataTable не используется. Reorder/drag&drop выключены.
- Табы для 100500: до 10 штук, имя 1–20 символов, уникальность не требуется.
- Для Олимпийки — один логический таб `default`, визуально табы скрыты.
- LocalStorage: префикс `v2-`, `schemaVersion: 1`, автосохранение, миграции не выполняются.
- Предпросмотр — только для Task.
- "Добавить коды": добавление в активный таб, проверка дубликатов во всех табах, отбрасывание существующих.
- "Очистить": очищает активный таб, подтверждение обязательно.
- Поле "Ответ": без нормализации и хоткеев.
- "Закрытие уровня": управляет `sectorMode`.
- "Уровни бонуса": загрузка списка через API `/api/admin/bonus-form`, множественный выбор, портировано на PrimeVue.
- "Задержка/Ограничение": TimeInput без `negative`.
- Сохранить текущую логику "Объединить сектора (БМП)" в пейлоадах.
- Импорт/экспорт: работа со всеми табами сразу (JSON или CSV с полем `tab`).
- Массовые операции контрол-панели: применяются только к активному табу.
- Пейлоады type100500: собираются из всех табов, отправляются последовательно.
- Ограничение строк: 10000 на таб при ручном добавлении, фиксированная размерность для Олимпийки.

## Канонические идентификаторы полей (fieldId)

`answer`, `sector`, `bonus`, `bonusTime`, `closedText`, `displayText`, `bonusLevels`, `delay`, `limit`, `sectorName`, `bonusName`, `bonusTask`, `hint`.

## Важное уточнение по типам уровней

**⚠️ КРИТИЧЕСКИ ВАЖНО для разработчиков:**

На момент окончания разработки, в новой системе должно существовать **только 2 типа уровней**:
- `olymp` - Олимпийка (с подтипами на основе `размерности`)  
- `type100500` - 100500 секторов и бонусов (без подтипов)