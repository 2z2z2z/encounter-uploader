<template>
  <div class="navigation-buttons">
    <Button
      @click="handleBackNavigation"
      icon="pi pi-arrow-left"
      label="Назад"
      severity="secondary"
      text
      class="h-10 px-4"
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

<style scoped>
/**
 * Стилизация навигационных кнопок
 * Без @apply для совместимости с TailwindCSS v4
 */
.navigation-buttons {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}


/* Адаптивность для мобильных устройств */
@media (max-width: 768px) {
  .navigation-buttons {
    gap: 0.5rem;
  }
}
</style>