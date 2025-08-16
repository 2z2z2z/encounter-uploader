<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">Экспорт данных</h2>
        <button @click="closeModal" class="modal-close">❌</button>
      </div>
      
      <div class="modal-body">
        <div class="export-options">
          <h3 class="section-title">Выберите формат экспорта:</h3>
          
          <div class="format-options">
            <label class="format-option">
              <input 
                type="radio" 
                v-model="selectedFormat" 
                value="json"
                class="format-radio"
              />
              <div class="format-info">
                <div class="format-name">JSON</div>
                <div class="format-description">
                  Полный экспорт всех данных в формате JSON
                </div>
              </div>
            </label>
            
            <label class="format-option">
              <input 
                type="radio" 
                v-model="selectedFormat" 
                value="csv"
                class="format-radio"
              />
              <div class="format-info">
                <div class="format-name">CSV</div>
                <div class="format-description">
                  Таблица для Excel (только варианты ответов)
                </div>
              </div>
            </label>
            
            <label class="format-option">
              <input 
                type="radio" 
                v-model="selectedFormat" 
                value="txt"
                class="format-radio"
              />
              <div class="format-info">
                <div class="format-name">TXT</div>
                <div class="format-description">
                  Простой текстовый файл (по одному ответу на строку)
                </div>
              </div>
            </label>
          </div>
          
          <div class="export-settings">
            <h4 class="settings-title">Настройки экспорта:</h4>
            
            <label class="setting-option">
              <input 
                type="checkbox" 
                v-model="includeMetadata"
                class="setting-checkbox"
              />
              <span>Включить метаданные (дата создания, тип уровня и т.д.)</span>
            </label>
            
            <label class="setting-option">
              <input 
                type="checkbox" 
                v-model="includeFlags"
                class="setting-checkbox"
              />
              <span>Включить флаги (в секторах, в бонусах)</span>
            </label>
            
            <label class="setting-option" v-if="selectedFormat === 'json'">
              <input 
                type="checkbox" 
                v-model="prettyFormat"
                class="setting-checkbox"
              />
              <span>Форматированный JSON (читаемый)</span>
            </label>
          </div>
          
          <div class="file-preview">
            <h4 class="preview-title">Предпросмотр:</h4>
            <div class="preview-info">
              <div class="info-item">
                <strong>Формат:</strong> {{ formatLabels[selectedFormat] }}
              </div>
              <div class="info-item">
                <strong>Элементов:</strong> {{ data?.length || 0 }}
              </div>
              <div class="info-item">
                <strong>Размер:</strong> ~ {{ estimatedSize }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button @click="closeModal" class="btn btn-secondary">Отмена</button>
        <button @click="handleExport" class="btn btn-primary">
          📤 Экспортировать
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface ExportItem {
  id?: string | number
  variants?: string[]
  inSector?: boolean
  inBonus?: boolean
  [key: string]: any
}

interface ExportType {
  name: string
  description?: string
  [key: string]: any
}

interface Props {
  show?: boolean
  data?: ExportItem[]
  type?: ExportType
}

const props = withDefaults(defineProps<Props>(), {
  show: false
})

const emit = defineEmits<{
  'close': []
  'export': [format: string, options: any]
}>()

const selectedFormat = ref<'json' | 'csv' | 'txt'>('json')
const includeMetadata = ref(true)
const includeFlags = ref(true)
const prettyFormat = ref(true)

const formatLabels = {
  json: 'JSON (JavaScript Object Notation)',
  csv: 'CSV (Comma Separated Values)',
  txt: 'TXT (Plain Text)'
}

const estimatedSize = computed(() => {
  if (!props.data) return '0 KB'
  
  const itemCount = props.data.length
  let avgSize = 50 // базовый размер на элемент
  
  switch (selectedFormat.value) {
    case 'json':
      avgSize = prettyFormat.value ? 150 : 100
      if (includeMetadata.value) avgSize += 50
      if (includeFlags.value) avgSize += 30
      break
    case 'csv':
      avgSize = 80
      break
    case 'txt':
      avgSize = 30
      break
  }
  
  const totalBytes = itemCount * avgSize
  
  if (totalBytes < 1024) return `${totalBytes} B`
  if (totalBytes < 1024 * 1024) return `${Math.round(totalBytes / 1024)} KB`
  return `${Math.round(totalBytes / (1024 * 1024))} MB`
})

function closeModal() {
  emit('close')
}

function handleExport() {
  const options = {
    includeMetadata: includeMetadata.value,
    includeFlags: includeFlags.value,
    prettyFormat: prettyFormat.value
  }
  
  emit('export', selectedFormat.value, options)
  closeModal()
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e5e5;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.format-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.format-option {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid #e5e5e5;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.format-option:hover {
  border-color: #d1d5db;
  background: #f9f9f9;
}

.format-option:has(.format-radio:checked) {
  border-color: #3b82f6;
  background: #eff6ff;
}

.format-radio {
  margin-top: 0.25rem;
}

.format-info {
  flex: 1;
}

.format-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.format-description {
  color: #6b7280;
  font-size: 0.875rem;
}

.export-settings {
  margin-bottom: 2rem;
}

.settings-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
}

.setting-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0;
  cursor: pointer;
}

.setting-checkbox {
  flex-shrink: 0;
}

.file-preview {
  background: #f3f4f6;
  padding: 1rem;
  border-radius: 0.5rem;
}

.preview-title {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
}

.info-item {
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e5e5;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

/* Responsive */
@media (max-width: 640px) {
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .modal-footer {
    flex-direction: column-reverse;
  }
}
</style>

