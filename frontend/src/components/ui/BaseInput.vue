<template>
  <div class="base-input">
    <label v-if="label" :for="inputId" class="block text-sm font-medium mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <InputText
      :id="inputId"
:value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :invalid="!!error"
      :class="inputClass"
@input="handleInput"
      @blur="$emit('blur', $event)"
      @focus="$emit('focus', $event)"
    />
    <small v-if="error" class="text-red-500 text-xs mt-1 block">{{ error }}</small>
    <small v-else-if="help" class="text-gray-500 text-xs mt-1 block">{{ help }}</small>
  </div>
</template>

<script setup lang="ts">
import InputText from 'primevue/inputtext'
import { computed, ref } from 'vue'

interface Props {
  modelValue: string
  label?: string
  placeholder?: string
  type?: 'text' | 'number' | 'email' | 'password' | 'tel' | 'url'
  disabled?: boolean
  required?: boolean
  error?: string
  help?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  placeholder: '',
  type: 'text',
  disabled: false,
  required: false,
  error: '',
  help: '',
  class: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'blur': [event: globalThis.FocusEvent]
  'focus': [event: globalThis.FocusEvent]
}>()

const inputId = ref(`input-${Math.random().toString(36).slice(2, 11)}`)

const inputClass = computed(() => {
  const classes = ['w-full', props.class]
  return classes.join(' ')
})

function handleInput(event: globalThis.Event) {
  const target = event.target as globalThis.HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<style scoped>
.base-input {
  width: 100%;
}
</style>
