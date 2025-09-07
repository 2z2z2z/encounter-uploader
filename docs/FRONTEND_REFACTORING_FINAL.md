# Финальный план рефакторинга фронтенда Encounter Uploader

## 📋 Цели рефакторинга
- Упростить и систематизировать кодовую базу для повышения читаемости
- Облегчить поддержку и расширение функционала
- Подготовить архитектуру для добавления 20+ новых типов уровней
- Унифицировать UI и улучшить пользовательский опыт

## 🏗️ Архитектурные принципы
1. **Реестр-ориентированная архитектура** - все конфигурации типов через единый реестр
2. **Композиция вместо наследования** - использование composables и мелких компонентов
3. **Строгая типизация** - TypeScript везде, никаких `any`
4. **Разделение ответственности** - четкое разделение логики, представления и данных

## 📊 Фазы реализации

### Фаза 1: UI-библиотека и базовые компоненты [ПРИОРИТЕТ: ВЫСОКИЙ]
**Цель:** Создать единообразный UI фундамент для всего приложения

#### 1.1 Внедрение PrimeVue
```bash
npm install primevue@latest primeicons
npm install @primevue/themes
```

**Обоснование выбора PrimeVue:**
- Современная Vue 3 библиотека с отличной поддержкой TypeScript
- 90+ готовых компонентов высокого качества
- Встроенная поддержка тем и адаптивности
- Отличная документация и активное сообщество

#### 1.2 Создание атомарных UI компонентов
```
frontend/src/components/ui/
├── BaseButton.vue        # Обертка над PrimeVue Button
├── BaseInput.vue         # Унифицированный input
├── BaseSelect.vue        # Унифицированный select
├── BaseModal.vue         # Базовое модальное окно
├── BaseTable.vue         # Базовая таблица с сортировкой
├── TimeInput.vue         # Компонент ввода времени (ч:м:с)
├── CodeEditor.vue        # Редактор HTML/JS кода
└── LoadingOverlay.vue    # Индикатор загрузки
```

#### 1.3 Создание специализированных компонентов
```
frontend/src/components/common/
├── modals/
│   ├── PreviewModal.vue     # Предпросмотр HTML контента
│   ├── ExportModal.vue       # Выбор формата экспорта
│   ├── ImportModal.vue       # Импорт с валидацией
│   ├── CodesModal.vue        # Добавление/генерация кодов
│   └── LevelsModal.vue       # Выбор уровней для бонусов
├── controls/
│   ├── BonusTimeControl.vue # Контрол бонусного времени
│   ├── DelayControl.vue      # Контрол задержки
│   ├── PatternControl.vue    # Контрол паттернов (& замены)
│   └── SectorModeControl.vue # Выбор режима секторов
└── notifications/
    ├── ToastNotification.vue # Toast уведомления
    └── ConfirmDialog.vue     # Диалог подтверждения
```

### Фаза 2: Рефакторинг системы хранения данных [ПРИОРИТЕТ: ВЫСОКИЙ]
**Цель:** Создать масштабируемую систему управления состоянием

