<template>
  <div class="functional-buttons flex flex-wrap gap-2">
    <!-- Добавить коды - только для типов с ручным добавлением -->
    <Button
      v-if="showAddCodesButton"
      label="Добавить коды"
      icon="pi pi-plus"
      severity="secondary"
      :disabled="isTabLimitExceeded"
      @click="handleAddCodes"
      class="h-10 px-4 text-nowrap max-xs:w-full"
    />
    
    <!-- Очистить -->
    <Button
      label="Очистить"
      icon="pi pi-trash"
      severity="secondary"
      :disabled="isTabEmpty"
      @click="handleClear"
      class="h-10 px-4 text-nowrap max-xs:w-full"
    />
    
    <!-- Экспорт -->
    <Button
      label="Экспорт"
      icon="pi pi-download"
      severity="secondary"
      :disabled="isTabEmpty"
      @click="handleExport"
      class="h-10 px-4 text-nowrap max-xs:w-full"
    />
    
    <!-- Импорт -->
    <Button
      label="Импорт"
      icon="pi pi-upload"
      severity="secondary"
      @click="handleImport"
      class="h-10 px-4 max-xs:w-full"
    />
    
    <!-- Предпросмотр - только для Task -->
    <Button
      v-if="showPreviewButton"
      label="Предпросмотр"
      icon="pi pi-eye"
      severity="secondary"
      :disabled="isTabEmpty"
      @click="handlePreview"
      class="h-10 px-4 max-xs:w-full"
    />
    
    <!-- Модальные окна -->
    <ExportModal
      v-model="exportModalVisible"
      @export="onExport"
    />
    
    <ImportModal
      v-model="importModalVisible"
      @import="onImport"
    />
    
    <PreviewModal
      v-model="previewModalVisible"
      :content="previewContent"
      :alternative-content="previewAlternativeContent"
      :show-mode-toggle="previewSupportsToggle"
      initial-mode="closed"
    />
    
    <CodesModal
      v-model="codesModalVisible"
      @apply="onAddCodes"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Button from 'primevue/button'
import { useLevelStore } from '@/store/levels'
import { getLevelTypeConfig } from '@/entities/level/configs'
import { usePreviewModes } from '@/composables/levels/usePreviewModes'
import ExportModal from '@/components/common/modals/ExportModal.vue'
import ImportModal from '@/components/common/modals/ImportModal.vue'
import PreviewModal from '@/components/common/modals/PreviewModal.vue'
import CodesModal from '@/components/common/modals/CodesModal.vue'
import type { Answer, LevelStoreState, TabData, TimeValue } from '@/entities/level/types'

const store = useLevelStore()

const exportModalVisible = ref(false)
const importModalVisible = ref(false)
const previewModalVisible = ref(false)
const codesModalVisible = ref(false)
const previewContent = ref('')
const previewAlternativeContent = ref('')
const previewSupportsToggle = ref(false)

const EXPORT_VERSION = 1
const MAX_TAB_NAME_LENGTH = 20
const DEFAULT_TAB_PREFIX = 'Блок'
const DEFAULT_TAB_NAME = `${DEFAULT_TAB_PREFIX} 1`
const CSV_HEADERS = [
  'tab',
  'number',
  'variants',
  'sector',
  'bonus',
  'bonusTime',
  'delay',
  'limit',
  'closedText',
  'displayText',
  'bonusLevels',
  'sectorName',
  'bonusName',
  'bonusTask',
  'hint'
] as const

interface LevelExportPayload {
  version: number
  type: string
  subtype?: string | null
  timestamp: string
  exportFormat: 'single-tab' | 'multi-tab'
  meta: {
    domain?: string
    gameId?: string
    levelId?: string
    dimension?: number
  }
  config: LevelStoreState['config']
  tabs: ExportedTab[]
}

interface ExportedTab {
  id: string
  name: string
  answers: Answer[]
}

const levelConfig = computed(() => {
  return getLevelTypeConfig(store.levelType)
})

const showAddCodesButton = computed(() => {
  return levelConfig.value?.manualCodeAddition === true
})

