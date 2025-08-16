# 📋 План рефакторинга и оптимизации Encounter Uploader

## 🎯 Обзор проекта

**Encounter Uploader** - веб-приложение для загрузки уровней игры Encounter с поддержкой различных типов олимпиек (15, 31, 63, 127 секторов) и специального формата "100500 секторов и бонусов".

### **🚀 Ключевые цели рефакторинга:**
1. **Унификация ВСЕХ типов уровней** - создание общей архитектуры для Олимпиек, Type100500 и будущих 20+ типов
2. **Легкое добавление новых типов** - с 2-3 часов до 5-15 минут
3. **Максимальная гибкость** - поддержка любых комбинаций функционала (миксины олимпиек + Type100500 + кастомные поля)
4. **Переиспользование компонентов** - общие UI элементы и композиции для всех типов

### Тестирование и проверка проекта после выполнения каждого шага рефакторинга:
Так как рефакторинг достаточно большая задача, то необходимо не допустить изменение интерфейса UI (потеря стилей, перестановка блоков, ошибка в верстке и т.д.) при выполнении каждого шага рефакторинга. Для проверки что "ничего не поехало и все работает не хуже, чем до выполнения шага рефакторинга" предлагается тестировать интерфейс. Чтобы не задействовать функции проверки авторизации и ID игры, добавлены тестовый логин и пароль: test/test.
Для каждого шага рефакторинга предлагается делать так:
1. Смотреть как выглядят основные страницы (авторизация, настройка, "Олимпийка 127" и "100500 секторов и бонусов") с использованием playwright до выполнения шага рефакторинга;
2. Выполнение шага рефакторинга;
3. Смотреть как выглядят основные страницы (авторизация, настройка, "Олимпийка 127" и "100500 секторов и бонусов") с использованием playwright после шага рефакторинга, справнивая как выглядели до.

### Документации к модулям, плагинам и прочему
При работе с каким-либо модулем, плагином и т.п. (например, при установке или при использовании новых функций, которые еще не были задействованы) необходимо обращаться к документации этого моделя, плагина или чего-либо еще с помощью context7.

### Текущая архитектура:
- **Frontend**: Vue 3 + TypeScript + Tailwind CSS
- **Server**: Express.js прокси-сервер для Encounter API
- **Legacy Backend**: TypeScript backend (не используется)
- **Инфраструктура**: Docker Compose + Nginx

---

## 🔍 Выявленные проблемы

### 1. **Масштабное дублирование кода** ⚠️
- Компоненты `Olymp15`, `Olymp31`, `Olymp63`, `Olymp127` содержат ~589 строк практически идентичного кода
- Разница только в константах (количество секторов: 15, 31, 63, 127)
- Дублируются функции: `applySectorMode`, `fillOpenSectors`, `onSendTask`, `onSendSector`, `onSendBonus`, `exportDataAs`, `importData`

### 2. **Legacy код**
- `backend/src/index.ts` не используется, но остается в проекте
- Два разных auth store: `store/auth.ts` и `store/index.ts`
- Дублирование функционала авторизации

### 3. **Архитектурные недостатки**
- Отсутствие базовых компонентов и композиций
- Нет единого сервисного слоя для API
- Смешение бизнес-логики и UI в компонентах
- Неоптимальная структура для добавления новых типов уровней

### 4. **Неэффективное управление состоянием**
- Каждый тип хранит данные отдельно в localStorage
- Отсутствие единой модели данных
- Дублирование логики сохранения/загрузки

### 5. **Отсутствие тестирования**
- Нет гарантий сохранения валидности отправляемых данных после рефакторинга
- Риск потери полей или изменения форматов запросов

---

## 📊 Целевые метрики

| Метрика | Текущее | Целевое | Улучшение |
|---------|---------|---------|-----------|
| Строк кода | ~3500 | ~1500 | **-57%** |
| Дублирование | 85% | 5% | **-94%** |
| Время добавления типа | 2-3 часа | 1-15 минут | **-95%** |
| Поддержка типов | 5 | 20+ | **+400%** |
| Покрытие тестами | 0% | 70% | **+70%** |
| Гибкость архитектуры | Низкая | Высокая | ✅ |

---

## 🚀 План рефакторинга (7 фаз)

### **Фаза 0: Подготовка и создание системы валидации** 🛡️
**Срок: 0.5 дня**

#### **0.1 Создание чистых сборщиков payload**

```typescript
// frontend/src/services/upload/builders.ts
export function buildTaskPayload(domain: string, gid: string | number, level: string | number, html: string) {
  return new URLSearchParams({ domain, gid: String(gid), level: String(level), inputTask: html })
}

export function buildSectorPayload(domain: string, gid: string | number, level: string | number, variants: string[], sectorName = '') {
  const params = new URLSearchParams({
    domain,
    gid: String(gid),
    level: String(level),
    txtSectorName: sectorName,
    savesector: ' '
  })
  variants.forEach((v, i) => {
    params.append(`txtAnswer_${i}`, v)
    params.append(`ddlAnswerFor_${i}`, '0')
  })
  return params
}

export function buildBonusPayload(args: BonusPayloadArgs): URLSearchParams {
  // Универсальный сборщик payload для бонусов
  // Поддерживает все существующие и будущие типы уровней
  const p = new URLSearchParams()
  // ... логика сборки параметров в зависимости от типа и capabilities
  return p
}
```

