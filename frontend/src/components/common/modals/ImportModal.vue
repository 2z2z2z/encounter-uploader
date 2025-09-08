<template>
  <BaseModal
    v-model="visible"
    header="Импортировать данные"
    width="40vw"
  >
    <div class="import-container">
      <FileUpload
        mode="basic"
        name="import"
        :accept="accept"
        :max-file-size="maxFileSize"
        @select="handleFileSelect"
        :auto="false"
        choose-label="Выбрать файл"
      />
      
      <div v-if="selectedFile" class="file-info mt-4">
        <p class="text-sm">
          <strong>Файл:</strong> {{ selectedFile.name }}
        </p>
        <p class="text-sm">
          <strong>Размер:</strong> {{ formatFileSize(selectedFile.size) }}
        </p>
      </div>
      
      <Message v-if="error" severity="error" :closable="false" class="mt-4">
        {{ error }}
      </Message>
      
      <Message v-if="validationResult" :severity="validationResult.isValid ? 'success' : 'warn'" :closable="false" class="mt-4">
        <div v-if="validationResult.isValid">
          Файл прошел валидацию. Найдено записей: {{ validationResult.recordCount }}
        </div>
        <div v-else>
          <p>Обнаружены проблемы при валидации:</p>
          <ul class="mt-2">
            <li v-for="(issue, index) in validationResult.issues" :key="index">
              {{ issue }}
            </li>
          </ul>
        </div>
      </Message>
    </div>
    
    <template #footer>
      <BaseButton 
        variant="primary" 
        @click="handleImport"
        :disabled="!selectedFile || !!(validationResult && !validationResult.isValid)"
        :loading="importing"
      >
        Импортировать
      </BaseButton>
      <BaseButton variant="secondary" @click="handleCancel" class="ml-2">
        Отмена
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import FileUpload from 'primevue/fileupload'
import Message from 'primevue/message'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

interface ValidationResult {
  isValid: boolean
  recordCount?: number
  issues?: string[]
}

interface Props {
  modelValue: boolean
  accept?: string
  maxFileSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  accept: '.json,.csv',
  maxFileSize: 5000000 // 5MB
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'import': [file: File]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const selectedFile = ref<File | null>(null)
const error = ref('')
const validationResult = ref<ValidationResult | null>(null)
const importing = ref(false)

function handleFileSelect(event: any) {
  const file = event.files[0]
  if (file) {
    selectedFile.value = file
    error.value = ''
    validationResult.value = null
    validateFile(file)
  }
}

async function validateFile(_file: File) {
  // Здесь будет вызов composable для валидации
  // Пока заглушка
  validationResult.value = {
    isValid: true,
    recordCount: 10
  }
}

async function handleImport() {
  if (!selectedFile.value) return
  
  importing.value = true
  emit('import', selectedFile.value)
  
  // Закрываем модалку после импорта
  setTimeout(() => {
    importing.value = false
    visible.value = false
    resetState()
  }, 500)
}

function handleCancel() {
  visible.value = false
  resetState()
}

function resetState() {
  selectedFile.value = null
  error.value = ''
  validationResult.value = null
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
</script>

<style scoped>
.import-container {
  padding: 1rem;
}

.file-info {
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 0.25rem;
}
</style>