#### 2.1 Разделение stores
```typescript
// frontend/src/stores/settings.ts
export const useSettingsStore = defineStore('settings', () => {
  // Глобальные настройки сессии
  const domain = ref('')
  const gameId = ref('')
  const levelId = ref('')
  const currentType = ref<string>('olymp15')
  
  // Методы работы с настройками
  function updateSettings(data: SettingsData) { /* ... */ }
  function validateSettings(): ValidationResult { /* ... */ }
  
  return { domain, gameId, levelId, currentType, updateSettings, validateSettings }
})

// frontend/src/stores/levelData.ts
export const useLevelDataStore = defineStore('levelData', () => {
  // Данные текущего редактируемого уровня
  const tabs = ref<TabData[]>([])
  const activeTabIndex = ref(0)
  const isDirty = ref(false)
  
  // Универсальные методы для работы с данными
  function loadTypeData(typeId: string) { /* ... */ }
  function saveTypeData() { /* ... */ }
  function addTab() { /* ... */ }
  function removeTab(index: number) { /* ... */ }
  function updateField(tabIndex: number, rowIndex: number, fieldId: string, value: any) { /* ... */ }
  
  return { tabs, activeTabIndex, isDirty, loadTypeData, saveTypeData, addTab, removeTab, updateField }
})

// frontend/src/stores/upload.ts
export const useUploadStore = defineStore('upload', () => {
  // Состояние процесса загрузки
  const isUploading = ref(false)
  const uploadQueue = ref<UploadTask[]>([])
  const uploadProgress = ref<UploadProgress>({})
  const uploadErrors = ref<UploadError[]>([])
  
  // Методы управления загрузкой
  function addToQueue(task: UploadTask) { /* ... */ }
  function processQueue() { /* ... */ }
  function retryFailed() { /* ... */ }
  
  return { isUploading, uploadQueue, uploadProgress, uploadErrors, addToQueue, processQueue, retryFailed }
})
```

#### 2.2 Структура данных для tabs
```typescript
interface TabData {
  id: string
  label: string
  rows: RowData[]
  controls: ControlValues
  metadata: TabMetadata
}

interface RowData {
  id: string
  fields: Record<FieldId, any>
}

interface ControlValues {
  [controlId: string]: any
}
```

### Фаза 3: Расширение системы реестров [ПРИОРИТЕТ: ВЫСОКИЙ]
**Цель:** Сделать реестр центральным элементом архитектуры

#### 3.1 Улучшение схемы реестра
```typescript
// frontend/src/components/level-system/registry/schema.ts
export interface FieldDefinition {
  id: FieldId
  label: string
  type: FieldType
  scope: 'row' | 'tab' | 'global'
  validation?: ValidationRule[]
  defaultValue?: any
  renderer?: 'input' | 'textarea' | 'select' | 'checkbox' | 'time' | 'code-editor'
  placeholder?: string
  help?: string
}

export interface ControlDefinition {
  id: ControlId
  label: string
  type: 'text' | 'pattern' | 'time' | 'select' | 'modal'
  targets: FieldId[]
  applyStrategy: 'replace' | 'pattern' | 'append' | 'custom'
  customApply?: (value: any, currentFieldValue: any) => any
}

export interface TypeConfig {
  id: string
  name: string
  category: string
  tabs: {
    enabled: boolean
    maxTabs?: number
    defaultTabName?: string
  }
  fields: {
    [fieldId: string]: {
      enabled: boolean
      required?: boolean
      columnWidth?: string
      customLabel?: string
    }
  }
  controls: ControlId[]
  buttons: TypeButtonsConfig
  preview?: {
    enabled: boolean
    wrapper?: string  // HTML обертка для предпросмотра
  }
  validation?: {
    minRows?: number
    maxRows?: number
    customRules?: ValidationRule[]
  }
}
```

#### 3.2 Фабрика компонентов на основе реестра
```typescript
// frontend/src/components/level-system/factory/index.ts
export class ComponentFactory {
  static createField(fieldDef: FieldDefinition): Component {
    // Возвращает соответствующий компонент для поля
  }
  
  static createControl(controlDef: ControlDefinition): Component {
    // Возвращает соответствующий контрол
  }
  
  static createTable(typeConfig: TypeConfig): Component {
    // Генерирует таблицу на основе конфига типа
  }
}
```

### Фаза 4: Создание универсальных компонентов [ПРИОРИТЕТ: СРЕДНИЙ]
**Цель:** Унифицировать компоненты для всех типов уровней

