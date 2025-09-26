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
                  v-model="generationOptions.size"
                  label="Размер"
                  :options="sizeOptions"
                  :disabled="generationOptions.format === 'mask'"
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

            <div v-if="generationOptions.format === 'mask'" class="mt-4">
              <BaseInput
                v-model="generationOptions.mask"
                label="Маска"
                placeholder="слово(3)000яяz"
                help="Переменные: слово - слово из словаря, (N) - количество букв, 0 - цифры, я - русские буквы, z - английские буквы"
              />
              <div class="text-sm text-gray-600 mt-2">
                <strong>Примеры:</strong><br>
                • слово(3)000яяz → рот495ыщj<br>
                • zz0000я → ГЕ5832Б<br>
                • слово → случайное слово
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
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center">
          <Checkbox
            v-model="excludeDuplicates"
            input-id="exclude-duplicates"
            binary
          />
          <label for="exclude-duplicates" class="ml-2 text-sm">
            Исключать дубликаты
          </label>
        </div>
        <div class="flex gap-2">
          <BaseButton
            variant="primary"
            @click="handleApply"
            :disabled="!hasCodesReady"
          >
            Применить ({{ totalCodesCount }} кодов)
          </BaseButton>
          <BaseButton variant="secondary" @click="handleCancel">
            Отмена
          </BaseButton>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Textarea from 'primevue/textarea'
import FileUpload from 'primevue/fileupload'
import Checkbox from 'primevue/checkbox'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import { getRandomWord, getRandomCyrillicLetter, getRandomLatinLetter, getRandomDigit } from '@/utils/russianWords'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'apply': [codes: string[], excludeDuplicates: boolean]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

const activeTab = ref(0)
const manualCodes = ref('')
const generatedCodes = ref('')
const importedCodes = ref('')
const excludeDuplicates = ref(false)

const generationOptions = ref({
  prefix: '',
  suffix: '',
  startFrom: 1,
  count: 10,
  padding: 3,
  size: 5,
  format: 'numeric',
  mask: ''
})

const sizeOptions = [
  { label: '2', value: 2 },
  { label: '3', value: 3 },
  { label: '4', value: 4 },
  { label: '5', value: 5 },
  { label: '6', value: 6 },
  { label: '7', value: 7 },
  { label: '8', value: 8 },
  { label: '9', value: 9 },
  { label: '10', value: 10 }
]

const formatOptions = [
  { label: 'Числовой', value: 'numeric' },
  { label: 'Буквенный (A-Z)', value: 'alpha' },
  { label: 'Буквенно-числовой', value: 'alphanumeric' },
  { label: 'Буквенный (А-Я)', value: 'cyrillic' },
  { label: 'Слова (русские)', value: 'words' },
  { label: 'Маска', value: 'mask' }
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

function parseCodeMask(mask: string, usedWords?: Set<string>): string {
  let result = ''
  let i = 0

  while (i < mask.length) {
    const char = mask[i]

    if (mask.substring(i).startsWith('слово')) {
      const lengthMatch = mask.substring(i).match(/^слово\((\d+)\)/)
      let word: string

      if (lengthMatch) {
        const length = Number.parseInt(lengthMatch[1])
        // Если передан Set usedWords, ищем уникальное слово
        if (usedWords) {
          let attempts = 0
          const maxAttempts = 50 // Лимит попыток для поиска уникального слова
          do {
            word = getRandomWord(length)
            attempts++
          } while (usedWords.has(word) && attempts < maxAttempts)

          if (attempts < maxAttempts) {
            usedWords.add(word)
          }
        } else {
          word = getRandomWord(length)
        }
        result += word
        i += lengthMatch[0].length
      } else {
        // Если передан Set usedWords, ищем уникальное слово
        if (usedWords) {
          let attempts = 0
          const maxAttempts = 50 // Лимит попыток для поиска уникального слова
          do {
            word = getRandomWord()
            attempts++
          } while (usedWords.has(word) && attempts < maxAttempts)

          if (attempts < maxAttempts) {
            usedWords.add(word)
          }
        } else {
          word = getRandomWord()
        }
        result += word
        i += 5
      }
    } else if (char === '0') {
      result += getRandomDigit()
      i++
    } else if (char === 'я') {
      result += getRandomCyrillicLetter()
      i++
    } else if (char === 'z') {
      result += getRandomLatinLetter()
      i++
    } else {
      result += char
      i++
    }
  }

  return result
}

function generateRandomCode(size: number, format: string, mask?: string, usedWords?: Set<string>): string {
  if (format === 'numeric') {
    const min = Math.pow(10, size - 1)
    const max = Math.pow(10, size) - 1
    return String(Math.floor(Math.random() * (max - min + 1)) + min)
  } else if (format === 'alpha') {
    let code = ''
    for (let i = 0; i < size; i++) {
      code += getRandomLatinLetter()
    }
    return code
  } else if (format === 'cyrillic') {
    let code = ''
    for (let i = 0; i < size; i++) {
      code += getRandomCyrillicLetter()
    }
    return code
  } else if (format === 'words') {
    return getRandomWord(size)
  } else if (format === 'mask' && mask) {
    return parseCodeMask(mask, usedWords)
  } else {
    let code = ''
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    for (let i = 0; i < size; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
  }
}

function generateCodes() {
  const { prefix, suffix, count, size, format, mask } = generationOptions.value
  const codes = new Set<string>()
  const usedWords = new Set<string>() // Для отслеживания уже использованных слов в масках

  let attempts = 0
  const maxAttempts = count * 100

  while (codes.size < count && attempts < maxAttempts) {
    const code = generateRandomCode(size, format, mask, usedWords)
    const fullCode = `${prefix}${code}${suffix}`
    codes.add(fullCode)
    attempts++
  }

  if (codes.size < count) {
    globalThis.alert(`Не удалось сгенерировать ${count} уникальных кодов. Сгенерировано: ${codes.size}`)
  }

  generatedCodes.value = Array.from(codes).join('\n')
}

async function handleFileImport(event: { files: globalThis.File[] }) {
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
    emit('apply', codes, excludeDuplicates.value)
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
  excludeDuplicates.value = false
  generationOptions.value = {
    prefix: '',
    suffix: '',
    startFrom: 1,
    count: 10,
    padding: 3,
    size: 4,
    format: 'numeric',
    mask: ''
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
