<template>
  <div class="configurable-editor">
    <!-- Header -->
    <div class="editor-header">
      <h1>{{ config.name }}</h1>
      <p class="author-info">
        автор: <strong>{{ authStore.username }}</strong>,
        домен: <strong>{{ universalStore.currentDomain }}</strong>,
        игра: <strong>{{ universalStore.currentGameId }}</strong>,
        уровень: <strong>{{ universalStore.currentLevelId }}</strong>
      </p>
      <div class="type-info">
        <span class="type-badge" :class="config.category">{{ config.category }}</span>
        <span class="type-description">{{ config.description }}</span>
      </div>
    </div>

    <!-- Dynamic Layout -->
    <component 
      :is="layoutComponent" 
      :config="config"
      :answers="universalStore.currentAnswers"
      @update:answers="universalStore.currentAnswers = $event"
      @add-answer="universalStore.addAnswer()"
      @remove-answer="universalStore.removeAnswer($event)"
      @duplicate-answer="universalStore.duplicateAnswer($event)"
    />

    <!-- Bottom Controls -->
    <div class="bottom-controls">
      <div class="left-controls">
        <button @click="goBack" class="back-btn">Назад</button>
      </div>

      <div class="center-controls">
        <button @click="clearAll" class="clear-btn">Очистить</button>
        <button @click="exportData" class="export-btn">Экспорт</button>
        <label class="import-label">
          <input type="file" @change="importData" accept=".json" style="display: none" />
          <span class="import-btn">Импорт</span>
        </label>
      </div>

      <div class="right-controls" v-if="config.capabilities.hasSectors || config.capabilities.hasBonuses">
        <div class="upload-group">
          <button
            v-if="config.capabilities.hasSectors"
            @click="uploadSectors"
            :disabled="uploading || !universalStore.canUploadSectors"
            class="upload-btn sectors"
          >
            {{ uploading ? 'Загрузка...' : 'Залить секторы' }}
          </button>
          <button
            v-if="config.capabilities.hasBonuses"
            @click="uploadBonuses"
            :disabled="uploading || !universalStore.canUploadBonuses"
            class="upload-btn bonuses"
          >
            {{ uploading ? 'Загрузка...' : 'Залить бонусы' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Statistics -->
    <div class="stats">
      <div class="stat-item" v-if="config.capabilities.hasSectors">
        <span class="stat-label">Секторов:</span>
        <span class="stat-value">{{ universalStore.validSectorsCount }}</span>
      </div>
      <div class="stat-item" v-if="config.capabilities.hasBonuses">
        <span class="stat-label">Бонусов:</span>
        <span class="stat-value">{{ universalStore.validBonusesCount }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Всего:</span>
        <span class="stat-value">{{ universalStore.currentAnswers.length }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useUniversalStore } from '../../store/universal'
import { useAuthStore } from '../../store/auth'
import { sendSector, sendBonuses, sendTask } from '../../services/uploader'
import type { LevelTypeConfig } from '../../types/level-system'

// Ensure this component has a default export for dynamic imports
defineOptions({
  name: 'ConfigurableEditor'
})

// ============================================================================
// PROPS
// ============================================================================

interface Props {
  config: LevelTypeConfig
}

const props = defineProps<Props>()

// ============================================================================
// COMPOSABLES
// ============================================================================

const router = useRouter()
const universalStore = useUniversalStore()
const authStore = useAuthStore()

// ============================================================================
// STATE
// ============================================================================

const uploading = ref(false)

// ============================================================================
// DYNAMIC COMPONENT LOADING
// ============================================================================

const layoutComponent = computed(() => {
  switch (props.config.layout) {
    case 'table':
      return defineAsyncComponent(() => import('./layouts/TableLayout.vue'))
    case 'tabs':
      return defineAsyncComponent(() => import('./layouts/TabsLayout.vue'))
    case 'custom':
      // Load custom layout based on type ID
      return defineAsyncComponent(() => import(`./layouts/Custom${props.config.id}Layout.vue`))
    default:
      return defineAsyncComponent(() => import('./layouts/DefaultLayout.vue'))
  }
})

// ============================================================================
// METHODS
// ============================================================================

function goBack() {
  router.push('/settings')
}

function clearAll() {
  if (confirm('Очистить все данные?')) {
    universalStore.clearAllAnswers()
  }
}

function exportData() {
  try {
    const jsonData = universalStore.exportCurrentState()
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `${props.config.id}_level_${universalStore.currentLevelId}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    alert('Ошибка экспорта: ' + (error as any)?.message)
  }
}

function importData(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const jsonData = String(reader.result || '')
      const success = universalStore.importState(jsonData)
      
      if (success) {
        alert('Данные успешно импортированы')
      } else {
        alert('Ошибка импорта: неверный формат данных')
      }
    } catch (error) {
      alert('Ошибка при импорте: ' + (error as any)?.message)
    }
  }
  reader.readAsText(file)
}

async function uploadSectors() {
  if (!universalStore.canUploadSectors) return
  
  uploading.value = true
  
  try {
    const sectorAnswers = universalStore.currentAnswers.filter(answer => 
      (answer.type === 'sector' || answer.inSector) && 
      answer.variants.some(v => v.trim())
    )
    
    for (const answer of sectorAnswers) {
      await sendSector(
        universalStore.currentDomain,
        universalStore.currentGameId,
        universalStore.currentLevelId,
        answer.variants.filter(v => v.trim()),
        answer.sectorName || ''
      )
    }
    
    // Upload task if supported
    if (props.config.capabilities.hasTask && universalStore.currentTask) {
      await sendTask(
        universalStore.currentDomain,
        universalStore.currentGameId,
        universalStore.currentLevelId,
        universalStore.currentTask
      )
    }
    
    alert(`Успешно загружено ${sectorAnswers.length} секторов`)
    
  } catch (error) {
    alert('Ошибка загрузки секторов: ' + (error as any)?.message)
  } finally {
    uploading.value = false
  }
}

async function uploadBonuses() {
  if (!universalStore.canUploadBonuses) return
  
  uploading.value = true
  
  try {
    const bonusAnswers = universalStore.currentAnswers.filter(answer => 
      (answer.type === 'bonus' || answer.inBonus) && 
      answer.variants.some(v => v.trim())
    )
    
    const bonuses = bonusAnswers.map((answer, index) => ({
      number: Number(answer.id) || index + 1,
      variants: answer.variants.filter(v => v.trim()),
      inSector: false,
      inBonus: true,
      bonusTime: answer.bonusTime || { hours: 0, minutes: 0, seconds: 0 },
      displayText: answer.bonusName || `Бонус ${answer.id}`,
      closedText: '',  // Required by Answer interface
      name: answer.bonusName || `Бонус ${answer.id}`,
      task: answer.bonusTask || '',
      hint: answer.bonusHint || '',
      allLevels: answer.bonusLevels?.allLevels || false,
      levelCheckboxNames: answer.bonusLevels?.levelCheckboxNames || [`level_${universalStore.currentLevelId}`]
    }))
    
    await sendBonuses(
      universalStore.currentDomain,
      universalStore.currentGameId,
      universalStore.currentLevelId,
      bonuses
    )
    
    alert(`Успешно загружено ${bonuses.length} бонусов`)
    
  } catch (error) {
    alert('Ошибка загрузки бонусов: ' + (error as any)?.message)
  } finally {
    uploading.value = false
  }
}

// No explicit export needed - script setup provides default export automatically
</script>

<style scoped>
.configurable-editor {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.editor-header {
  text-align: center;
  margin-bottom: 30px;
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.editor-header h1 {
  color: #2563eb;
  margin-bottom: 10px;
  font-size: 2rem;
}

.author-info {
  margin: 10px 0;
  color: #666;
  font-size: 0.9rem;
}

.type-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-top: 15px;
}

.type-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
}

.type-badge.olymp {
  background: #dbeafe;
  color: #1d4ed8;
}

.type-badge.complex {
  background: #fef3c7;
  color: #d97706;
}

.type-badge.custom {
  background: #f3e8ff;
  color: #7c3aed;
}

.type-description {
  color: #6b7280;
  font-size: 0.9rem;
  font-style: italic;
}

.bottom-controls {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 20px;
  align-items: center;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin: 20px 0;
}

.left-controls,
.center-controls,
.right-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.center-controls {
  justify-self: center;
}

.back-btn {
  background-color: #6b7280;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.back-btn:hover {
  background-color: #4b5563;
}

.clear-btn {
  background-color: #f59e0b;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.clear-btn:hover {
  background-color: #d97706;
}

.export-btn {
  background-color: #10b981;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.export-btn:hover {
  background-color: #059669;
}

.import-label {
  cursor: pointer;
}

.import-btn {
  background-color: #3b82f6;
  color: white;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  display: inline-block;
  font-weight: 500;
  transition: background-color 0.2s;
}

.import-btn:hover {
  background-color: #2563eb;
}

.upload-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.upload-btn {
  padding: 12px 18px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.upload-btn.sectors {
  background-color: #2563eb;
  color: white;
}

.upload-btn.sectors:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.upload-btn.bonuses {
  background-color: #dc2626;
  color: white;
}

.upload-btn.bonuses:hover:not(:disabled) {
  background-color: #b91c1c;
}

.upload-btn:disabled {
  background-color: #d1d5db;
  color: #9ca3af;
  cursor: not-allowed;
}

.stats {
  display: flex;
  justify-content: center;
  gap: 40px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  display: block;
  font-size: 1.8rem;
  font-weight: bold;
  color: #2563eb;
  margin-top: 4px;
}

@media (max-width: 768px) {
  .bottom-controls {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 15px;
  }
  
  .center-controls {
    justify-self: stretch;
  }
  
  .stats {
    flex-direction: column;
    gap: 20px;
  }
}
</style>
