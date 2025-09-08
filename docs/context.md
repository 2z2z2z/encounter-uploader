# Техническая карта проекта encounter-uploader

**Цель документа**: Предоставить исчерпывающую техническую информацию для разработчиков, работающих над новой архитектурой level-system-v2.

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
- `LevelUploadLayout.vue` - основной лейаут страницы загрузки

### Уведомления и диалоги (готовы к использованию)
- `common/notifications/ToastNotification.vue` - toast уведомления
- `common/notifications/ConfirmDialog.vue` - диалоги подтверждения

## Структура данных

### Store (useUploadStore)
**Локация**: `src/store/index.ts`

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

### Структура Answer
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
- `/v2/test/:levelType` - новая архитектура (независимо от основных)

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