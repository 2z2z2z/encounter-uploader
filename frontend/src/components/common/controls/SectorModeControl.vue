<template>
  <div class="sector-mode-control">
    <BaseSelect
      v-model="mode"
      :label="label"
      :options="modeOptions"
      :disabled="disabled"
      @change="handleChange"
    />
    <div v-if="showDescription" class="mt-2 text-sm text-gray-600">
      {{ currentDescription }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'

export type SectorMode = 'all' | 'initialAndFinal' | 'finalOnly' | 'custom'

interface Props {
  modelValue: SectorMode
  label?: string
  showDescription?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Режим закрытия секторов',
  showDescription: true,
  disabled: false
})

const emit = defineEmits<{
  'update:modelValue': [value: SectorMode]
  'change': [value: SectorMode]
}>()

const mode = ref<SectorMode>(props.modelValue)

const modeOptions = [
  { label: 'Все сектора', value: 'all' },
  { label: 'Начальные + финал', value: 'initialAndFinal' },
  { label: 'Только финал', value: 'finalOnly' },
  { label: 'Кастомный', value: 'custom' }
]

const descriptions: Record<SectorMode, string> = {
  all: 'Все сектора будут закрыты',
  initialAndFinal: 'Закрыты первые сектора и финальный',
  finalOnly: 'Закрыт только финальный сектор',
  custom: 'Выберите сектора для закрытия вручную'
}

const currentDescription = computed(() => {
  return descriptions[mode.value]
})

watch(() => props.modelValue, (newVal) => {
  mode.value = newVal
})

function handleChange(event: any) {
  const value = event.value as SectorMode
  mode.value = value
  emit('update:modelValue', value)
  emit('change', value)
}
</script>

<style scoped>
.sector-mode-control {
  width: 100%;
}
</style>