#### **0.2 Snapshot тесты для проверки корректности запросов**

```typescript
// tests/payload.test.ts
import { describe, it, expect } from 'vitest'
import { buildTaskPayload, buildSectorPayload, buildBonusPayload } from '@/services/upload/builders'

describe('Payload Builders', () => {
  it('should build correct task payload', () => {
    const payload = buildTaskPayload('126', 123, 1, '<table>test</table>')
    expect(Object.fromEntries(payload)).toMatchSnapshot()
  })
  
  it('should build correct sector payload with multiple variants', () => {
    const payload = buildSectorPayload('126', 123, 1, ['answer1', 'answer2'], 'Sector Name')
    expect(Object.fromEntries(payload)).toMatchSnapshot()
  })
  
  it('should build correct bonus payload for all types', () => {
    // Тесты для всех типов уровней
    const olympPayload = buildBonusPayload({ type: 'olymp', /* ... */ })
    const type100500Payload = buildBonusPayload({ type: '100500', /* ... */ })
    expect(Object.fromEntries(olympPayload)).toMatchSnapshot()
    expect(Object.fromEntries(type100500Payload)).toMatchSnapshot()
  })
})
```

---

### **Фаза 1: Создание универсальной архитектуры для 20+ типов уровней** 🎯
**Срок: 3-4 дня**

**Критически важная фаза!** С учетом планов на 20+ типов уровней с разными комбинациями функционала (олимпийки + Type100500 + кастомные поля), необходима максимально гибкая архитектура на основе композиций.

#### **1.1 Создание базовой архитектуры**

```
frontend/src/components/
├── shared/                    # 🆕 Общие UI компоненты для всех типов
│   ├── forms/
│   │   ├── AnswerInput.vue          # Поля ввода ответов
│   │   ├── BonusTimeInput.vue       # Время бонуса  
│   │   ├── SectorControls.vue       # Управление секторами
│   │   ├── DelayControls.vue        # Задержка (из Type100500)
│   │   ├── LimitControls.vue        # Ограничения (из Type100500)
│   │   ├── LevelSelector.vue        # Выбор уровней (из Type100500)
│   │   ├── TabsManager.vue          # Управление табами (из Type100500)
│   │   └── ExportImportButtons.vue  # Экспорт/импорт
│   ├── tables/
│   │   ├── BaseTable.vue            # Базовая таблица
│   │   ├── OlympTable.vue           # Олимпийская таблица (специфичная)
│   │   ├── BulkTable.vue            # Таблица Type100500 (специфичная)
│   │   ├── TableRow.vue             # Универсальная строка таблицы
│   │   └── VirtualTable.vue         # Для больших таблиц
│   ├── modals/
│   │   ├── PreviewModal.vue         # Предпросмотр
│   │   ├── ExportModal.vue          # Экспорт данных
│   │   └── LevelsModal.vue          # Модалка выбора уровней (из Type100500)
│   └── layout/
│       ├── LevelHeader.vue          # Заголовок уровня
│       ├── ErrorDisplay.vue         # Отображение ошибок
│       └── ActionButtons.vue        # Кнопки действий
├── level-system/              # 🆕 Система управления типами уровней
│   ├── core/                  # Базовые компоненты и логика
│   │   ├── BaseLevelType.vue        # Абстрактный базовый компонент
│   │   ├── composables/
│   │   │   ├── useLevelLogic.ts     # Общая логика уровней
│   │   │   ├── useOlympLogic.ts     # Переиспользуемая логика олимпиек
│   │   │   ├── useBulkLogic.ts      # Переиспользуемая логика Type100500
│   │   │   ├── useExportImport.ts   # Общий экспорт/импорт
│   │   │   ├── useUpload.ts         # Общая загрузка
│   │   │   └── useValidation.ts     # Общая валидация
│   │   ├── types/
│   │   │   ├── LevelType.ts         # Интерфейсы типов
│   │   │   ├── Capabilities.ts      # Возможности типов
│   │   │   └── UploadData.ts        # Структуры данных
│   │   └── mixins/
│   │       ├── OlympMixin.ts        # 🆕 Миксин функций олимпиек
│   │       ├── BulkMixin.ts         # 🆕 Миксин функций Type100500
│   │       └── CustomMixin.ts       # 🆕 Миксин для кастомных полей
│   ├── registry/              # Регистрация и управление типами
│   │   ├── LevelTypeRegistry.ts     # Реестр типов
│   │   ├── PluginLoader.ts          # Загрузчик плагинов
│   │   └── TypeValidator.ts         # Валидация типов
│   └── templates/             # Шаблоны для новых типов
│       ├── OlympTemplate.vue        # Шаблон олимпийки
│       ├── BulkTemplate.vue         # Шаблон массового типа
│       ├── MixedTemplate.vue        # 🆕 Шаблон смешанного типа
│       └── CustomTemplate.vue       # Шаблон полностью кастомного типа
└── level-types/               # 🆕 Готовые типы уровней (только итоговые компоненты)
    ├── olymp/                 # Семейство олимпиек
    │   ├── Olymp15.vue        # = OlympTemplate + { sectors: 15 }
    │   ├── Olymp31.vue        # = OlympTemplate + { sectors: 31 }
    │   ├── Olymp63.vue        # = OlympTemplate + { sectors: 63 }
    │   └── Olymp127.vue       # = OlympTemplate + { sectors: 127 }
    ├── bulk/                  # Семейство массовых типов
    │   └── Type100500.vue     # = BulkTemplate + настройки
    └── custom/                # Кастомные типы (примеры и будущие)
        ├── LinearLevel.vue    # = MixedTemplate + OlympMixin + кастом
        ├── QuestLevel.vue     # = CustomTemplate + полностью новое
        └── HybridLevel.vue    # = MixedTemplate + OlympMixin + BulkMixin
```