const showPreviewButton = computed(() => {
  return levelConfig.value?.buttons?.functional?.includes('preview') === true
})
const isTabEmpty = computed(() => {
  return !store.activeTab || store.activeTab.answers.length === 0
})

const isTabLimitExceeded = computed(() => {
  if (!store.activeTab) return false
  return store.activeTab.answers.length >= 10000
})

// Обработчики кнопок
const handleAddCodes = (): void => {
  codesModalVisible.value = true
}

const handleClear = (): void => {
  if (globalThis.confirm('Вы действительно хотите очистить все данные активного таба? Это действие нельзя отменить.')) {
    store.clearActiveTab()
  }
}

const handleExport = (): void => {
  exportModalVisible.value = true
}

const handleImport = (): void => {
  importModalVisible.value = true
}

const handlePreview = (): void => {
  // Генерируем предпросмотр через универсальный композабл usePreviewModes
  if (!store.activeTab || !levelConfig.value) {
    globalThis.alert('Нет активного таба или конфигурации типа уровня')
    return
  }

  try {
    // Инициализируем композабл для режимов предпросмотра
    const { generateClosedContent, generateOpenContent, supportsToggle } = usePreviewModes(store, levelConfig.value)

    // Проверяем поддержку предпросмотра
    if (!supportsToggle() && !levelConfig.value.payloads.task) {
      globalThis.alert('Этот тип уровня не поддерживает предпросмотр задания')
      return
    }

    // Генерируем закрытый контент (основной)
    const closedContent = generateClosedContent()
    if (!closedContent) {
      globalThis.alert('Не удалось сгенерировать предпросмотр задания')
      return
    }

    // Устанавливаем основной контент
    previewContent.value = closedContent

    // Генерируем открытый контент (альтернативный) если поддерживается
    if (supportsToggle()) {
      const openContent = generateOpenContent()
      previewAlternativeContent.value = openContent || closedContent
      previewSupportsToggle.value = true
    } else {
      previewSupportsToggle.value = false
    }

    // Показываем модальное окно
    previewModalVisible.value = true

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    globalThis.alert(`Ошибка генерации предпросмотра: ${message}`)
  }
}

// Обработчики событий модальных окон
const onExport = (format: 'json' | 'csv'): void => {
  if (!store.activeTab) return
  
  if (format === 'json') {
    exportJSON()
  } else {
    exportCSV()
  }
}

const onImport = (file: globalThis.File): void => {
  importFile(file)
}

const onAddCodes = (codes: string[]): void => {
  // Проверка дубликатов во всех табах
  const existingCodes = getAllExistingCodes()
  const newCodes = codes.filter(code => !existingCodes.has(code))
  
  if (newCodes.length === 0) {
    globalThis.alert('Все указанные коды уже существуют в табах.')
    return
  }
  
  if (newCodes.length < codes.length) {
    const duplicates = codes.length - newCodes.length
    globalThis.alert(`Обнаружено и пропущено дубликатов: ${duplicates}`)
  }
  
  // Проверка лимита на таб
  const currentCount = store.activeTab?.answers.length || 0
  if (currentCount + newCodes.length > 10000) {
    const maxCanAdd = 10000 - currentCount
    if (maxCanAdd > 0) {
      globalThis.alert(`Превышен лимит 10000 строк на таб. Будет добавлено только ${maxCanAdd} кодов.`)
      store.addCodesToActiveTab(newCodes.slice(0, maxCanAdd))
    } else {
      globalThis.alert('Достигнут лимит 10000 строк на таб. Невозможно добавить новые коды.')
    }
  } else {
    store.addCodesToActiveTab(newCodes)
  }
}

// Утилиты
const getAllExistingCodes = (): Set<string> => {
  const codes = new Set<string>()
  
  store.tabs.forEach((tab: TabData) => {
    tab.answers.forEach((answer: Answer) => {
      answer.variants.forEach((variant: string) => {
        if (variant.trim()) {
          codes.add(variant.trim())
        }
      })
    })
  })
  
  return codes
}


