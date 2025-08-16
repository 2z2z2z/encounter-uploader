<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">Импорт данных</h2>
        <button @click="closeModal" class="modal-close">❌</button>
      </div>
      
      <div class="modal-body">
        <div class="import-section">
          <div class="upload-area" 
               :class="{ 'dragover': isDragOver }"
               @dragover.prevent="isDragOver = true"
               @dragleave="isDragOver = false"
               @drop.prevent="handleDrop">
            
            <div class="upload-icon">📁</div>
            <div class="upload-text">
              <h3>Выберите файл для импорта</h3>
              <p>Перетащите файл сюда или нажмите для выбора</p>
              <p class="file-types">Поддерживаемые форматы: JSON, CSV, TXT</p>
            </div>
            
            <input 
              type="file" 
              ref="fileInput"
              @change="handleFileSelect"
              accept=".json,.csv,.txt"
              class="file-input"
            />
            
            <button 
              @click="$refs.fileInput?.click()" 
              class="btn btn-primary"
            >
              Выбрать файл
            </button>
          </div>
          
          <div v-if="selectedFile" class="file-info">
            <h4 class="info-title">Выбранный файл:</h4>
            <div class="file-details">
              <div class="detail-item">
                <strong>Имя:</strong> {{ selectedFile.name }}
              </div>
              <div class="detail-item">
                <strong>Размер:</strong> {{ formatFileSize(selectedFile.size) }}
              </div>
              <div class="detail-item">
                <strong>Тип:</strong> {{ selectedFile.type || 'Неизвестный' }}
              </div>
              <div class="detail-item">
                <strong>Последнее изменение:</strong> {{ formatDate(selectedFile.lastModified) }}
              </div>
            </div>
            
            <div class="import-options">
              <h5 class="options-title">Настройки импорта:</h5>
              
              <label class="option-item">
                <input 
                  type="checkbox" 
                  v-model="mergeWithExisting"
                  class="option-checkbox"
                />
                <span>Объединить с существующими данными</span>
              </label>
              
              <label class="option-item">
                <input 
                  type="checkbox" 
                  v-model="validateData"
                  class="option-checkbox"
                />
                <span>Проверить данные перед импортом</span>
              </label>
              
              <label class="option-item">
                <input 
                  type="checkbox" 
                  v-model="createBackup"
                  class="option-checkbox"
                />
                <span>Создать резервную копию текущих данных</span>
              </label>
            </div>
            
            <div v-if="previewData" class="data-preview">
              <h5 class="preview-title">Предпросмотр данных:</h5>
              <div class="preview-stats">
                <span class="stat-item">Найдено записей: {{ previewData.length }}</span>
                <span class="stat-item">Валидных: {{ validRecords }}</span>
                <span class="stat-item">С ошибками: {{ invalidRecords }}</span>
              </div>
              
              <div class="preview-table">
                <div class="table-header">
                  <span>№</span>
                  <span>Варианты</span>
                  <span>Статус</span>
                </div>
                <div class="table-body">
                  <div 
                    v-for="(item, index) in previewData.slice(0, 5)" 
                    :key="index"
                    class="table-row"
                    :class="{ 'invalid': !item.valid }"
                  >
                    <span>{{ index + 1 }}</span>
                    <span>{{ Array.isArray(item.variants) ? item.variants.join(', ') : 'Нет данных' }}</span>
                    <span>{{ item.valid ? '✅' : '❌' }}</span>
                  </div>
                </div>
                <div v-if="previewData.length > 5" class="table-more">
                  ... и еще {{ previewData.length - 5 }} записей
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button @click="closeModal" class="btn btn-secondary">Отмена</button>
        <button 
          @click="handleImport" 
          :disabled="!selectedFile || isImporting"
          class="btn btn-primary"
        >
          {{ isImporting ? 'Импорт...' : '📥 Импортировать' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface ImportItem {
  variants?: string[]
  valid: boolean
  [key: string]: any
}

interface Props {
  show?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  show: false
})

const emit = defineEmits<{
  'close': []
  'import': [data: any[], options: any]
}>()

const isDragOver = ref(false)
const selectedFile = ref<File | null>(null)
const previewData = ref<ImportItem[] | null>(null)
const isImporting = ref(false)

// Options
const mergeWithExisting = ref(false)
const validateData = ref(true)
const createBackup = ref(true)

const validRecords = computed(() => {
  if (!previewData.value) return 0
  return previewData.value.filter(item => item.valid).length
})

const invalidRecords = computed(() => {
  if (!previewData.value) return 0
  return previewData.value.filter(item => !item.valid).length
})

function closeModal() {
  selectedFile.value = null
  previewData.value = null
  emit('close')
}

function handleDrop(event: DragEvent) {
  isDragOver.value = false
  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    handleFile(files[0])
  }
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    handleFile(target.files[0])
  }
}

