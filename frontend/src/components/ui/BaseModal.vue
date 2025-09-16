<template>
  <Dialog
    v-model:visible="visible"
    :modal="true"
    :header="header"
    :style="{ width: width }"
    :closable="closable"
    :draggable="draggable"
    :maximizable="maximizable"
    :position="position"
    @hide="handleHide"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>

    <slot />

    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import Dialog from 'primevue/dialog'
import { computed } from 'vue'

interface Props {
  modelValue: boolean
  header?: string
  width?: string
  closable?: boolean
  draggable?: boolean
  maximizable?: boolean
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right' | 'topleft' | 'topright' | 'bottomleft' | 'bottomright'
}

const props = withDefaults(defineProps<Props>(), {
  header: '',
  width: '50vw',
  closable: true,
  draggable: false,
  maximizable: false,
  position: 'center'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'hide': []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
})

function handleHide() {
  emit('hide')
}
</script>