#### **1.2 Система миксинов для переиспользования функционала**

```typescript
// level-system/core/mixins/OlympMixin.ts
export function useOlympMixin() {
  return {
    // Логика олимпиек
    generateOlympLayout: (sectors: number, level: string) => generateOlympLayout(sectors, level),
    applySectorMode: (mode: SectorMode, answers: Answer[], sectors: number) => {
      const strategies = {
        all: () => answers.forEach(a => a.inSector = true),
        initialAndFinal: () => {
          const initial = Math.floor((sectors + 1) / 2)
          answers.forEach(a => a.inSector = a.number <= initial || a.number === sectors)
        },
        finalOnly: () => answers.forEach(a => a.inSector = a.number === sectors),
        custom: () => {}
      }
      strategies[mode]()
    },
    
    // UI компоненты олимпиек
    components: {
      SectorControls: () => import('@/components/shared/forms/SectorControls.vue'),
      OlympTable: () => import('@/components/shared/tables/OlympTable.vue')
    },
    
    // Capabilities олимпиек
    capabilities: [
      { type: 'task', required: true },
      { type: 'sectors', required: true },
      { type: 'bonuses', required: false }
    ]
  }
}

// level-system/core/mixins/BulkMixin.ts  
export function useBulkMixin() {
  return {
    // Логика Type100500
    createTab: () => ({ rows: [], quickTime: {}, sectorPattern: '', bonusPattern: '' }),
    addRow: (tab: Tab) => tab.rows.push(createNewRow()),
    removeRow: (tab: Tab, index: number) => tab.rows.splice(index, 1),
    
    // UI компоненты Type100500
    components: {
      TabsManager: () => import('@/components/shared/forms/TabsManager.vue'),
      DelayControls: () => import('@/components/shared/forms/DelayControls.vue'),
      LimitControls: () => import('@/components/shared/forms/LimitControls.vue'),
      LevelSelector: () => import('@/components/shared/forms/LevelSelector.vue'),
      BulkTable: () => import('@/components/shared/tables/BulkTable.vue')
    },
    
    // Capabilities Type100500
    capabilities: [
      { type: 'sectors', required: false },
      { type: 'bonuses', required: false },
      { type: 'delay', required: false },
      { type: 'limit', required: false },
      { type: 'levels', required: false }
    ]
  }
}

// level-system/core/mixins/CustomMixin.ts
export function useCustomMixin() {
  return {
    // Логика для кастомных полей
    addCustomField: (name: string, type: string, config?: any) => { /* ... */ },
    removeCustomField: (name: string) => { /* ... */ },
    validateCustomField: (name: string, value: any) => { /* ... */ },
    
    // Универсальные компоненты
    components: {
      CustomFieldInput: () => import('@/components/shared/forms/CustomFieldInput.vue'),
      FlexibleTable: () => import('@/components/shared/tables/FlexibleTable.vue')
    }
  }
}
```

#### **1.3 Шаблоны для комбинирования функционала**

```vue
<!-- level-system/templates/MixedTemplate.vue -->
<template>
  <BaseLevelType :level-type="mixedType" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useOlympMixin } from '../core/mixins/OlympMixin'
import { useBulkMixin } from '../core/mixins/BulkMixin'
import { useCustomMixin } from '../core/mixins/CustomMixin'

const props = defineProps<{
  useMixins: ('olymp' | 'bulk' | 'custom')[]
  config: any
}>()

// Динамическое подключение миксинов
const mixins = computed(() => {
  const result: any = {}
  
  if (props.useMixins.includes('olymp')) {
    Object.assign(result, useOlympMixin())
  }
  
  if (props.useMixins.includes('bulk')) {
    Object.assign(result, useBulkMixin())
  }
  
  if (props.useMixins.includes('custom')) {
    Object.assign(result, useCustomMixin())
  }
  
  return result
})

const mixedType = computed(() => ({
  name: props.config.name,
  label: props.config.label,
  category: 'custom',
  capabilities: [
    ...mixins.value.capabilities || [],
    ...props.config.extraCapabilities || []
  ],
  components: mixins.value.components,
  // Объединенная логика из всех миксинов
  ...mixins.value
}))
</script>
```

#### **1.4 Примеры создания гибридных типов**

```vue
<!-- level-types/custom/HybridLevel.vue -->
<template>
  <MixedTemplate 
    :use-mixins="['olymp', 'bulk']"
    :config="hybridConfig"
  />
</template>

<script setup lang="ts">
// Гибридный тип: олимпийка + возможности Type100500
const hybridConfig = {
  name: 'hybrid-olymp',
  label: 'Олимпийка с расширениями',
  extraCapabilities: [
    { type: 'delay', required: false },    // Из Type100500
    { type: 'limit', required: false },    // Из Type100500
    { type: 'levels', required: false }    // Из Type100500
  ],
  sectors: 31,
  allowTabs: false,  // Отключаем табы, оставляем олимпийскую структуру
  enableDelay: true, // Включаем задержки из Type100500
  enableLimits: true // Включаем ограничения из Type100500
}
</script>
```

