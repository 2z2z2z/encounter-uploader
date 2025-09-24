# Инвентаризация для удаления старой архитектуры

**Дата:** 24.09.2025
**Цель:** Удаление старой архитектуры level-system и всех связанных файлов

## 📊 Статистика

- **Старых файлов level-system:** 8
- **Старых компонентов:** 8 файлов + 2 папки
- **Старых композаблов:** 2
- **Старых тестовых конфигов:** 6 файлов
- **Старых store:** 1
- **Неиспользуемых контролов:** 3
- **Неиспользуемых UI компонентов:** 4
- **Неиспользуемых утилит:** 2

**Всего файлов/папок на удаление:** 31 файл

## 🗑️ Список файлов на удаление

### 1. Старая архитектура level-system (8 файлов)

**Папка:** `frontend/src/components/level-system/`

```
level-system/
├── registry/
│   ├── controls.ts
│   ├── fields.ts
│   ├── index.ts
│   ├── schema.ts
│   └── types/
│       ├── index.ts
│       ├── olymp.ts
│       └── type100500.ts
└── useOlympControls.ts
```

**Причина удаления:** Полностью заменена архитектурой level-system-v2. Используется только в компонентах старой архитектуры (OlympBase.vue).

**Зависимости:**
- `OlympBase.vue` импортирует `getTypeConfig` и `TypeButtonsConfig` из `level-system/registry`
- После удаления OlympBase.vue может быть удалена

### 2. Старые компоненты типов уровней

#### 2.1 Корневые компоненты (3 файла)

```
frontend/src/components/
├── TestUploadPage.vue          # Заменен на TestUploadPageV2.vue
├── UploadForm.vue               # Заглушка-перенаправление на v2
└── LevelUploadLayout.vue        # Используется только в старых компонентах
```

**Зависимости:**
- `TestUploadPage.vue` → использует `OlympBase.vue`, `Type100500/index.vue`, `useTestConfig.ts`
- `UploadForm.vue` → заглушка, не импортируется нигде (роутер уже перенаправляет на v2)
- `LevelUploadLayout.vue` → используется в `OlympBase.vue` и `Type100500/index.vue`

**Импорты в роутере:** Удалены на шаге 32, компоненты не используются в навигации

#### 2.2 Папка types/ (5 файлов)

```
frontend/src/components/types/
├── OlympBase.vue                # Старая Олимпийка
├── olymp/
│   └── Answers.vue              # Используется только в OlympBase.vue
└── Type100500/
    └── index.vue                # Старая 100500
```

**Причина удаления:**
- Все типы уровней портированы в level-system-v2
- Используются только в `TestUploadPage.vue` (старый)
- `OlympBase.vue` импортирует из старого `level-system/registry`

### 3. Старые композаблы (1 файл)

```
frontend/src/composables/
└── useTestConfig.ts             # Работает с test-configs/ (старые JSON)
```

**Причина удаления:**
- Заменен на `useTestConfigV2.ts` (работает с test-configs-v2/)
- Используется только в `TestUploadPage.vue`

**Зависимости:**
- Импортирует из `test-configs/config.json`
- После удаления test-configs/ теряет смысл

### 4. Старые тестовые конфиги (6 файлов)

```
frontend/test-configs/
├── config.json                  # Маппинг типов на JSON
├── olymp15.json
├── olymp31.json
├── olymp63.json
├── olymp127.json
└── type100500.json
```

**Причина удаления:**
- Заменены на test-configs-v2/ с новым форматом (TabData структура)
- Используются только в `useTestConfig.ts` → `TestUploadPage.vue`

**Отличия от v2:**
- Старый формат: плоский массив answers без табов
- Новый формат: структура с tabs, каждый таб содержит answers

### 5. Старый store (1 файл)

```
frontend/src/store/
└── index.ts                     # useUploadStore - старая Pinia store
```

**Причина удаления:**
- Заменен на `level-system-v2/store/index.ts` (useLevelV2Store)
- Используется в старых компонентах: `TestUploadPage.vue`, `OlympBase.vue`, `Type100500/index.vue`, `types/olymp/Answers.vue`

**Функционал:**
- Управление answers для старой архитектуры
- localStorage с префиксом без `v2-`
- Не поддерживает табы (добавлены в v2)

### 6. Неиспользуемые контролы (3 файла)

```
frontend/src/components/common/controls/
├── BonusTimeControl.vue         # Дубликат из level-system-v2/bases/controls
├── PatternControl.vue           # Не используется нигде
└── SectorModeControl.vue        # Дубликат из level-system-v2/bases/controls
```

