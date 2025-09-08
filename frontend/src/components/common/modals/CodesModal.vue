<template>
  <BaseModal
    v-model="visible"
    header="Добавление кодов"
    width="50vw"
  >
    <div class="codes-container">
      <TabView v-model:active-index="activeTab">
        <TabPanel header="Ручной ввод" value="0">
          <div class="manual-input">
            <label class="block text-sm font-medium mb-2">
              Введите коды (каждый с новой строки):
            </label>
            <Textarea
              v-model="manualCodes"
              :rows="10"
              placeholder="Код 1&#10;Код 2&#10;Код 3..."
              class="w-full"
              :auto-resize="true"
            />
            <div class="mt-2 text-sm text-gray-600">
              Введено кодов: {{ manualCodesCount }}
            </div>
          </div>
        </TabPanel>
        
        <TabPanel header="Генерация" value="1">
          <div class="generation-options">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <BaseInput
                  v-model="generationOptions.prefix"
                  label="Префикс"
                  placeholder="Например: SECTOR_"
                />
              </div>
              <div>
                <BaseInput
                  v-model="generationOptions.suffix"
                  label="Суффикс"
                  placeholder="Например: _2024"
                />
              </div>
              <div>
                <BaseInput
                  :model-value="String(generationOptions.startFrom)"
                  @update:model-value="generationOptions.startFrom = Number($event)"
                  type="number"
                  label="Начать с"
                />
              </div>
              <div>
                <BaseInput
                  :model-value="String(generationOptions.count)"
                  @update:model-value="generationOptions.count = Number($event)"
                  type="number"
                  label="Количество"
                />
              </div>
              <div>
                <BaseInput
                  :model-value="String(generationOptions.padding)"
                  @update:model-value="generationOptions.padding = Number($event)"
                  type="number"
                  label="Дополнение нулями"
                  help="Например, 3 → 001, 002, 003"
                />
              </div>
              <div>
                <BaseSelect
                  v-model="generationOptions.format"
                  label="Формат"
                  :options="formatOptions"
                />
              </div>
            </div>
            
            <div class="mt-4">
              <BaseButton variant="primary" @click="generateCodes">
                Сгенерировать
              </BaseButton>
            </div>
            
            <div v-if="generatedCodes" class="mt-4">
              <label class="block text-sm font-medium mb-2">
                Сгенерированные коды:
              </label>
              <Textarea
                v-model="generatedCodes"
                :rows="10"
                readonly
                class="w-full"
              />
            </div>
          </div>
        </TabPanel>
        
        <TabPanel header="Импорт из файла" value="2">
          <div class="file-import">
            <FileUpload
              mode="basic"
              name="codes"
              accept=".txt,.csv"
              :max-file-size="1000000"
              @select="handleFileImport"
              :auto="false"
              choose-label="Выбрать файл"
            />
            
            <div v-if="importedCodes" class="mt-4">
              <label class="block text-sm font-medium mb-2">
                Импортированные коды:
              </label>
              <Textarea
                v-model="importedCodes"
                :rows="10"
                readonly
                class="w-full"
              />
              <div class="mt-2 text-sm text-gray-600">
                Импортировано кодов: {{ importedCodesCount }}
              </div>
            </div>
          </div>
        </TabPanel>
      </TabView>
    </div>
    
    <template #footer>
      <BaseButton 
        variant="primary" 
        @click="handleApply"
        :disabled="!hasCodesReady"
      >
        Применить ({{ totalCodesCount }} кодов)
      </BaseButton>
      <BaseButton variant="secondary" @click="handleCancel" class="ml-2">
        Отмена
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Textarea from 'primevue/textarea'
import FileUpload from 'primevue/fileupload'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'apply': [codes: string[]]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const activeTab = ref(0)
const manualCodes = ref('')
const generatedCodes = ref('')
const importedCodes = ref('')

const generationOptions = ref({
  prefix: '',
  suffix: '',
  startFrom: 1,
  count: 10,
  padding: 3,
  format: 'numeric'
})

const formatOptions = [
  { label: 'Числовой', value: 'numeric' },
  { label: 'Буквенный (A-Z)', value: 'alpha' },
  { label: 'Буквенно-числовой', value: 'alphanumeric' }
]

const manualCodesCount = computed(() => {
  return manualCodes.value.trim() ? manualCodes.value.trim().split('\n').length : 0
})

const importedCodesCount = computed(() => {
  return importedCodes.value.trim() ? importedCodes.value.trim().split('\n').length : 0
})

const hasCodesReady = computed(() => {
  return manualCodes.value.trim() || generatedCodes.value.trim() || importedCodes.value.trim()
})

const totalCodesCount = computed(() => {
  let count = 0
  if (activeTab.value === 0) count = manualCodesCount.value
  else if (activeTab.value === 1) count = generatedCodes.value.trim() ? generatedCodes.value.trim().split('\n').length : 0
  else if (activeTab.value === 2) count = importedCodesCount.value
  return count
})

function generateCodes() {
  const codes = []
  const { prefix, suffix, startFrom, count, padding, format } = generationOptions.value
  
  for (let i = 0; i < count; i++) {
    let code = ''
    
    if (format === 'numeric') {
      code = String(startFrom + i).padStart(padding, '0')
    } else if (format === 'alpha') {
      code = String.fromCharCode(65 + (i % 26)).repeat(Math.floor(i / 26) + 1)
    } else {
      code = String(startFrom + i).padStart(padding, '0')
    }
    
    codes.push(`${prefix}${code}${suffix}`)
  }
  
  generatedCodes.value = codes.join('\n')
}

async function handleFileImport(event: any) {
  const file = event.files[0]
  if (file) {
    const text = await file.text()
    importedCodes.value = text.trim()
  }
}

function handleApply() {
  let codes: string[] = []
  
  if (activeTab.value === 0 && manualCodes.value.trim()) {
    codes = manualCodes.value.trim().split('\n').map(c => c.trim()).filter(Boolean)
  } else if (activeTab.value === 1 && generatedCodes.value.trim()) {
    codes = generatedCodes.value.trim().split('\n').map(c => c.trim()).filter(Boolean)
  } else if (activeTab.value === 2 && importedCodes.value.trim()) {
    codes = importedCodes.value.trim().split('\n').map(c => c.trim()).filter(Boolean)
  }
  
  if (codes.length > 0) {
    emit('apply', codes)
    visible.value = false
    resetState()
  }
}

function handleCancel() {
  visible.value = false
  resetState()
}

function resetState() {
  activeTab.value = 0
  manualCodes.value = ''
  generatedCodes.value = ''
  importedCodes.value = ''
  generationOptions.value = {
    prefix: '',
    suffix: '',
    startFrom: 1,
    count: 10,
    padding: 3,
    format: 'numeric'
  }
}
</script>

<style scoped>
.codes-container {
  min-height: 400px;
}

.manual-input,
.generation-options,
.file-import {
  padding: 1rem;
}
</style>
