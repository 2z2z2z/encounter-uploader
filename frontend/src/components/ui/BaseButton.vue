<template>
  <Button
    :class="buttonClass"
    :severity="severity"
    :size="size"
    :disabled="disabled || loading"
    :loading="loading"
    @click="$emit('click', $event)"
  >
    <slot />
  </Button>
</template>

<script setup lang="ts">
import Button from 'primevue/button'
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
  size?: 'small' | 'large'
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: undefined,
  disabled: false,
  loading: false,
  fullWidth: false,
  class: ''
})

defineEmits<{
  click: [event: MouseEvent]
}>()

const severity = computed(() => {
  const severityMap = {
    primary: null,
    secondary: 'secondary',
    success: 'success',
    danger: 'danger',
    warning: 'warn',
    info: 'info'
  }
  return severityMap[props.variant] as any
})

const buttonClass = computed(() => {
  const classes = [props.class]
  if (props.fullWidth) {
    classes.push('w-full')
  }
  return classes.join(' ')
})
</script>
