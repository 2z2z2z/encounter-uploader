<template>
  <Toast position="top-right" />
</template>

<script setup lang="ts">
import Toast from 'primevue/toast'
import { onMounted } from 'vue'
import { useNotification } from '@/composables/useNotification'

// Глобальная регистрация для удобства
onMounted(() => {
  window.$notify = useNotification()
})
</script>

<style>
/* Кастомизация стилей Toast если нужно */
</style>
