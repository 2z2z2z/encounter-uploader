<template>
  <div class="pattern-control">
    <BaseInput
      v-model="pattern"
      :label="label"
      :placeholder="placeholder"
      :help="help"
      :disabled="disabled"
      @update:modelValue="handleUpdate"
    />
    <div v-if="showPreview && preview" class="mt-2 p-2 bg-gray-100 rounded text-sm">
      <strong>Предпросмотр:</strong>
      <div class="mt-1">
        <span v-for="(item, index) in previewItems" :key="index" class="mr-2">
          {{ item }}
        </span>
      </div>
    </div>
    <div v-if="showApplyButton" class="mt-2">
      <BaseButton 
        variant="secondary" 
        size="small"
        @click="handleApply"
        :disabled="!pattern"
      >
        Применить ко всем
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

interface Props {
  modelValue: string
  label?: string
  placeholder?: string
  help?: string
  showPreview?: boolean
  showApplyButton?: boolean
  previewCount?: number
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Паттерн',
  placeholder: 'Текст или & для замены на номер',
  help: 'Используйте & для замены на номер элемента',
  showPreview: true,
  showApplyButton: false,
  previewCount: 3,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'apply': [value: string]
}>()

const pattern = ref(props.modelValue)

const preview = computed(() => {
  return pattern.value && pattern.value.includes('&')
})

const previewItems = computed(() => {
  if (!preview.value) return []
  
  const items = []
  for (let i = 1; i <= props.previewCount; i++) {
    items.push(pattern.value.replace(/&/g, String(i)))
  }
  return items
})

watch(() => props.modelValue, (newVal) => {
  pattern.value = newVal
})

function handleUpdate(value: string) {
  emit('update:modelValue', value)
}

function handleApply() {
  emit('apply', pattern.value)
}
</script>

<style scoped>
.pattern-control {
  width: 100%;
}
</style>
