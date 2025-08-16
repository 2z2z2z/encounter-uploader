<template>
  <div class="action-buttons">
    <div class="buttons-container flex flex-wrap gap-3 justify-center">
      <!-- Export/Import buttons -->
      <div class="button-group flex gap-2">
        <button 
          @click="handleExport"
          class="btn btn-secondary"
        >
          📤 Экспорт
        </button>
        
        <label class="btn btn-secondary cursor-pointer">
          📥 Импорт
          <input 
            type="file" 
            accept=".json"
            @change="handleImport"
            class="hidden"
          />
        </label>
      </div>
      
      <!-- Upload buttons based on capabilities -->
      <div class="button-group flex gap-2">
        <button 
          v-if="hasCapability('task')"
          @click="$emit('upload-task')"
          class="btn btn-primary"
        >
          🚀 Загрузить задание
        </button>
        
        <button 
          v-if="hasCapability('sectors')"
          @click="$emit('upload-sectors')"
          class="btn btn-primary"
        >
          🎯 Загрузить сектора
        </button>
        
        <button 
          v-if="hasCapability('bonuses')"
          @click="$emit('upload-bonuses')"
          class="btn btn-primary"
        >
          🎁 Загрузить бонусы
        </button>
      </div>
      
      <!-- Utility buttons -->
      <div class="button-group flex gap-2">
        <button 
          @click="$emit('preview')"
          class="btn btn-info"
        >
          👁️ Предпросмотр
        </button>
        
        <button 
          @click="handleClear"
          class="btn btn-warning"
        >
          🗑️ Очистить
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface LevelCapability {
  type: string
  required: boolean
  config?: any
}

interface Props {
  capabilities: LevelCapability[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'export': []
  'import': [file: File]
  'upload-task': []
  'upload-sectors': []
  'upload-bonuses': []
  'preview': []
  'clear': []
}>()

function hasCapability(type: string): boolean {
  return props.capabilities?.some(cap => cap.type === type) || false
}

function handleExport() {
  emit('export')
}

function handleImport(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    emit('import', target.files[0])
  }
}

function handleClear() {
  if (confirm('Очистить все данные?')) {
    emit('clear')
  }
}
</script>

<style scoped>
.action-buttons {
  margin-top: 2rem;
  padding: 1.5rem;
  border-top: 2px solid #e5e5e5;
  background: #f9f9f9;
}

.buttons-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: center;
}

.button-group {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
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

.btn-info {
  background: #06b6d4;
  color: white;
}

.btn-info:hover {
  background: #0891b2;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover {
  background: #d97706;
}

.hidden {
  display: none;
}

@media (max-width: 768px) {
  .buttons-container {
    flex-direction: column;
    align-items: center;
  }
  
  .button-group {
    justify-content: center;
    flex-wrap: wrap;
  }
}
</style>