**Причина удаления:**
- **BonusTimeControl.vue**: портирован в `level-system-v2/bases/controls/BonusTimeControl.vue`
- **SectorModeControl.vue**: портирован в `level-system-v2/bases/controls/SectorModeControl.vue`
- **PatternControl.vue**: не найдено использований в проекте
- **Grep результат:** `from.*common/controls` → 0 совпадений

**Анализ размеров:**
- BonusTimeControl.vue: 81 строка
- PatternControl.vue: 96 строк
- SectorModeControl.vue: 76 строк
- **Итого:** 253 строки мертвого кода

### 7. Неиспользуемые UI компоненты (4 файла)

```
frontend/src/components/ui/
├── BaseTable.vue                # Не используется нигде
├── CodeEditor.vue               # Не используется нигде
├── LoadingOverlay.vue           # Не используется нигде
└── TimeInput.vue                # Используется только в BonusTimeControl.vue (удаляется)
```

**Причина удаления:**
- **BaseTable.vue, CodeEditor.vue, LoadingOverlay.vue**: не найдено использований в проекте
- **TimeInput.vue**: используется только в `BonusTimeControl.vue` (который удаляется)
- **Grep результат:** импорты из ui/ найдены только в модалках (BaseButton, BaseInput, BaseModal, BaseSelect остаются)

### 8. Неиспользуемые утилиты (2 файла)

```
frontend/src/utils/
├── csv.ts                       # Используется только в старых компонентах
└── visibility.ts                # Используется только в старых компонентах
```

**Причина удаления:**
- **csv.ts**: используется только в `Type100500/index.vue` и `OlympBase.vue` (удаляются)
- **visibility.ts**: используется только в `Type100500/index.vue` и `OlympBase.vue` (удаляются)
- После удаления старых компонентов эти утилиты остаются неиспользуемыми

### 9. Неиспользуемый композабл (1 файл)

```
frontend/src/composables/
└── useConfirmation.ts           # Не используется в v2
```

**Причина удаления:**
- **useConfirmation.ts**: НЕ используется в level-system-v2 (проверено grep)
- Ошибочно указан как используемый в первоначальном анализе
- Может использоваться в старых компонентах, но они удаляются

## ✅ Файлы которые НЕ удаляем (используются в v2)

### Сервисы и утилиты

```
frontend/src/services/
└── uploader.ts                  # ✅ Используется в v2
    ├── fetchBonusLevels()       → level-system-v2/store/bonusLevels.ts
    ├── sendTask()               → level-system-v2/composables/useLevelPayloads.ts
    ├── sendSector()             → level-system-v2/composables/useLevelPayloads.ts
    └── sendBonuses()            → level-system-v2/composables/useLevelPayloads.ts
```

### Store (частично)

```
frontend/src/store/
├── auth.ts                      # ✅ Используется в v2
│   └── useAuthStore()           → LevelHeader.vue, TestUploadPageV2.vue, bonusLevels.ts
├── progress.ts                  # ✅ Используется в v2
│   └── useProgressStore()       → useLevelPayloads.ts, uploader.ts
└── settings.ts                  # ✅ Используется в UploadProgress
    └── useSettingsStore()       → UploadProgress.vue → App.vue
```

### Общие компоненты

```
frontend/src/components/common/
├── modals/                      # ✅ Используются в v2
│   ├── CodesModal.vue           → FunctionalButtons.vue
│   ├── ExportModal.vue          → FunctionalButtons.vue
│   ├── ImportModal.vue          → FunctionalButtons.vue
│   ├── LevelsModal.vue          → BonusLevelsControl.vue
│   └── PreviewModal.vue         → FunctionalButtons.vue
└── notifications/               # ✅ Используются в App.vue
    ├── ConfirmDialog.vue        → App.vue, utils/visibility.ts
    └── ToastNotification.vue    → App.vue
```

### Композаблы (частично)

```
frontend/src/composables/
├── useNotification.ts           # ✅ Используется в v2
│   └── useLevelPayloads.ts
├── useTestUrlMode.ts            # ✅ Используется в v2 и store
│   ├── TestUploadPageV2.vue
│   └── store/index.ts (старый, но еще не удален)
└── useTestConfigV2.ts           # ✅ Используется в v2
    └── TestUploadPageV2.vue
```

### Корневые компоненты