```vue
<!-- level-types/custom/LinearLevel.vue -->
<template>
  <MixedTemplate 
    :use-mixins="['olymp', 'custom']"
    :config="linearConfig"
  />
</template>

<script setup lang="ts">
// Линейный тип: базовая структура олимпийки + кастомные поля
const linearConfig = {
  name: 'linear-level',
  label: 'Линейный уровень',
  extraCapabilities: [
    { type: 'custom', required: true, config: {
      customFields: [
        'stepOrder',      // Порядок шагов
        'allowSkips',     // Разрешить пропуски
        'stepNames'       // Названия шагов
      ]
    }}
  ],
  customFields: {
    stepOrder: { type: 'number', default: 1 },
    allowSkips: { type: 'boolean', default: false },
    stepNames: { type: 'text', default: '' }
  }
}
</script>
```

#### **1.5 Универсальный интерфейс LevelType**

```typescript
// level-system/core/types/LevelType.ts
export interface LevelTypeDefinition {
  name: string
  label: string
  category: 'olymp' | 'bulk' | 'custom'
  capabilities: LevelCapability[]
  defaultConfig: LevelConfig
  validator: (data: any) => ValidationResult
  uploader: (data: any) => Promise<UploadResult>
}

export interface LevelCapability {
  type: 'task' | 'sectors' | 'bonuses' | 'levels' | 'delay' | 'limit' | 'custom'
  required: boolean
  config?: any
}

// Универсальный интерфейс для всех типов данных с декларативной схемой
import { z } from 'zod'

// Базовая схема для одного ряда данных
export const UniversalAnswerSchema = z.object({
  id: z.union([z.string(), z.number()]),
  variants: z.array(z.string()).min(1, 'Как минимум один вариант ответа обязателен'),
  inSector: z.boolean().default(false),
  inBonus: z.boolean().default(false),
  sectorName: z.string().optional(),
  bonusName: z.string().optional(),
  bonusTime: z.object({
    hours: z.number(),
    minutes: z.number(),
    seconds: z.number(),
    negative: z.boolean().optional()
  }).optional(),
  delay: z.object({
    hours: z.number().optional(),
    minutes: z.number().optional(),
    seconds: z.number().optional()
  }).optional(),
  relativeLimit: z.object({
    hours: z.number().optional(),
    minutes: z.number().optional(),
    seconds: z.number().optional()
  }).optional(),
  targetLevels: z.array(z.string()).optional(),
  allLevels: z.boolean().optional(),
  customFields: z.record(z.any()).optional(), // Для будущих типов
  
  // Поля, не участвующие в отправке, а только для UI
  closedText: z.string().optional(),
  displayText: z.string().optional(),
  bonusTask: z.string().optional(),
  bonusHint: z.string().optional()
});

export type UniversalAnswer = z.infer<typeof UniversalAnswerSchema>;

export interface LevelTypeDefinition {
  name: string
  label: string
  category: 'olymp' | 'bulk' | 'custom'
  capabilities: LevelCapability[]
  defaultConfig: LevelConfig
  validator: (data: any) => ValidationResult
  uploader: (data: any) => Promise<UploadResult>
  schema: z.ZodType; // <-- Декларативная схема данных для этого типа
}

export interface LevelCapability {
  type: 'task' | 'sectors' | 'bonuses' | 'levels' | 'delay' | 'limit' | 'custom'
  required: boolean
  config?: any
}
```

#### **1.3 Базовый компонент для всех типов**

```vue
<!-- level-types/base/BaseLevelType.vue -->
<template>
  <div class="min-h-screen bg-blue-50 py-8">
    <div class="container mx-auto bg-white p-12 rounded-md shadow-sm">
      <!-- Унифицированный заголовок -->
      <LevelHeader 
        :type="levelType.label"
        :author="authStore.username"
        :domain="store.domain"
        :game-id="store.gameId"
        :level-id="store.levelId"
      />
      
      <!-- Ошибки -->
      <ErrorDisplay v-if="error" :error="error" />
      
      <!-- Динамические контролы на основе capabilities -->
      <LevelControls 
        :capabilities="levelType.capabilities"
        :config="config"
        @update:config="updateConfig"
      />
      
      <!-- Основная таблица/интерфейс -->
      <component 
        :is="levelType.tableComponent"
        :data="data"
        :config="config"
        @update:data="updateData"
      />
      
      <!-- Унифицированные кнопки действий -->
      <ActionButtons 
        :capabilities="levelType.capabilities"
        @export="handleExport"
        @import="handleImport"
        @upload-task="handleUploadTask"
        @upload-sectors="handleUploadSectors" 
        @upload-bonuses="handleUploadBonuses"
        @preview="handlePreview"
        @clear="handleClear"
      />
    </div>
    
    <!-- Универсальные модальные окна -->
    <PreviewModal 
      v-if="showPreview"
      :data="data"
      :type="levelType"
      @close="showPreview = false"
    />
    
    <ExportModal
      v-if="showExport"
      :data="data"
      :type="levelType"
      @close="showExport = false"
    />
  </div>
</template>

<script setup lang="ts">
import { useLevelLogic } from './composables/useLevelLogic'
import { useExportImport } from './composables/useExportImport'
import { useUpload } from './composables/useUpload'

const props = defineProps<{
  levelType: LevelTypeDefinition
}>()

const {
  data,
  config,
  error,
  updateData,
  updateConfig,
  handleClear
} = useLevelLogic(props.levelType)

const {
  handleExport,
  handleImport,
  showExport
} = useExportImport(data, props.levelType)

const {
  handleUploadTask,
  handleUploadSectors,
  handleUploadBonuses
} = useUpload(data, props.levelType)
</script>
```

