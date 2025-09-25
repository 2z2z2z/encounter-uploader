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
  click: [event: globalThis.MouseEvent]
}>()

type ButtonVariant = NonNullable<Props['variant']>
type ButtonSeverity = 'secondary' | 'success' | 'info' | 'warn' | 'danger' | undefined

const severity = computed(() => {
  const severityMap: Record<ButtonVariant, ButtonSeverity> = {
    primary: undefined,
    secondary: 'secondary',
    success: 'success',
    danger: 'danger',
    warning: 'warn',
    info: 'info'
  }
  return severityMap[props.variant]
})

const buttonClass = computed(() => {
  const classes = [props.class]
  if (props.fullWidth) {
    classes.push('w-full')
  }
  return classes.join(' ')
})
</script>
