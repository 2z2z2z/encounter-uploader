<!-- src/components/UploadForm.vue -->
<template>
  <!-- динамический компонент в зависимости от типа -->
  <component :is="currentComponent" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUploadStore } from '../store'
import Olymp15 from './types/Olymp15/index.vue'
import Olymp31 from './types/Olymp31/index.vue'
import Olymp63 from './types/Olymp63/index.vue'
import Olymp127 from './types/Olymp127/index.vue'
import Type100500 from './types/Type100500/index.vue'

const store = useUploadStore()

const currentComponent = computed(() => {
  switch (store.uploadType) {
    case 'olymp':
      return Olymp15
    case 'olymp31':
      return Olymp31
    case 'olymp63':
      return Olymp63
    case 'olymp127':
      return Olymp127
    case '100500':
      return Type100500
    // здесь позже добавим case для других типов
    default:
      return Olymp15
  }
})
</script>
