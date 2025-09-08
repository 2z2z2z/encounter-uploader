<template>
  <div class="time-input">
    <label v-if="label" class="block text-sm font-medium mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <div class="flex items-center gap-2">
      <InputNumber
        v-model="hours"
        :min="0"
        :max="23"
        placeholder="ч"
        :disabled="disabled"
        class="w-20"
        @update:model-value="updateTime"
      />
      <span class="text-gray-500">:</span>
      <InputNumber
        v-model="minutes"
        :min="0"
        :max="59"
        placeholder="м"
        :disabled="disabled"
        class="w-20"
        @update:model-value="updateTime"
      />
      <span class="text-gray-500">:</span>
      <InputNumber
        v-model="seconds"
        :min="0"
        :max="59"
        placeholder="с"
        :disabled="disabled"
        class="w-20"
        @update:model-value="updateTime"
      />
      <Checkbox
        v-if="showNegative"
        v-model="negative"
        :disabled="disabled"
        @update:model-value="updateTime"
      />
      <label v-if="showNegative" class="text-gray-500 cursor-pointer" @click="negative = !negative">
        Отрицательное
      </label>
    </div>
    <small v-if="error" class="text-red-500 text-xs mt-1 block">{{ error }}</small>
    <small v-else-if="help" class="text-gray-500 text-xs mt-1 block">{{ help }}</small>
  </div>
</template>

<script setup lang="ts">
import InputNumber from 'primevue/inputnumber'
import Checkbox from 'primevue/checkbox'
import { ref, watch, onMounted } from 'vue'

interface TimeValue {
  hours: number
  minutes: number
  seconds: number
  negative?: boolean
}

interface Props {
  modelValue: TimeValue
  label?: string
  disabled?: boolean
  required?: boolean
  showNegative?: boolean
  error?: string
  help?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  required: false,
  showNegative: false
})

const emit = defineEmits<{
  'update:modelValue': [value: TimeValue]
}>()

const hours = ref(0)
const minutes = ref(0)
const seconds = ref(0)
const negative = ref(false)

onMounted(() => {
  if (props.modelValue) {
    hours.value = props.modelValue.hours || 0
    minutes.value = props.modelValue.minutes || 0
    seconds.value = props.modelValue.seconds || 0
    negative.value = props.modelValue.negative || false
  }
})

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    hours.value = newVal.hours || 0
    minutes.value = newVal.minutes || 0
    seconds.value = newVal.seconds || 0
    negative.value = newVal.negative || false
  }
}, { deep: true })

function updateTime() {
  const timeValue: TimeValue = {
    hours: hours.value || 0,
    minutes: minutes.value || 0,
    seconds: seconds.value || 0
  }
  
  if (props.showNegative) {
    timeValue.negative = negative.value
  }
  
  emit('update:modelValue', timeValue)
}
</script>

<style scoped>
.time-input {
  width: 100%;
}
</style>
