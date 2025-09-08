<template>
  <div class="bonus-time-control">
    <TimeInput
      v-model="timeValue"
      :label="label"
      :show-negative="showNegative"
      :disabled="disabled"
      :required="required"
      @update:model-value="handleUpdate"
    />
    <div v-if="showApplyButton" class="mt-2">
      <BaseButton 
        variant="secondary" 
        size="small"
        @click="handleApply"
        :disabled="!hasChanges"
      >
        Применить ко всем
      </BaseButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import TimeInput from '@/components/ui/TimeInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

export interface TimeValue {
  hours: number
  minutes: number
  seconds: number
  negative?: boolean
}

interface Props {
  modelValue: TimeValue
  label?: string
  showNegative?: boolean
  showApplyButton?: boolean
  disabled?: boolean
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Бонусное время',
  showNegative: true,
  showApplyButton: false,
  disabled: false,
  required: false
})

const emit = defineEmits<{
  'update:modelValue': [value: TimeValue]
  'apply': [value: TimeValue]
}>()

const timeValue = ref<TimeValue>({ ...props.modelValue })
const hasChanges = ref(false)

watch(() => props.modelValue, (newVal) => {
  timeValue.value = { ...newVal }
  hasChanges.value = false
}, { deep: true })

function handleUpdate(value: TimeValue) {
  hasChanges.value = true
  emit('update:modelValue', value)
}

function handleApply() {
  emit('apply', timeValue.value)
  hasChanges.value = false
}
</script>

<style scoped>
.bonus-time-control {
  width: 100%;
}
</style>