const exportJSON = (): void => {
  if (!store.tabs || store.tabs.length === 0) {
    globalThis.alert('Нет данных для экспорта')
    return
  }

  const exportData: LevelExportPayload = {
    version: EXPORT_VERSION,
    type: String(store.levelType),
    subtype: store.subtypeId ? String(store.subtypeId) : undefined,
    timestamp: new Date().toISOString(),
    exportFormat: store.tabs.length > 1 ? 'multi-tab' : 'single-tab',
    meta: {
      domain: store.domain ? String(store.domain) : undefined,
      gameId: store.gameId ? String(store.gameId) : undefined,
      levelId: store.levelId ? String(store.levelId) : undefined,
      dimension: typeof store.dimension === 'number' ? store.dimension : undefined
    },
    config: cloneConfig(store.config as LevelStoreState['config']),
    tabs: store.tabs.map((tab: TabData, index: number) => serializeTabForExport(tab, index))
  }

  const blob = new globalThis.Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json'
  })

  downloadFile(blob, `${buildExportFilename('json')}`)
}

const exportCSV = (): void => {
  if (!store.tabs || store.tabs.length === 0) {
    globalThis.alert('Нет данных для экспорта')
    return
  }

  const rows: string[] = []
  rows.push(CSV_HEADERS.join(','))

  store.tabs.forEach((tab: TabData, tabIndex: number) => {
    const tabName = sanitizeTabName(tab.name, tabIndex)

    if (!tab.answers || tab.answers.length === 0) {
      rows.push(buildCsvRow(tabName, null))
      return
    }

    tab.answers.forEach((answer: Answer, answerIndex: number) => {
      const sanitizedAnswer = sanitizeAnswer(answer, answerIndex + 1)
      rows.push(buildCsvRow(tabName, sanitizedAnswer))
    })
  })

  const blob = new globalThis.Blob([rows.join('\n')], { type: 'text/csv' })
  downloadFile(blob, `${buildExportFilename('csv')}`)
}