#### **1.4 Специализированные компоненты**

```vue
<!-- level-types/olymp/OlympLevelType.vue -->
<template>
  <BaseLevelType :level-type="olympType" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseLevelType from '../base/BaseLevelType.vue'
import { useOlympDefinition } from './composables/useOlympLogic'

const props = defineProps<{
  sectors: number
}>()

const olympType = computed(() => useOlympDefinition(props.sectors))
</script>
```

```vue
<!-- level-types/bulk/BulkLevelType.vue -->
<template>
  <BaseLevelType :level-type="bulkType" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import BaseLevelType from '../base/BaseLevelType.vue'
import { useBulkDefinition } from './composables/useBulkLogic'

const bulkType = computed(() => useBulkDefinition())
</script>
```

#### **1.5 Простые обертки для существующих типов**

```vue
<!-- level-types/olymp/variants/Olymp15.vue -->
<template>
  <OlympLevelType :sectors="15" />
</template>

<script setup lang="ts">
import OlympLevelType from '../OlympLevelType.vue'
</script>
```

```vue
<!-- level-types/bulk/Type100500.vue -->
<template>
  <BulkLevelType />
</template>

<script setup lang="ts">
import BulkLevelType from './BulkLevelType.vue'
</script>
```

**Проверка после Фазы 1:**
- Запуск валидационных тестов
- Сравнение запросов с эталонными
- Проверка всех критических полей

#### **1.6 Универсальные утилиты форматирования и предпросмотра**

```typescript
// frontend/src/utils/text.ts
export function formatClosedText(text: string): string {
  const trimmed = text.trim()
  if (/^https?:\/\//i.test(trimmed)) {
    return `<a href="${trimmed}" target="_blank"><img src="${trimmed}" style="max-width:150px;max-height:150px"/></a>`
  }
  return text
}
```

```typescript
// level-system/core/composables/usePreview.ts
export function usePreview() {
  // единые правила генерации HTML предпросмотра (closed/open) для всех типов
}
```

---

### **Фаза 2: Централизованное управление состоянием** 📦
**Срок: 0.5 дня**

#### **2.1 Единое хранилище БЕЗ миграции старых данных**

```typescript
// store/unified/StateManager.ts
export class UnifiedStateManager {
  private states = new Map<string, LevelState>()
  
  // Простое сохранение состояния для любого типа
  persist(type: string, state: any) {
    const key = `encounter-uploader:${type}`
    localStorage.setItem(key, JSON.stringify(state))
    this.states.set(type, state)
  }
  
  // Загрузка состояния
  load(type: string): LevelState | null {
    const key = `encounter-uploader:${type}`
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  }
  
  // Очистка старых данных (опционально при первом запуске)
  clearLegacyData() {
    // Удаляем старые ключи из localStorage
    const oldKeys = ['upload-olymp', 'upload-olymp31', 'upload-olymp63', 'upload-olymp127', 'upload-100500']
    oldKeys.forEach(key => localStorage.removeItem(key))
  }
}
```

#### **2.2 Унификация Pinia stores**

```typescript
// store/modules/upload.ts
interface UploadState {
  domain: string
  gameId: string
  levelId: string
  uploadType: string
  currentData: UniversalAnswer[] // Единый формат данных для всех типов
  typeConfig: Record<string, any> // Конфигурация специфичная для типа
}
```

**Проверка после Фазы 2:**
- Валидация сохранения/загрузки данных
- Проверка корректного именования ключей в localStorage
- Очистка старых данных из localStorage

---

### **Фаза 3: Архитектура на основе конфигурации** 🔌
**Срок: 1 день**

#### **3.1 Регистрация 20+ типов через единый конфигурационный файл**
Все типы уровней регистрируются декларативно в одном месте. Добавление нового типа займет 1-5 минут!

```typescript
// level-system/level-types.config.ts
import { z } from 'zod';
import { UniversalAnswerSchema } from './core/types/LevelType';

export const levelTypes = [
  {
    name: 'olymp15',
    label: 'Олимпийка (15 секторов)',
    category: 'olymp',
    component: 'OlympTemplate', // Универсальный компонент-шаблон
    props: { sectors: 15 },    // Props для шаблона
    schema: z.array(UniversalAnswerSchema)
  },
  {
    name: 'olymp31',
    label: 'Олимпийка (31 сектор)',
    category: 'olymp',
    component: 'OlympTemplate',
    props: { sectors: 31 },
    schema: z.array(UniversalAnswerSchema)
  },
  // Новая олимпийка добавляется одной строкой!
  {
    name: 'olymp255',
    label: 'Олимпийка (255 секторов)',
    category: 'olymp',
    component: 'OlympTemplate',
    props: { sectors: 255 },
    schema: z.array(UniversalAnswerSchema)
  },
  {
    name: '100500',
    label: '100500 секторов и бонусов',
    category: 'bulk',
    component: 'BulkTemplate',
    props: { enableTabs: true },
    // Схема для Type100500 может быть расширена
    schema: z.array(UniversalAnswerSchema.extend({
      hintCost: z.number().optional().describe('Стоимость подсказки')
    }))
  }
];
```

