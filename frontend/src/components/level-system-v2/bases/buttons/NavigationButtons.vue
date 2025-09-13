<template>
  <div class="navigation-buttons flex flex-wrap gap-2">
    <Button
      @click="handleBackNavigation"
      icon="pi pi-arrow-left"
      label="Назад"
      severity="secondary"
      text
      class="h-10 px-4 text-nowrap max-xs:w-full"
      :aria-label="backButtonAriaLabel"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'

const router = useRouter()

// Aria label для доступности
const backButtonAriaLabel = computed(() => {
  return 'Вернуться к предыдущей странице или настройкам'
})

/**
 * Обработка навигации назад
 * Использует router.back() если есть история, иначе переходит к настройкам
 */
const handleBackNavigation = () => {
  // Проверяем есть ли история браузера для возврата
  if (globalThis.history.length > 1) {
    router.back()
  } else {
    // Fallback - переходим к настройкам как к логичной отправной точке
    router.push('/settings')
  }
}
</script>