#### 4.1 Универсальный компонент уровня
```vue
<!-- frontend/src/components/UniversalLevel.vue -->
<template>
  <LevelLayout :config="config">
    <template #controls>
      <DynamicControls :controls="config.controls" @update="handleControlUpdate" />
    </template>
    
    <template #tabs v-if="config.tabs.enabled">
      <TabView v-model:activeIndex="activeTab">
        <TabPanel v-for="tab in tabs" :key="tab.id" :header="tab.label">
          <DynamicTable 
            :fields="config.fields" 
            :rows="tab.rows"
            @update="handleFieldUpdate"
          />
        </TabPanel>
      </TabView>
    </template>
    
    <template #table v-else>
      <DynamicTable 
        :fields="config.fields" 
        :rows="tabs[0].rows"
        @update="handleFieldUpdate"
      />
    </template>
    
    <template #actions>
      <DynamicActions :buttons="config.buttons" @action="handleAction" />
    </template>
  </LevelLayout>
</template>
```

#### 4.2 Динамическая таблица
```vue
<!-- frontend/src/components/DynamicTable.vue -->
<template>
  <DataTable 
    :value="rows" 
    :paginator="rows.length > 10"
    :rows="10"
    editMode="cell"
    @cell-edit-complete="onCellEditComplete"
  >
    <Column 
      v-for="field in enabledFields" 
      :key="field.id"
      :field="`fields.${field.id}`"
      :header="field.label"
      :style="`width: ${field.columnWidth || 'auto'}`"
    >
      <template #editor="{ data, field: fieldPath }">
        <component 
          :is="getFieldComponent(field)"
          v-model="data.fields[field.id]"
          :field="field"
        />
      </template>
    </Column>
  </DataTable>
</template>
```

### Фаза 5: Composables и утилиты [ПРИОРИТЕТ: СРЕДНИЙ]
**Цель:** Вынести переиспользуемую логику

#### 5.1 Создание composables
```typescript
// frontend/src/composables/useImportExport.ts
export function useImportExport() {
  const { tabs } = storeToRefs(useLevelDataStore())
  
  async function exportData(format: 'json' | 'csv') { /* ... */ }
  async function importData(file: File) { /* ... */ }
  function validateImportedData(data: any): ValidationResult { /* ... */ }
  
  return { exportData, importData, validateImportedData }
}

// frontend/src/composables/useFieldValidation.ts
export function useFieldValidation() {
  function validateField(value: any, rules: ValidationRule[]): ValidationResult { /* ... */ }
  function validateRow(row: RowData, config: TypeConfig): ValidationResult { /* ... */ }
  function validateAllData(): ValidationResult { /* ... */ }
  
  return { validateField, validateRow, validateAllData }
}

// frontend/src/composables/useUploadActions.ts  
export function useUploadActions() {
  const uploadStore = useUploadStore()
  
  async function uploadTask(html: string) { /* ... */ }
  async function uploadSectors(rows: RowData[], combine?: boolean) { /* ... */ }
  async function uploadBonuses(rows: RowData[]) { /* ... */ }
  
  return { uploadTask, uploadSectors, uploadBonuses }
}
```

#### 5.2 Утилиты
```typescript
// frontend/src/utils/domParser.ts
export class DomParser {
  static extractLevelsFromForm(html: string): LevelInfo[] { /* ... */ }
  static parseEnResponse(html: string): ParsedResponse { /* ... */ }
}

// frontend/src/utils/patternProcessor.ts
export class PatternProcessor {
  static applyPattern(pattern: string, index: number): string {
    // Замена & на индекс и другие паттерны
  }
}
```

### Фаза 6: Валидация и обработка ошибок [ПРИОРИТЕТ: СРЕДНИЙ]
**Цель:** Повысить надежность и UX

#### 6.1 Система валидации
```typescript
// frontend/src/services/validation.ts
export class ValidationService {
  private rules: Map<string, ValidationRule[]> = new Map()
  
  registerRule(fieldId: string, rule: ValidationRule) { /* ... */ }
  validate(data: any, typeConfig: TypeConfig): ValidationResult { /* ... */ }
  validateBeforeUpload(data: any): Promise<ValidationResult> { /* ... */ }
}
```

#### 6.2 Глобальная обработка ошибок
```typescript
// frontend/src/plugins/errorHandler.ts
export default {
  install(app: App) {
    app.config.errorHandler = (error, instance, info) => {
      // Логирование и отображение ошибок
      useNotificationStore().showError(error)
    }
    
    // Перехват ошибок axios
    axios.interceptors.response.use(
      response => response,
      error => {
        // Обработка и отображение ошибок API
        return Promise.reject(error)
      }
    )
  }
}
```