#### **3.2 Динамическая загрузка и рендеринг**

`LevelTypeRegistry` будет импортировать этот конфиг. Главный компонент `UploadForm.vue` будет динамически рендерить нужный шаблон (`OlympTemplate`, `BulkTemplate`) и передавать в него `props` из конфигурации.

```typescript
// plugins/LevelTypeRegistry.ts
import { levelTypes } from '@/level-system/level-types.config.ts'

export class LevelTypeRegistry {
  private types = new Map<string, LevelTypeDefinition>()
  
  constructor() {
    this.registerTypesFromConfig();
  }
  
  private registerTypesFromConfig() {
    levelTypes.forEach(config => {
      this.types.set(config.name, {
        ...config,
        // Динамический импорт компонента-шаблона
        component: () => import(`@/level-system/templates/${config.component}.vue`)
      });
    });
  }

  getType(name: string) {
    return this.types.get(name);
  }

  listAllTypes() {
    return Array.from(this.types.values());
  }
}
```

#### **3.3 Пошаговая инструкция добавления нового типа**

**Время: 1-5 минут для похожего типа, 30-60 минут для нового**

1.  **Для похожего типа (новая олимпийка):**
    -   Открыть `level-types.config.ts`.
    -   Скопировать объект существующей олимпийки и изменить `name`, `label` и `props.sectors`.

2.  **Для нового типа (например, "Линейный квест"):**
    -   При необходимости создать новый компонент-шаблон `LinearTemplate.vue` в `level-system/templates/`.
    -   Определить для него схему данных `LinearAnswerSchema` с помощью `Zod`.
    -   Добавить новый объект в `level-types.config.ts`, указав `component: 'LinearTemplate'` и свою `schema`.

3.  **Тип автоматически появится в UI и будет готов к работе.** ✨

**Проверка после Фазы 3:**
- Тестирование новых типов уровней
- Валидация системы на основе конфигурации
- Проверка простоты добавления новых типов (5-минутный тест для олимпийки)

---

### **Фаза 4: Унификация API и удаление legacy кода** 🔌
**Срок: 0.5 дня**

#### **4.1 Удаление legacy backend и дубликатов**
- Удалить папку `backend/` полностью (не используется)
- Удалить дублирующий auth store из `store/index.ts`
- Удалить `frontend/src/services/api.ts` (легаси вызовы)
- Очистить конфигурацию:
  - nginx.conf - убрать маршруты к backend:3000
  - docker-compose.yml - убрать сервис backend
  - Vite proxy - направить все `/api/*` на `http://localhost:3001`

#### **4.2 Централизация API вызовов**

```typescript
// services/api/upload.service.ts
export class UploadService {
  // Единый сервис для всех типов уровней
  async uploadLevel(type: string, data: UniversalAnswer[], config: LevelTypeConfig) {
    const builder = this.getBuilder(type)
    const payloads = builder.build(data, config)
    // Универсальная логика отправки для всех 20+ типов
  }
}
```

**Проверка после Фазы 4:**
- Валидация всех API запросов
- Проверка отсутствия регрессий

---

### **Фаза 5: Оптимизация производительности** ⚡
**Срок: 1-2 дня**

#### **5.1 Code Splitting по типам**

```typescript
// router/index.ts
{
  path: '/upload/:type',
  component: () => import(
    `@/components/types/${route.params.type}/index.vue`
  )
}
```

```typescript
// Альтернатива для Vite: декларативная карта через import.meta.glob
const typeComponents = import.meta.glob('@/components/level-types/**/*.vue')
// ...выбор компонента по имени типа из реестра
```

#### **5.2 Web Workers для тяжелых операций**

```typescript
// workers/olympGenerator.worker.ts
self.addEventListener('message', (e) => {
  const { sectors, level } = e.data
  const layout = generateOlympLayout(sectors, level)
  self.postMessage({ layout })
})
```

#### **5.3 Управление загрузкой: пауза/отмена/продолжение**

```typescript
// useUpload.ts
// Добавить контроллер с сигналами: pause(), resume(), cancel()
// UI: кнопки Пауза/Продолжить/Отмена в окне прогресса
```

**Проверка после Фазы 5:**
- Измерение производительности
- Валидация функциональности после оптимизации

---

### **Фаза 6: Инфраструктура и DevOps** 🏗️
**Срок: 1 день**

#### **6.1 Улучшенная конфигурация**

```yaml
# docker-compose.yml
version: '3.9'
services:
  app:
    build:
      context: .
      target: ${BUILD_TARGET:-production}
    environment:
      - NODE_ENV=${NODE_ENV:-production}
      - SESSION_STORE=${SESSION_STORE:-redis}
      - REDIS_URL=${REDIS_URL:-redis://redis:6379}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3
    
  redis:
    image: redis:alpine
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
```

#### **6.2 Переменные окружения**

```
.env.example
├── API_BASE_URL
├── SESSION_SECRET
├── REDIS_URL
└── LOG_LEVEL
```

#### **6.3 Безопасность сессий и persist**

- Перенести `express-session` на Redis (production)
- Включить `trust proxy`, настроить cookie: `secure` (prod), `sameSite=lax`, разумный `ttl`
- В Pinia исключить пароль из persist (хранить только в памяти вкладки)

**Проверка после Фазы 6:**
- Валидация в production окружении
- Тестирование развертывания

