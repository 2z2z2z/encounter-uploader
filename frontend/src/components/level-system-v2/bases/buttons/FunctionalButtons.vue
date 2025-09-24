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
import { useLevelV2Store } from '../../store'
import { getLevelTypeConfig } from '../../configs'
import { usePreviewModes } from '../../composables/usePreviewModes'
import ExportModal from '@/components/common/modals/ExportModal.vue'
import ImportModal from '@/components/common/modals/ImportModal.vue'
import PreviewModal from '@/components/common/modals/PreviewModal.vue'
import CodesModal from '@/components/common/modals/CodesModal.vue'
import type { Answer } from '../../types'

const store = useLevelV2Store()

const exportModalVisible = ref(false)
const importModalVisible = ref(false)
const previewModalVisible = ref(false)
const codesModalVisible = ref(false)
const previewContent = ref('')
const previewAlternativeContent = ref('')
const previewSupportsToggle = ref(false)

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
  
  store.tabs.forEach(tab => {
    tab.answers.forEach(answer => {
      answer.variants.forEach(variant => {
        if (variant.trim()) {
          codes.add(variant.trim())
        }
      })
    })
  })
  
  return codes
}


const exportJSON = (): void => {
  if (!store.activeTab) return

  const data = {
    version: 1,
    type: store.levelType,
    timestamp: new Date().toISOString(),
    tab: store.activeTab.name,
    answers: store.activeTab.answers
  }

  const blob = new globalThis.Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  })

  const filename = [store.domain, store.gameId, store.levelId, store.levelType, store.subtypeId]
    .filter(Boolean)
    .join('_')
  downloadFile(blob, `${filename}.json`)
}

const exportCSV = (): void => {
  if (!store.activeTab) return

  let csv = 'tab,number,variants,sector,bonus,bonusTime,closedText,displayText\n'

  store.activeTab.answers.forEach(answer => {
    csv += [
      store.activeTab!.name,
      answer.number,
      answer.variants.join(';'),
      answer.sector,
      answer.bonus,
      `${answer.bonusTime.hours}:${answer.bonusTime.minutes}:${answer.bonusTime.seconds}${answer.bonusTime.negative ? ':negative' : ''}`,
      answer.closedText || '',
      answer.displayText || ''
    ].join(',') + '\n'
  })

  const blob = new globalThis.Blob([csv], { type: 'text/csv' })
  const filename = [store.domain, store.gameId, store.levelId, store.levelType, store.subtypeId]
    .filter(Boolean)
    .join('_')
  downloadFile(blob, `${filename}.csv`)
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
  
  if (data.answers && Array.isArray(data.answers)) {
    if (!store.activeTab) return
    
    // Простая замена данных активного таба
    store.activeTab.answers = data.answers
    globalThis.alert(`Импортировано ${data.answers.length} записей`)
  } else {
    throw new Error('Неверная структура JSON файла')
  }
}

const importCSV = async (content: string): Promise<void> => {
  const lines = content.trim().split('\n')
  if (lines.length < 2) {
    throw new Error('CSV файл пуст или содержит только заголовки')
  }
  
  // Пропускаем заголовок
  const dataLines = lines.slice(1)
  const answers: Answer[] = []
  
  dataLines.forEach((line, index) => {
    const cols = line.split(',')
    if (cols.length >= 3) {
      const variants = cols[2] ? cols[2].split(';') : ['']
      const bonusTimeParts = cols[5] ? cols[5].split(':') : ['0', '0', '0']
      
      answers.push({
        id: `answer-${Date.now()}-${Math.random().toString(36).slice(2, 11)}-${index}`,
        number: parseInt(cols[1]) || (index + 1),
        variants,
        sector: cols[3] === 'true',
        bonus: cols[4] === 'true',
        bonusTime: {
          hours: parseInt(bonusTimeParts[0]) || 0,
          minutes: parseInt(bonusTimeParts[1]) || 0,
          seconds: parseInt(bonusTimeParts[2]) || 0,
          negative: bonusTimeParts[3] === 'negative'
        },
        closedText: cols[6] || '',
        displayText: cols[7] || ''
      })
    }
  })
  
  if (!store.activeTab) return
  
  store.activeTab.answers = answers
  globalThis.alert(`Импортировано ${answers.length} записей`)
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
</script>