### Фаза 7: Улучшение UX [ПРИОРИТЕТ: НИЗКИЙ]
**Цель:** Сделать приложение более удобным

#### 7.1 Индикаторы загрузки
- Skeleton screens при загрузке данных
- Progress bars для batch операций
- Спиннеры для кнопок во время выполнения

#### 7.2 Интерактивность
- Автосохранение черновиков каждые 30 секунд
- Undo/Redo для последних 10 действий
- Keyboard shortcuts для частых операций
- Drag & drop для переупорядочивания строк

#### 7.3 Уведомления
- Toast сообщения для успешных операций
- Подтверждения для критичных действий
- Inline валидация с подсказками

### Фаза 8: Тестирование [ПРИОРИТЕТ: НИЗКИЙ]
**Цель:** Обеспечить стабильность

#### 8.1 Unit тесты (Vitest)
```typescript
// frontend/src/components/__tests__/DynamicTable.spec.ts
describe('DynamicTable', () => {
  it('should render fields based on config', () => { /* ... */ })
  it('should emit update event on cell edit', () => { /* ... */ })
})
```

#### 8.2 E2E тесты (Playwright)
```typescript
// tests/e2e/level-upload.spec.ts
test('should upload olymp level successfully', async ({ page }) => {
  // Полный сценарий загрузки уровня
})
```

### Фаза 9: Документация [ПРИОРИТЕТ: НИЗКИЙ]
**Цель:** Облегчить поддержку и расширение

#### 9.1 Техническая документация
- JSDoc для всех публичных методов
- README с архитектурой проекта
- Гайд по добавлению новых типов уровней

#### 9.2 Storybook
- Компоненты UI библиотеки
- Примеры использования
- Интерактивная документация

## 🚀 Порядок реализации

1. **Неделя 1-2:** Фаза 1 (UI-библиотека и базовые компоненты)
2. **Неделя 3-4:** Фаза 2 (Рефакторинг stores)
3. **Неделя 5-6:** Фаза 3 (Расширение реестров)
4. **Неделя 7-8:** Фаза 4 (Универсальные компоненты)
5. **Неделя 9:** Фаза 5 (Composables)
6. **Неделя 10:** Фаза 6 (Валидация и ошибки)
7. **Неделя 11:** Фаза 7 (UX улучшения)
8. **Неделя 12:** Фаза 8-9 (Тесты и документация)

## 📦 Новые зависимости
```json
{
  "dependencies": {
    "primevue": "^4.2.0",
    "@primevue/themes": "^4.2.0",
    "primeicons": "^7.0.0",
    "@vueuse/core": "^11.0.0",
    "vee-validate": "^4.13.0",
    "@codemirror/lang-html": "^6.4.0",
    "@codemirror/lang-javascript": "^6.2.0",
    "vue-codemirror": "^6.1.0"
  },
  "devDependencies": {
    "@vitest/ui": "^2.0.0",
    "vitest": "^2.0.0",
    "@vue/test-utils": "^2.4.0",
    "@storybook/vue3-vite": "^8.0.0"
  }
}
```

## ✅ Критерии успеха
- Код легко читается и понимается новыми разработчиками
- Добавление нового типа уровня занимает < 2 часов
- Все компоненты переиспользуемые и тестируемые
- Нет дублирования кода
- 100% TypeScript покрытие без `any`
- Загрузка 1000+ элементов работает без зависаний
- E2E тесты проходят для всех основных сценариев

## 🎯 Результат
После рефакторинга получим:
- **Масштабируемую архитектуру** готовую для 20+ типов уровней
- **Единообразный UI** на основе PrimeVue
- **Надежную систему** с валидацией и обработкой ошибок
- **Простоту расширения** через конфигурации в реестре
- **Качественный код** с тестами и документацией
