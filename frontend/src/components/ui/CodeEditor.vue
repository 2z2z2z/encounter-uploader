<template>
  <div class="code-editor">
    <label v-if="label" class="block text-sm font-medium mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <Textarea
:model-value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :rows="rows"
      :auto-resize="autoResize"
      class="w-full font-mono text-sm"
@input="handleInput" @update:model-value="(value: string) => $emit('update:modelValue', value)"
    />
    <small v-if="error" class="text-red-500 text-xs mt-1 block">{{ error }}</small>
    <small v-else-if="help" class="text-gray-500 text-xs mt-1 block">{{ help }}</small>
  </div>
</template>

<script setup lang="ts">
import Textarea from 'primevue/textarea'

interface Props {
  modelValue: string
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  rows?: number
  autoResize?: boolean
  error?: string
  help?: string
}

withDefaults(defineProps<Props>(), {
  label: '',
  placeholder: '',
  disabled: false,
  required: false,
  rows: 10,
  autoResize: true,
  error: '',
  help: ''
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function handleInput(event: globalThis.Event) {
  const target = event.target as globalThis.HTMLTextAreaElement
  emit('update:modelValue', target.value)
}
</script>

<style scoped>
.code-editor {
  width: 100%;
}

:deep(.p-textarea) {
  font-family: 'Courier New', Courier, monospace;
  tab-size: 2;
}
</style>
