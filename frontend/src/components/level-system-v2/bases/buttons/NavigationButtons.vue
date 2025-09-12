<template>
  <div class="navigation-buttons">
    <Button
      @click="handleBackNavigation"
      icon="pi pi-arrow-left"
      label="Назад"
      text
      class="p-button-secondary navigation-back-button"
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

.navigation-back-button {
  min-width: 120px;
  padding: 0.75rem 1rem;
}

/* Адаптивность для мобильных устройств */
@media (max-width: 768px) {
  .navigation-back-button {
    min-width: auto;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }
  
  .navigation-buttons {
    gap: 0.5rem;
  }
}

/* Состояния для улучшенного UX */
.navigation-back-button:hover {
  transform: translateX(-2px);
  transition: transform 0.2s ease;
}

.navigation-back-button:focus {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  outline: none;
}
</style>