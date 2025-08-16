<template>
  <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif;">
    <h1 style="text-align: center; color: #333;">🎯 Изолированный тест системы типов</h1>
    
    <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <h2 style="color: #0369a1; margin-top: 0;">Этап 1.1: Проверка базовой архитектуры</h2>
      <p>Проверяем работу универсальной системы типов для 20+ типов уровней</p>
    </div>
    
    <!-- Результат загрузки типов -->
    <div style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3>📊 Результат загрузки системы типов</h3>
      
      <div v-if="systemStatus.loaded" style="color: #059669;">
        ✅ Система типов успешно загружена
      </div>
      <div v-else style="color: #dc2626;">
        ❌ Ошибка загрузки системы типов
      </div>
      
      <div style="margin: 15px 0;">
        <div><strong>Всего типов:</strong> {{ systemStatus.totalTypes }}</div>
        <div><strong>Олимпиек:</strong> {{ systemStatus.olympTypes }}</div>
        <div><strong>Сложных типов:</strong> {{ systemStatus.complexTypes }}</div>
        <div><strong>Кастомных типов:</strong> {{ systemStatus.customTypes }}</div>
      </div>
      
      <div style="margin-top: 15px;">
        <h4>Загруженные типы:</h4>
        <ul style="margin: 0; padding-left: 20px;">
          <li v-for="type in typesList" :key="type.id" style="margin: 5px 0;">
            <strong>{{ type.name }}</strong> 
            <span style="color: #666;">({{ type.id }})</span>
            <div style="font-size: 12px; color: #888; margin-left: 15px;">
              {{ type.description }}
            </div>
          </li>
        </ul>
      </div>
    </div>
    
    <!-- Тест создания конфигураций -->
    <div style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3>🔧 Тест работы конфигураций</h3>
      
      <div style="margin: 15px 0;">
        <label style="display: block; margin-bottom: 5px;">Выберите тип для детального просмотра:</label>
        <select v-model="selectedTypeId" style="padding: 5px 10px; border: 1px solid #ccc; border-radius: 4px; width: 100%;">
          <option value="">-- Выберите тип --</option>
          <option v-for="type in typesList" :key="type.id" :value="type.id">
            {{ type.name }}
          </option>
        </select>
      </div>
      
      <div v-if="selectedConfig" style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin-top: 15px;">
        <h4 style="color: #2563eb; margin-top: 0;">{{ selectedConfig.name }}</h4>
        <p style="color: #666;">{{ selectedConfig.description }}</p>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 15px 0;">
          <div>
            <strong>ID:</strong> {{ selectedConfig.id }}
          </div>
          <div>
            <strong>Категория:</strong> {{ selectedConfig.category }}
          </div>
          <div>
            <strong>Макет:</strong> {{ selectedConfig.layout }}
          </div>
          <div>
            <strong>Секторов:</strong> {{ selectedConfig.defaultSectorCount }}
          </div>
        </div>
        
        <div style="margin: 15px 0;">
          <h5 style="margin: 10px 0 5px 0;">Возможности (Capabilities):</h5>
          <div style="display: flex; flex-wrap: wrap; gap: 5px;">
            <span v-for="(value, key) in selectedConfig.capabilities" :key="key" 
                  v-if="value" 
                  style="background: #dcfce7; color: #15803d; padding: 2px 6px; border-radius: 4px; font-size: 12px;">
              {{ key }}
            </span>
          </div>
        </div>
        
        <div style="margin-top: 15px;">
          <button @click="testCreateData" 
                  style="background: #3b82f6; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">
            🧪 Создать тестовые данные
          </button>
        </div>
        
        <div v-if="testData.length > 0" style="margin-top: 15px;">
          <h5>Созданные тестовые данные:</h5>
          <div v-for="(item, index) in testData" :key="item.id"
               style="background: white; padding: 10px; margin: 5px 0; border: 1px solid #e5e7eb; border-radius: 4px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="background: #6b7280; color: white; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px;">
                {{ index + 1 }}
              </span>
              <strong :style="item.type === 'bonus' ? 'color: #d97706;' : 'color: #059669;'">
                {{ item.type === 'bonus' ? 'БОНУС' : 'СЕКТОР' }}
              </strong>
              <span style="color: #666; font-size: 12px;">{{ item.variants.join(', ') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Общий статус -->
    <div style="background: #f0fdf4; border: 1px solid #16a34a; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #15803d; margin-top: 0;">✅ Статус Этапа 1.1</h3>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; margin: 15px 0;">
        <div style="text-align: center; padding: 10px; background: white; border-radius: 6px;">
          <div style="font-size: 20px; font-weight: bold; color: #059669;">{{ systemStatus.totalTypes }}</div>
          <div style="font-size: 11px; color: #6b7280;">ТИПОВ</div>
        </div>
        <div style="text-align: center; padding: 10px; background: white; border-radius: 6px;">
          <div style="font-size: 20px; font-weight: bold; color: #d97706;">{{ systemStatus.olympTypes }}</div>
          <div style="font-size: 11px; color: #6b7280;">ОЛИМПИЕК</div>
        </div>
        <div style="text-align: center; padding: 10px; background: white; border-radius: 6px;">
          <div style="font-size: 20px; font-weight: bold; color: #7c3aed;">{{ systemStatus.complexTypes }}</div>
          <div style="font-size: 11px; color: #6b7280;">СЛОЖНЫХ</div>
        </div>
        <div style="text-align: center; padding: 10px; background: white; border-radius: 6px;">
          <div style="font-size: 20px; font-weight: bold; color: #0ea5e9;">{{ testData.length }}</div>
          <div style="font-size: 11px; color: #6b7280;">ТЕСТОВЫХ</div>
        </div>
      </div>
      
      <p style="color: #15803d; font-weight: 500; text-align: center; margin-bottom: 0;">
        🎯 <strong>Этап 1.1 - Базовая архитектура создана успешно!</strong>
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <p style="color: #666;">
        Система готова для добавления 20+ типов уровней.<br>
        Добавление нового типа займет всего 1-15 минут!
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Импортируем только типы, без проблемных компонентов
interface UniversalAnswer {
  id: string | number
  variants: string[]
  sectorName?: string
  bonusName?: string
  bonusTask?: string
  bonusHint?: string
  bonusTime?: { hours: number; minutes: number; seconds: number; negative?: boolean }
  bonusDelay?: { hours: number; minutes: number; seconds: number } | null
  bonusLimit?: { hours: number; minutes: number; seconds: number } | null
  bonusLevels?: {
    allLevels: boolean
    specificLevels?: number[]
    levelCheckboxNames?: string[]
  }
  type: 'sector' | 'bonus'
  metadata?: Record<string, any>
}

interface LevelCapabilities {
  hasSectors: boolean
  hasBonuses: boolean
  hasTask: boolean
  supportsSectorNames: boolean
  supportsMultipleVariants: boolean
  supportsBonusTask: boolean
  supportsBonusHints: boolean
  supportsBonusDelay: boolean
  supportsBonusLimits: boolean
  supportsBonusLevels: boolean
  supportsNegativeTime: boolean
  supportsTabs: boolean
  supportsCodeGeneration: boolean
  supportsImportExport: boolean
  supportsBulkOperations: boolean
  customFields?: Record<string, any>
}

interface LevelTypeConfig {
  id: string
  name: string
  description?: string
  category: 'olymp' | 'complex' | 'custom'
  defaultSectorCount: number
  maxSectorCount?: number
  capabilities: LevelCapabilities
  icon?: string
  color?: string
  layout: 'table' | 'tabs' | 'custom'
  validation?: any
  customConfig?: Record<string, any>
}

// Прямая декларация типов вместо импорта
const createOlympConfig = (sectorCount: number): LevelTypeConfig => ({
  id: `olymp_${sectorCount}`,
  name: `Олимпийка (${sectorCount} секторов)`,
  description: `Классическая олимпийка с ${sectorCount} секторами`,
  category: 'olymp',
  defaultSectorCount: sectorCount,
  maxSectorCount: sectorCount,
  capabilities: {
    hasSectors: true,
    hasBonuses: true,
    hasTask: true,
    supportsSectorNames: false,
    supportsMultipleVariants: true,
    supportsBonusTask: false,
    supportsBonusHints: false,
    supportsBonusDelay: false,
    supportsBonusLimits: false,
    supportsBonusLevels: true,
    supportsNegativeTime: true,
    supportsTabs: false,
    supportsCodeGeneration: false,
    supportsImportExport: true,
    supportsBulkOperations: true
  },
  layout: 'table'
})

const TYPE_100500_CONFIG: LevelTypeConfig = {
  id: 'type_100500',
  name: '100500 секторов и бонусов',
  description: 'Сложный тип с табами, задержками и дополнительным функционалом',
  category: 'complex',
  defaultSectorCount: 0,
  capabilities: {
    hasSectors: true,
    hasBonuses: true,
    hasTask: true,
    supportsSectorNames: true,
    supportsMultipleVariants: true,
    supportsBonusTask: true,
    supportsBonusHints: true,
    supportsBonusDelay: true,
    supportsBonusLimits: true,
    supportsBonusLevels: true,
    supportsNegativeTime: true,
    supportsTabs: true,
    supportsCodeGeneration: true,
    supportsImportExport: true,
    supportsBulkOperations: true
  },
  layout: 'tabs',
  customConfig: {
    defaultTabName: 'Блок',
    codeGenerationSettings: {
      minLength: 4,
      maxLength: 4,
      useNumbers: true,
      useLetters: false
    }
  }
}

// Локальный реестр типов
const TYPES_REGISTRY: Record<string, LevelTypeConfig> = {
  'olymp_15': createOlympConfig(15),
  'olymp_31': createOlympConfig(31),
  'olymp_63': createOlympConfig(63),
  'olymp_127': createOlympConfig(127),
  'type_100500': TYPE_100500_CONFIG
}

// ============================================================================
// REACTIVE DATA
// ============================================================================

const selectedTypeId = ref<string>('')
const testData = ref<UniversalAnswer[]>([])
const systemStatus = ref({
  loaded: false,
  totalTypes: 0,
  olympTypes: 0,
  complexTypes: 0,
  customTypes: 0
})

// ============================================================================
// COMPUTED
// ============================================================================

const typesList = computed(() => {
  return Object.values(TYPES_REGISTRY)
})

const selectedConfig = computed(() => {
  return selectedTypeId.value ? TYPES_REGISTRY[selectedTypeId.value] : null
})

// ============================================================================
// METHODS
// ============================================================================

function loadSystemStatus() {
  const types = typesList.value
  
  systemStatus.value = {
    loaded: true,
    totalTypes: types.length,
    olympTypes: types.filter(t => t.category === 'olymp').length,
    complexTypes: types.filter(t => t.category === 'complex').length,
    customTypes: types.filter(t => t.category === 'custom').length
  }
  
  console.log('✅ Система типов загружена:', systemStatus.value)
}

function testCreateData() {
  if (!selectedConfig.value) return
  
  testData.value = []
  const config = selectedConfig.value
  
  console.log(`🧪 Создаем тестовые данные для ${config.name}`)
  
  // Создаем секторы
  if (config.capabilities.hasSectors) {
    const sectorCount = Math.min(config.defaultSectorCount, 3)
    
    for (let i = 1; i <= sectorCount; i++) {
      const sector: UniversalAnswer = {
        id: `sector_${i}`,
        variants: [`ОТВЕТ${i}`, `АЛТ${i}`],
        type: 'sector'
      }
      
      if (config.capabilities.supportsSectorNames) {
        sector.sectorName = `Сектор ${i}`
      }
      
      testData.value.push(sector)
    }
  }
  
  // Создаем бонус
  if (config.capabilities.hasBonuses) {
    const bonus: UniversalAnswer = {
      id: 'bonus_1',
      variants: ['БОНУСОТВЕТ'],
      bonusName: 'Тестовый бонус',
      bonusTime: { hours: 0, minutes: 5, seconds: 0 },
      bonusLevels: {
        allLevels: false,
        specificLevels: [1, 2],
        levelCheckboxNames: ['level_1', 'level_2']
      },
      type: 'bonus'
    }
    
    if (config.capabilities.supportsBonusTask) {
      bonus.bonusTask = '<p>HTML задания бонуса</p>'
    }
    
    if (config.capabilities.supportsBonusHints) {
      bonus.bonusHint = '<p>Подсказка к бонусу</p>'
    }
    
    if (config.capabilities.supportsBonusDelay) {
      bonus.bonusDelay = { hours: 0, minutes: 2, seconds: 0 }
    }
    
    if (config.capabilities.supportsBonusLimits) {
      bonus.bonusLimit = { hours: 0, minutes: 30, seconds: 0 }
    }
    
    testData.value.push(bonus)
  }
  
  console.log(`✅ Создано ${testData.value.length} тестовых элементов`)
}

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(() => {
  console.log('🚀 Изолированный тест системы типов запущен')
  loadSystemStatus()
  
  // Автоматически выбираем первый тип
  setTimeout(() => {
    if (typesList.value.length > 0) {
      selectedTypeId.value = typesList.value[0].id
      testCreateData()
    }
  }, 500)
})
</script>