```
frontend/src/components/
└── UploadProgress.vue           # ✅ Используется в App.vue
    ├── Отображение прогресса загрузки
    └── Используется в корневом компоненте
```

## 🔍 Проверка зависимостей

### Импорты из level-system (старой)

```bash
# Результат grep "from.*level-system" (не v2):
frontend/src/components/common/modals/LevelsModal.vue:104
  → import { useLevelV2Store } from '@/components/level-system-v2/store'  ✅ (v2)

frontend/src/composables/useTestConfigV2.ts:3
  → import type { TabData } from '@/components/level-system-v2/types'  ✅ (v2)

frontend/src/components/types/OlympBase.vue:181-182
  → import { getTypeConfig } from '../level-system/registry/types'  ❌ (старый)
  → import type { TypeButtonsConfig } from '../level-system/registry/schema'  ❌ (старый)
```

**Вывод:** Только OlympBase.vue использует старую level-system → можно удалять вместе

### Импорты старых компонентов

```bash
# Результат grep "UploadForm|TestUploadPage":
frontend/src/router/index.ts:5,43
  → import TestUploadPageV2 from '../components/level-system-v2/TestUploadPageV2.vue'  ✅ (v2)
```

**Вывод:** Роутер уже использует v2 версии → старые компоненты можно удалять

### Импорты test-configs

```bash
# test-configs/ (старые):
frontend/src/composables/useTestConfig.ts  → используется только в TestUploadPage.vue

# test-configs-v2/ (новые):
frontend/src/composables/useTestConfigV2.ts  → используется в TestUploadPageV2.vue  ✅
```

**Вывод:** test-configs/ можно удалять вместе с useTestConfig.ts и TestUploadPage.vue

## 📋 Порядок удаления (безопасная последовательность)

### Шаг 1: Удалить старые компоненты типов
```
rm -rf frontend/src/components/types/
rm frontend/src/components/TestUploadPage.vue
rm frontend/src/components/UploadForm.vue
rm frontend/src/components/LevelUploadLayout.vue
```

### Шаг 2: Удалить старую архитектуру level-system
```
rm -rf frontend/src/components/level-system/
```

### Шаг 3: Удалить старые композаблы и конфиги
```
rm frontend/src/composables/useTestConfig.ts
rm -rf frontend/test-configs/
```

### Шаг 4: Удалить старый store
```
rm frontend/src/store/index.ts
```

### Шаг 5: Удалить неиспользуемые контролы и UI компоненты
```
rm -rf frontend/src/components/common/controls/
rm frontend/src/components/ui/BaseTable.vue
rm frontend/src/components/ui/CodeEditor.vue
rm frontend/src/components/ui/LoadingOverlay.vue
rm frontend/src/components/ui/TimeInput.vue
```

### Шаг 6: Удалить неиспользуемые композаблы и утилиты
```
rm frontend/src/composables/useConfirmation.ts
rm frontend/src/utils/csv.ts
rm frontend/src/utils/visibility.ts
```

## ⚠️ Предупреждения

1. **useTestUrlMode.ts** импортирует `isTestUrlMode` из `utils/testMode.ts` - убедиться что testMode.ts не использует старый store
2. **UploadProgress.vue** использует `useSettingsStore` - проверить что он не зависит от удаляемых компонентов
3. **App.vue** использует ToastNotification и ConfirmDialog - убедиться что они не импортируют старые файлы
4. После удаления запустить `npm run lint` и проверить сборку проекта

## 📝 Итоговый список удаления

**Папки (4):**
- `frontend/src/components/level-system/` (8 файлов)
- `frontend/src/components/types/` (3 файла)
- `frontend/test-configs/` (6 файлов)
- `frontend/src/components/common/controls/` (3 файла)

**Отдельные файлы (11):**
- `frontend/src/components/TestUploadPage.vue`
- `frontend/src/components/UploadForm.vue`
- `frontend/src/components/LevelUploadLayout.vue`
- `frontend/src/composables/useTestConfig.ts`
- `frontend/src/store/index.ts`
- `frontend/src/components/ui/BaseTable.vue`
- `frontend/src/components/ui/CodeEditor.vue`
- `frontend/src/components/ui/LoadingOverlay.vue`
- `frontend/src/components/ui/TimeInput.vue`
- `frontend/src/composables/useConfirmation.ts`
- `frontend/src/utils/csv.ts`
- `frontend/src/utils/visibility.ts`

**Всего:** 4 папки (20 файлов) + 11 отдельных файлов = **31 файл** на удаление