<!-- src/components/UploadForm.vue -->
<template>
  <!-- динамический компонент в зависимости от типа -->
  <component :is="currentComponent" v-bind="currentProps" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUploadStore } from '../store'
import OlympBase from './types/OlympBase.vue'
import { getTypeConfig } from './level-system/registry/types'
import Type100500 from './types/Type100500/index.vue'

const store = useUploadStore()

const currentComponent = computed(() => {
  switch (store.uploadType) {
    case 'olymp15':
    case 'olymp31':
    case 'olymp63':
    case 'olymp127':
      return OlympBase
    case '100500':
      return Type100500
    default:
      return OlympBase
  }
})

const currentProps = computed(() => {
  const cfg = getTypeConfig(store.uploadType)
  if (cfg && cfg.category === 'olymp' && typeof cfg.totalSectors === 'number') {
    return { totalSectors: cfg.totalSectors }
  }
  return {}
})
</script>
