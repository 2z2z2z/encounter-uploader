<template>
  <div class="base-select">
    <label v-if="label" :for="selectId" class="block text-sm font-medium mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <Select
      :id="selectId"
      :model-value="modelValue"
      :options="options"
      :option-label="optionLabel"
      :option-value="optionValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :invalid="!!error"
      :show-clear="showClear"
      :filter="filter"
      :class="selectClass"
      @update:model-value="(value) => $emit('update:modelValue', value)"
    />
    <small v-if="error" class="text-red-500 text-xs mt-1 block">{{ error }}</small>
    <small v-else-if="help" class="text-gray-500 text-xs mt-1 block">{{ help }}</small>
  </div>
</template>

<script setup lang="ts">
import Select from 'primevue/select'
import { computed, ref } from 'vue'

interface Props {
  modelValue: any
  options: any[]
  label?: string
  placeholder?: string
  optionLabel?: string
  optionValue?: string
  disabled?: boolean
  required?: boolean
  showClear?: boolean
  filter?: boolean
  error?: string
  help?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  optionLabel: 'label',
  optionValue: 'value',
  disabled: false,
  required: false,
  showClear: false,
  filter: false,
  class: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
  'change': [event: any]
}>()

const selectId = ref(`select-${Math.random().toString(36).substr(2, 9)}`)

const selectClass = computed(() => {
  const classes = ['w-full', props.class]
  return classes.join(' ')
})

</script>

<style scoped>
.base-select {
  width: 100%;
}
</style>