async function handleFile(file: File) {
  selectedFile.value = file
  
  if (validateData.value) {
    await previewFile(file)
  }
}

async function previewFile(file: File) {
  try {
    const content = await readFileContent(file)
    const data = parseFileContent(content, file.name)
    previewData.value = data
  } catch (error) {
    console.error('Ошибка предпросмотра файла:', error)
    previewData.value = []
  }
}

function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

function parseFileContent(content: string, filename: string): ImportItem[] {
  const extension = filename.split('.').pop()?.toLowerCase()
  
  try {
    switch (extension) {
      case 'json':
        return parseJsonData(content)
      case 'csv':
        return parseCsvData(content)
      case 'txt':
        return parseTxtData(content)
      default:
        throw new Error('Неподдерживаемый формат файла')
    }
  } catch (error) {
    console.error('Ошибка парсинга:', error)
    return []
  }
}

function parseJsonData(content: string): ImportItem[] {
  const data = JSON.parse(content)
  const items = Array.isArray(data) ? data : [data]
  
  return items.map(item => ({
    ...item,
    valid: validateItem(item)
  }))
}

function parseCsvData(content: string): ImportItem[] {
  const lines = content.split('\n').filter(line => line.trim())
  const headers = lines[0]?.split(',').map(h => h.trim())
  
  return lines.slice(1).map((line, index) => {
    const values = line.split(',').map(v => v.trim())
    const item: any = {}
    
    headers?.forEach((header, i) => {
      item[header] = values[i] || ''
    })
    
    // Попытка определить варианты
    if (item.variants) {
      item.variants = item.variants.split('|').map((v: string) => v.trim())
    } else {
      // Первая колонка как вариант
      item.variants = [values[0] || '']
    }
    
    return {
      ...item,
      valid: validateItem(item)
    }
  })
}

function parseTxtData(content: string): ImportItem[] {
  const lines = content.split('\n').filter(line => line.trim())
  
  return lines.map((line, index) => {
    const item = {
      variants: [line.trim()],
      inSector: true,
      inBonus: false
    }
    
    return {
      ...item,
      valid: validateItem(item)
    }
  })
}

function validateItem(item: any): boolean {
  // Базовая валидация
  return !!(item.variants && Array.isArray(item.variants) && item.variants[0])
}

async function handleImport() {
  if (!selectedFile.value) return
  
  isImporting.value = true
  
  try {
    const content = await readFileContent(selectedFile.value)
    const data = parseFileContent(content, selectedFile.value.name)
    
    const options = {
      merge: mergeWithExisting.value,
      validate: validateData.value,
      backup: createBackup.value,
      filename: selectedFile.value.name
    }
    
    emit('import', data, options)
    
  } catch (error) {
    console.error('Ошибка импорта:', error)
    alert('Ошибка импорта файла: ' + (error as Error).message)
  } finally {
    isImporting.value = false
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB'
  return Math.round(bytes / (1024 * 1024)) + ' MB'
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
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
  max-width: 800px;
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

.upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 0.75rem;
  padding: 2rem;
  text-align: center;
  transition: all 0.2s ease;
  position: relative;
  margin-bottom: 1.5rem;
}

.upload-area.dragover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.upload-text h3 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
}

.upload-text p {
  margin: 0;
  color: #6b7280;
}

.file-types {
  font-size: 0.875rem;
  margin-top: 0.5rem !important;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.file-info {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.info-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.file-details {
  display: grid;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.detail-item {
  font-size: 0.875rem;
}

.import-options,
.data-preview {
  margin-top: 1.5rem;
}

.options-title,
.preview-title {
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  cursor: pointer;
}

.preview-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.stat-item {
  padding: 0.25rem 0.75rem;
  background: #e5e7eb;
  border-radius: 1rem;
  font-size: 0.875rem;
  color: #374151;
}

.preview-table {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 3rem 1fr 4rem;
  gap: 1rem;
  padding: 0.75rem;
}

.table-header {
  background: #f3f4f6;
  font-weight: 600;
  color: #374151;
}

.table-row {
  border-top: 1px solid #e5e7eb;
}

.table-row.invalid {
  background: #fef2f2;
  color: #991b1b;
}

.table-more {
  padding: 0.75rem;
  text-align: center;
  color: #6b7280;
  font-style: italic;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
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
  
  .preview-stats {
    flex-direction: column;
  }
  
  .table-header,
  .table-row {
    grid-template-columns: 2rem 1fr 3rem;
    font-size: 0.875rem;
  }
}
</style>