---

### **Фаза 7: Финальная валидация и мониторинг** ✅
**Срок: 1 день**

#### **7.1 Полная проверка после рефакторинга**

```typescript
// tests/final-validation.ts
export async function runFinalValidation() {
  const validator = new RequestValidator()
  const results = {
    passed: [] as string[],
    failed: [] as string[],
    warnings: [] as string[]
  }
  
  // Тестируем все сценарии
  const testCases = [
    // Olymp15
    { type: 'olymp', task: true, sectors: 15, bonuses: 5 },
    // Olymp31
    { type: 'olymp31', task: true, sectors: 31, bonuses: 10 },
    // Type100500 с разными конфигурациями
    { type: '100500', task: false, sectors: 50, bonuses: 30, 
      features: ['multiVariants', 'targetLevels', 'delay', 'relativeLimit'] }
  ]
  
  for (const testCase of testCases) {
    const result = await validator.runScenario(testCase)
    
    if (result.valid) {
      results.passed.push(`${testCase.type}: ✅ Все поля соответствуют эталону`)
    } else {
      results.failed.push(`${testCase.type}: ❌ ${result.errors.join(', ')}`)
    }
  }
  
  // Генерация отчета
  return generateValidationReport(results)
}
```

#### **7.2 Система мониторинга**

```typescript
// monitoring/Analytics.ts
export class UploadAnalytics {
  trackUpload(type: string, metrics: UploadMetrics) {
    // Время выполнения
    // Количество элементов
    // Размер данных
    // Ошибки
  }
  
  generateReport(): AnalyticsReport {
    return {
      avgUploadTime: this.calculateAverage('time'),
      successRate: this.calculateSuccessRate(),
      popularTypes: this.getPopularTypes(),
      errorPatterns: this.analyzeErrors()
    }
  }
}
```

---

## 🔒 Гарантии безопасности рефакторинга

### **Критически важные проверки для каждого типа:**

#### ✅ **Для Task:**
- Наличие `inputTask` с HTML контентом
- Правильные параметры `gid`, `level`, `domain`

#### ✅ **Для Sectors:**
- Парность `txtAnswer_N` и `ddlAnswerFor_N`
- Наличие `savesector` со значением пробел
- Правильная нумерация индексов

#### ✅ **Для Bonuses:**
- Формат `answer_-N` (с отрицательными индексами)
- Временные поля `txtHours/Minutes/Seconds`
- Чекбоксы уровней `level_X=on`
- Радио `rbAllLevels` (0 или 1)
- Условные поля `chkDelay`, `chkRelativeLimit` для Type100500

### **Процедура безопасности:**
1. **Pre-refactoring**: Запись всех текущих запросов как эталонных
2. **During refactoring**: Постоянная валидация против эталонов
3. **Post-refactoring**: Полное регрессионное тестирование
4. **Rollback план**: Возможность отката на любом этапе

---

## 📅 Временной план

| Фаза | Срок | Приоритет |
|------|------|-----------|
| **0. Валидация** | 0.5 дня | 🔴 Критично |
| **1. Универсальная архитектура** | 3-4 дня | 🔴 Критично |
| **2. Управление состоянием** | 0.5 дня | 🟡 Важно |
| **3. Конфигурация типов** | 1 день | 🔴 Критично |
| **4. API унификация** | 0.5 дня | 🟡 Важно |
| **5. Производительность** | 1 день | 🟢 Желательно |
| **6. Инфраструктура** | 0.5 дня | 🟢 Желательно |
| **7. Финальная валидация** | 0.5 дня | 🔴 Критично |

**Общий срок: 7-8 дней**

---

## 🛠️ Рекомендуемые инструменты

### **Библиотеки:**
- **VueUse** - композиции для общих задач
- **Zod** - РЕКОМЕНДУЕТСЯ для валидации схем 20+ типов (декларативное описание структуры данных)
- **Vitest** - unit тестирование (snapshot тесты для payload)
- **Playwright** - проверка UI после каждой фазы рефакторинга

### **Конфигурация разработки:**

```json
// .vscode/settings.json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

---

## 📈 Ожидаемые результаты

### **После завершения рефакторинга:**

#### **Количественные улучшения:**
- ✅ **Сокращение кода на 57%**: с ~3500 до ~1500 строк
- ✅ **Удаление дубликатов на 94%**: 5 файлов → универсальная система
- ✅ **Ускорение добавления новых типов на 95%**: с 2-3 часов до 1-15 минут
- ✅ **Поддержка 20+ типов уровней**: готовая архитектура для любых комбинаций
- ✅ **Покрытие тестами 70%**: snapshot тесты для всех payload
- ✅ **Единая точка конфигурации**: все типы в level-types.config.ts

#### **Качественные улучшения:**

**🎯 Универсальность архитектуры:**
- Type100500 теперь использует ту же базовую архитектуру, что и Олимпийки
- Общие UI компоненты для всех типов (заголовки, кнопки, модальные окна)
- Единая система валидации и загрузки данных
- Переиспользуемые композиции для всех типов

**🚀 Легкость расширения:**
- Добавление Olymp511 займет 5 минут (одна строка кода)
- Добавление совершенно нового типа займет 15-30 минут
- Автоматическое появление в UI селекторе
- Наследование всех базовых возможностей

**🔧 Гибкость:**
- Система capabilities позволяет любые комбинации функций
- Custom fields для уникальных требований новых типов
- Динамическое создание UI на основе возможностей типа
- Независимые валидаторы и загрузчики для каждого типа

**📊 Структура типов после рефакторинга:**
```
Все типы уровней
├── Олимпийки (категория: olymp)
│   ├── BaseLevelType ← OlympLevelType ← Olymp15/31/63/127
│   └── Новые: Olymp255, Olymp511, etc. (5 минут на добавление)
├── Массовые (категория: bulk)  
│   ├── BaseLevelType ← BulkLevelType ← Type100500
│   └── Расширенные: BulkExtended, BulkWithGroups, etc.
└── Кастомные (категория: custom)
    ├── BaseLevelType ← LinearType, QuestType, TreeType
    └── Любые будущие типы (15-30 минут на добавление)
