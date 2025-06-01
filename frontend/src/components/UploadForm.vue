<!-- src/components/UploadForm.vue -->
<template>
  <!-- динамический компонент в зависимости от типа -->
  <component :is="currentComponent" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUploadStore } from '../store'
import Olymp15 from './types/Olymp15/index.vue'

const store = useUploadStore()

const currentComponent = computed(() => {
  switch (store.uploadType) {
    case 'olymp':
      return Olymp15
    // здесь позже добавим case для других типов
    default:
      return Olymp15
  }
})
</script>