const importFile = async (file: globalThis.File): Promise<void> => {
  try {
    const content = await file.text()
    
    if (file.name.endsWith('.json')) {
      await importJSON(content)
    } else if (file.name.endsWith('.csv')) {
      await importCSV(content) 
    } else {
      throw new Error('Неподдерживаемый формат файла')
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка импорта'
    globalThis.alert(`Ошибка импорта: ${message}`)
  }
}

const importJSON = async (content: string): Promise<void> => {
  const data = JSON.parse(content)

  if (data && typeof data === 'object' && Array.isArray((data as { tabs?: unknown[] }).tabs)) {
    const { tabs, totalAnswers } = buildTabsFromJson((data as { tabs: unknown[] }).tabs)

    const activeIndex = typeof (data as { activeTabIndex?: unknown }).activeTabIndex === 'number'
      ? (data as { activeTabIndex: number }).activeTabIndex
      : 0

    applyImportedTabs(tabs, activeIndex)

    if (data.config && typeof data.config === 'object') {
      store.updateConfig(data.config as Partial<LevelStoreState['config']>)
    }

    if (data.meta && typeof data.meta === 'object') {
      const meta = data.meta as Record<string, unknown>
      if (typeof meta.domain === 'string') store.domain = meta.domain
      if (typeof meta.gameId === 'string') store.gameId = meta.gameId
      if (typeof meta.levelId === 'string') store.levelId = meta.levelId
      if (typeof meta.dimension === 'number' && Number.isFinite(meta.dimension)) {
        store.dimension = meta.dimension
      }
    }

    if (typeof (data as { subtype?: unknown }).subtype === 'string') {
      store.subtypeId = String((data as { subtype: string }).subtype)
    }

    globalThis.alert(`Импортировано ${totalAnswers} записей из ${tabs.length} табов`)
    return
  }

  if (data && typeof data === 'object' && Array.isArray((data as { answers?: unknown[] }).answers)) {
    if (!store.activeTab) return

    const answers = (data as { answers: unknown[] }).answers.map((answer, index) => {
      return sanitizeAnswer(answer as Partial<Answer>, index + 1)
    })

    store.activeTab.answers = answers
    store.markDirty()
    globalThis.alert(`Импортировано ${answers.length} записей в таб "${store.activeTab.name}"`)
    return
  }

  throw new Error('Неверная структура JSON файла')
}

const importCSV = async (content: string): Promise<void> => {
  const rows = parseCsv(content)
  if (rows.length === 0) {
    throw new Error('CSV файл пуст или содержит только заголовки')
  }

  const header = rows.shift()
  if (!header) {
    throw new Error('CSV файл не содержит заголовок')
  }

  const columnIndex = buildColumnIndex(header)
  const tabsMap = new Map<string, { name: string; answers: Answer[] }>()

  rows.forEach(row => {
    if (row.every(cell => cell.trim().length === 0)) {
      return
    }

    const tabNameRaw = getCsvValue(row, columnIndex, 'tab')
    const tabIndex = tabsMap.size
    const tabName = sanitizeTabName(tabNameRaw, tabIndex)

    if (!tabsMap.has(tabName)) {
      tabsMap.set(tabName, { name: tabName, answers: [] })
    }

    const numberToken = getCsvValue(row, columnIndex, 'number').trim()
    if (numberToken.length === 0) {
      return
    }

    const fallbackNumber = tabsMap.get(tabName)!.answers.length + 1
    const rawAnswer: Record<string, unknown> = {
      id: getCsvValue(row, columnIndex, 'id') || undefined,
      number: Number.parseInt(numberToken, 10)
    }

    rawAnswer.variants = splitVariants(getCsvValue(row, columnIndex, 'variants'))
    rawAnswer.sector = parseBoolean(getCsvValue(row, columnIndex, 'sector'), true)
    rawAnswer.bonus = parseBoolean(getCsvValue(row, columnIndex, 'bonus'), true)
    rawAnswer.bonusTime = parseTimeValueLiteral(
      getCsvValue(row, columnIndex, 'bonusTime'),
      getDefaultBonusTime(),
      true
    )
    rawAnswer.delay = parseTimeValueLiteral(getCsvValue(row, columnIndex, 'delay'), getDefaultSimpleTime())
    rawAnswer.limit = parseTimeValueLiteral(getCsvValue(row, columnIndex, 'limit'), getDefaultSimpleTime())
    rawAnswer.closedText = getCsvValue(row, columnIndex, 'closedText')
    rawAnswer.displayText = getCsvValue(row, columnIndex, 'displayText')
    rawAnswer.bonusLevels = splitList(getCsvValue(row, columnIndex, 'bonusLevels'))
    rawAnswer.sectorName = getCsvValue(row, columnIndex, 'sectorName')
    rawAnswer.bonusName = getCsvValue(row, columnIndex, 'bonusName')
    rawAnswer.bonusTask = getCsvValue(row, columnIndex, 'bonusTask')
    rawAnswer.hint = getCsvValue(row, columnIndex, 'hint')

    const sanitizedAnswer = sanitizeAnswer(rawAnswer, fallbackNumber)
    tabsMap.get(tabName)!.answers.push(sanitizedAnswer)
  })

  const tabs: TabData[] = Array.from(tabsMap.values()).map(entry => ({
    id: createTabId(),
    name: entry.name,
    answers: entry.answers.sort((a, b) => a.number - b.number)
  }))

  if (tabs.length === 0) {
    tabs.push({ id: createTabId(), name: DEFAULT_TAB_NAME, answers: [] })
  }

  const totalAnswers = tabs.reduce((sum, tab) => sum + tab.answers.length, 0)

  applyImportedTabs(tabs, 0)
  globalThis.alert(`Импортировано ${totalAnswers} записей из ${tabs.length} табов`)
}

const downloadFile = (blob: globalThis.Blob, filename: string): void => {
  const url = globalThis.URL.createObjectURL(blob)
  const a = globalThis.document.createElement('a')
  a.href = url
  a.download = filename
  globalThis.document.body.appendChild(a)
  a.click()
  globalThis.document.body.removeChild(a)
  globalThis.URL.revokeObjectURL(url)
}

function buildExportFilename(extension: string): string {
  const parts = [store.domain, store.gameId, store.levelId, store.levelType, store.subtypeId]
    .map(part => (part ? String(part) : ''))
    .filter(part => part.length > 0)

  const base = parts.length > 0 ? parts.join('_') : 'level-data'
  return `${base}.${extension}`
}

function serializeTabForExport(tab: TabData, index: number): ExportedTab {
  return {
    id: typeof tab.id === 'string' && tab.id.trim().length > 0 ? tab.id : createTabId(),
    name: sanitizeTabName(tab.name, index),
    answers: tab.answers.map((answer, answerIndex) => sanitizeAnswer(answer, answerIndex + 1))
  }
}

function cloneConfig(config: LevelStoreState['config'] | undefined): LevelStoreState['config'] {
  if (!config) {
    return {} as LevelStoreState['config']
  }

  return JSON.parse(JSON.stringify(config)) as LevelStoreState['config']
}

function sanitizeTabName(name: unknown, index: number): string {
  if (typeof name === 'string' && name.trim().length > 0) {
    return name.trim().slice(0, MAX_TAB_NAME_LENGTH)
  }

  return `${DEFAULT_TAB_PREFIX} ${index + 1}`
}

function sanitizeAnswer(source: Partial<Answer> | Record<string, unknown>, fallbackNumber: number): Answer {
  const defaults = createAnswerDefaults(fallbackNumber)

  const variantsSource = Array.isArray((source as Partial<Answer>).variants)
    ? (source as Partial<Answer>).variants!.map(variant => String(variant ?? ''))
    : []
  const variants = variantsSource.length > 0 ? variantsSource : defaults.variants.slice()

  const bonusLevelsSource = Array.isArray((source as Partial<Answer>).bonusLevels)
    ? (source as Partial<Answer>).bonusLevels!.map(level => String(level ?? ''))
    : undefined
  const bonusLevels = bonusLevelsSource
    ? bonusLevelsSource.filter(level => level.trim().length > 0)
    : defaults.bonusLevels.slice()

  return {
    id: typeof (source as Partial<Answer>).id === 'string' && (source as Partial<Answer>).id!.trim().length > 0
      ? (source as Partial<Answer>).id!
      : defaults.id,
    number: toPositiveInteger((source as Partial<Answer>).number, defaults.number),
    variants,
    sector: typeof (source as Partial<Answer>).sector === 'boolean'
      ? (source as Partial<Answer>).sector!
      : defaults.sector,
    bonus: typeof (source as Partial<Answer>).bonus === 'boolean'
      ? (source as Partial<Answer>).bonus!
      : defaults.bonus,
    bonusTime: sanitizeTimeValue((source as Partial<Answer>).bonusTime as Partial<TimeValue>, defaults.bonusTime, true),
    delay: sanitizeTimeValue((source as Partial<Answer>).delay as Partial<TimeValue>, defaults.delay),
    limit: sanitizeTimeValue((source as Partial<Answer>).limit as Partial<TimeValue>, defaults.limit),
    closedText: sanitizeString((source as Partial<Answer>).closedText, defaults.closedText),
    displayText: sanitizeString((source as Partial<Answer>).displayText, defaults.displayText),
    bonusLevels,
    sectorName: sanitizeString((source as Partial<Answer>).sectorName, defaults.sectorName),
    bonusName: sanitizeString((source as Partial<Answer>).bonusName, defaults.bonusName),
    bonusTask: sanitizeString((source as Partial<Answer>).bonusTask, defaults.bonusTask),
    hint: sanitizeString((source as Partial<Answer>).hint, defaults.hint)
  }
}

function createAnswerDefaults(number: number): Answer {
  return {
    id: createAnswerId(),
    number,
    variants: [''],
    sector: true,
    bonus: true,
    bonusTime: getDefaultBonusTime(),
    closedText: '',
    displayText: '',
    bonusLevels: store.levelId ? [String(store.levelId)] : [],
    delay: getDefaultSimpleTime(),
    limit: getDefaultSimpleTime(),
    sectorName: '',
    bonusName: '',
    bonusTask: '',
    hint: ''
  }
}

function createAnswerId(): string {
  return `answer-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function createTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

function sanitizeTimeValue(
  value: Partial<TimeValue> | undefined,
  fallback: TimeValue,
  allowNegative = false
): TimeValue {
  const safe: TimeValue = {
    hours: toPositiveInteger(value?.hours, fallback.hours),
    minutes: toPositiveInteger(value?.minutes, fallback.minutes),
    seconds: toPositiveInteger(value?.seconds, fallback.seconds)
  }

  if (allowNegative) {
    safe.negative = value?.negative === true
  }

  return safe
}

function parseTimeValueLiteral(
  literal: string,
  fallback: TimeValue,
  allowNegative = false
): TimeValue {
  const trimmed = literal.trim()
  if (trimmed.length === 0) {
    return { ...fallback }
  }

  let negative = false
  let payload = trimmed

  if (allowNegative && payload.startsWith('-')) {
    negative = true
    payload = payload.slice(1)
  }

  if (allowNegative && payload.toLowerCase().endsWith(':negative')) {
    negative = true
    payload = payload.slice(0, -9)
  }

  const parts = payload.split(':').map(part => part.trim()).filter(part => part.length > 0)
  if (parts.length < 3) {
    const base = { ...fallback }
    if (allowNegative) {
      base.negative = negative
    }
    return base
  }

  const [hoursRaw, minutesRaw, secondsRaw] = parts
  const result: TimeValue = {
    hours: toPositiveInteger(hoursRaw, fallback.hours),
    minutes: toPositiveInteger(minutesRaw, fallback.minutes),
    seconds: toPositiveInteger(secondsRaw, fallback.seconds)
  }

  if (allowNegative) {
    result.negative = negative
  }

  return result
}

function formatTimeValue(value: TimeValue | undefined, allowNegative = false): string {
  const fallback = allowNegative ? getDefaultBonusTime() : getDefaultSimpleTime()
  const safe = sanitizeTimeValue(value, fallback, allowNegative)
  const prefix = allowNegative && safe.negative ? '-' : ''
  return `${prefix}${padTimeUnit(safe.hours)}:${padTimeUnit(safe.minutes)}:${padTimeUnit(safe.seconds)}`
}

function padTimeUnit(value: number): string {
  return value.toString().padStart(2, '0')
}

function buildCsvRow(tabName: string, answer: Answer | null): string {
  const values = CSV_HEADERS.map(column => {
    if (column === 'tab') {
      return tabName
    }

    if (!answer) {
      return ''
    }

    switch (column) {
      case 'number':
        return String(answer.number ?? '')
      case 'variants':
        return joinList(answer.variants, { trim: false, preserveEmpty: true })
      case 'sector':
        return String(answer.sector === true)
      case 'bonus':
        return String(answer.bonus === true)
      case 'bonusTime':
        return formatTimeValue(answer.bonusTime, true)
      case 'delay':
        return formatTimeValue(answer.delay)
      case 'limit':
        return formatTimeValue(answer.limit)
      case 'closedText':
        return answer.closedText ?? ''
      case 'displayText':
        return answer.displayText ?? ''
      case 'bonusLevels':
        return joinList(answer.bonusLevels ?? [])
      case 'sectorName':
        return answer.sectorName ?? ''
      case 'bonusName':
        return answer.bonusName ?? ''
      case 'bonusTask':
        return answer.bonusTask ?? ''
      case 'hint':
        return answer.hint ?? ''
      default:
        return ''
    }
  })

  return values.map(value => escapeCsv(value)).join(',')
}

function escapeCsv(value: string): string {
  const needsQuotes = /[",\n\r]/.test(value)
  const sanitized = value.replace(/"/g, '""')
  return needsQuotes ? `"${sanitized}"` : sanitized
}

function joinList(
  values: unknown[],
  options: { trim?: boolean; preserveEmpty?: boolean } = {}
): string {
  if (!Array.isArray(values)) {
    return ''
  }

  const { trim = true, preserveEmpty = false } = options

  return values
    .map(value => {
      const stringValue = String(value ?? '')
      return trim ? stringValue.trim() : stringValue
    })
    .filter(value => (preserveEmpty ? true : value.length > 0))
    .join(';')
}

function splitVariants(value: string): string[] {
  if (value.length === 0) {
    return []
  }

  return value.split(';').map(item => item)
}

function splitList(value: string): string[] {
  if (value.length === 0) {
    return []
  }

  return value
    .split(';')
    .map(item => item.trim())
    .filter(item => item.length > 0)
}

function parseBoolean(value: string, fallback: boolean): boolean {
  const normalized = value.trim().toLowerCase()
  if (normalized.length === 0) {
    return fallback
  }

  if (['1', 'true', 'yes', 'да'].includes(normalized)) {
    return true
  }

  if (['0', 'false', 'no', 'нет'].includes(normalized)) {
    return false
  }

  return fallback
}

function getCsvValue(row: string[], indexMap: Map<string, number>, column: string): string {
  const index = indexMap.get(column.toLowerCase())
  if (index === undefined) {
    return ''
  }

  return row[index] ?? ''
}

function buildColumnIndex(header: string[]): Map<string, number> {
  const map = new Map<string, number>()

  header.forEach((rawName, index) => {
    const name = rawName.trim()
    if (name.length === 0) {
      return
    }

    const key = name.toLowerCase()
    if (!map.has(key)) {
      map.set(key, index)
    }
  })

  return map
}

function parseCsv(content: string): string[][] {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentValue = ''
  let insideQuotes = false

  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i]

    if (char === '"') {
      if (insideQuotes && normalized[i + 1] === '"') {
        currentValue += '"'
        i += 1
      } else {
        insideQuotes = !insideQuotes
      }
      continue
    }

    if (char === ',' && !insideQuotes) {
      currentRow.push(currentValue)
      currentValue = ''
      continue
    }

    if (char === '\n' && !insideQuotes) {
      currentRow.push(currentValue)
      rows.push(currentRow)
      currentRow = []
      currentValue = ''
      continue
    }

    currentValue += char
  }

  if (insideQuotes) {
    throw new Error('Некорректный CSV: незакрытые кавычки')
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue)
    rows.push(currentRow)
  }

  return rows.filter(row => row.length > 0)
}

function getDefaultBonusTime(): TimeValue {
  return { hours: 0, minutes: 0, seconds: 0, negative: false }
}

function getDefaultSimpleTime(): TimeValue {
  return { hours: 0, minutes: 0, seconds: 0 }
}

function applyImportedTabs(tabs: TabData[], activeIndex: number): void {
  if (tabs.length === 0) {
    tabs.push({ id: createTabId(), name: DEFAULT_TAB_NAME, answers: [] })
  }

  const safeIndex = Math.min(Math.max(Math.trunc(activeIndex), 0), tabs.length - 1)

  store.tabs = tabs
  store.activeTabIndex = safeIndex
  store.markDirty()
}

function buildTabsFromJson(rawTabs: unknown[]): { tabs: TabData[]; totalAnswers: number } {
  const tabs: TabData[] = []
  let totalAnswers = 0

  rawTabs.forEach((rawTab, index) => {
    const tabLike = rawTab as { id?: unknown; name?: unknown; answers?: unknown[] }
    const answersInput = Array.isArray(tabLike.answers) ? tabLike.answers : []
    const answers = answersInput.map((answer, answerIndex) => sanitizeAnswer(answer as Partial<Answer>, answerIndex + 1))
    answers.sort((a, b) => a.number - b.number)
    totalAnswers += answers.length

    tabs.push({
      id: typeof tabLike.id === 'string' && tabLike.id.trim().length > 0 ? tabLike.id : createTabId(),
      name: sanitizeTabName(tabLike.name, index),
      answers
    })
  })

  if (tabs.length === 0) {
    tabs.push({ id: createTabId(), name: DEFAULT_TAB_NAME, answers: [] })
  }

  return { tabs, totalAnswers }
}

function toPositiveInteger(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value))
  }

  const parsed = Number.parseInt(String(value), 10)
  if (Number.isFinite(parsed)) {
    return Math.max(0, parsed)
  }

  return fallback
}

function sanitizeString(value: unknown, fallback: string): string {
  if (typeof value === 'string') {
    return value
  }

  if (value === null || value === undefined) {
    return fallback
  }

  return String(value)
}
</script>