```

### **Главные преимущества:**

1. **🚀 Масштабируемость**: Готовая архитектура для 20+ типов уровней с любыми комбинациями функционала
2. **🎯 Унификация**: ВСЕ типы (Олимпийки, Type100500 и будущие) используют общую архитектуру
3. **⚡ Скорость развития**: Новый тип добавляется за 1-15 минут вместо 2-3 часов
4. **🔧 Максимальная гибкость**: Система композиций позволяет комбинировать любой функционал

---

## 🎯 Заключение

Обновленный план рефакторинга обеспечивает:
1. **Масштабируемость на 20+ типов** - универсальная архитектура с системой композиций
2. **Радикальное ускорение разработки** - новый тип за 1-15 минут вместо часов  
3. **Максимальная гибкость** - любые комбинации функционала (олимпийки + Type100500 + кастом)
4. **Упрощение без потерь** - убраны избыточные части (миграция localStorage, сложная валидация)

**План полностью готов к реализации!** Начинаем с Фазы 0 - создания простых payload builders и snapshot тестов.

---

## 🤔 Ответы на ключевые вопросы

### **1. Может ли новый тип брать функционал из Олимпиек и Type100500?**

**✅ Да, легко!** Система миксинов решает эту проблему:

```vue
<!-- Пример: гибридный тип с функциями олимпиек + Type100500 -->
<template>
  <MixedTemplate 
    :use-mixins="['olymp', 'bulk', 'custom']"
    :config="hybridConfig"
  />
</template>

<script setup lang="ts">
const hybridConfig = {
  name: 'super-hybrid',
  label: 'Супер-гибрид',
  // Берем структуру олимпийки
  sectors: 63,
  // + добавляем задержки и ограничения из Type100500  
  enableDelay: true,
  enableLimits: true,
  // + кастомные поля
  customFields: {
    storyMode: { type: 'boolean', default: false }
  }
}
</script>
```

**Результат:** 
- 🏆 Олимпийская таблица и логика секторов
- 📦 Задержки и ограничения времени из Type100500
- 🎨 Кастомные поля для уникальных потребностей
- **Без дублирования кода!**

### **2. Правильна ли структура папок?**

**Вы абсолютно правы!** Обновленная структура разделяет:

#### **🛠️ Инструменты и компоненты:**
```
components/
├── shared/           # Общие UI компоненты
├── level-system/     # Система управления типами
│   ├── core/         # Базовая логика и миксины
│   ├── registry/     # Регистрация типов
│   └── templates/    # Шаблоны для создания новых типов
```

#### **🎯 Готовые типы уровней:**
```
level-types/          # ТОЛЬКО готовые к использованию типы
├── olymp/           # Олимпийки (15, 31, 63, 127)
├── bulk/            # Type100500 и его вариации
└── custom/          # Кастомные типы пользователя
```

**Преимущества:**
- ✅ **Четкое разделение** "инструментов" и "продуктов"
- ✅ **Легко найти** готовый тип для использования
- ✅ **Легко найти** инструменты для создания нового типа
- ✅ **Нет путаницы** между техническими компонентами и бизнес-логикой

### **3. Как это работает на практике?**

#### **Сценарий 1: Добавление новой олимпийки (5 минут)**
```vue
<!-- level-types/olymp/Olymp255.vue -->
<template>
  <OlympTemplate :sectors="255" />
</template>
```

#### **Сценарий 2: Type100500 с новыми возможностями (10 минут)**
```vue  
<!-- level-types/bulk/Type100500Plus.vue -->
<template>
  <BulkTemplate :config="{ enableGrouping: true, maxGroups: 50 }" />
</template>
```

#### **Сценарий 3: Гибридный тип (20 минут)**
```vue
<!-- level-types/custom/StoryOlymp.vue -->
<template>
  <MixedTemplate 
    :use-mixins="['olymp', 'custom']"
    :config="storyConfig"
  />
</template>

<script setup lang="ts">
const storyConfig = {
  name: 'story-olymp',
  label: 'Сюжетная олимпийка',
  sectors: 31,
  customFields: {
    storyText: { type: 'textarea', label: 'Текст истории' },
    characterName: { type: 'text', label: 'Имя персонажа' },
    plotTwist: { type: 'boolean', label: 'Включить поворот сюжета' }
  }
}
</script>
```

**Результат архитектуры:**
- 🚫 **Нет дублирования** - функции переиспользуются через миксины
- ⚡ **Быстрое создание** - комбинирование готовых блоков  
- 🎯 **Четкая организация** - инструменты отдельно от готовых типов
- 🔧 **Максимальная гибкость** - любые комбинации возможностей
