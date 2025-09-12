<template>
  <div class="level-footer">
    <!-- Левая область: NavigationButtons -->
    <div class="footer-left">
      <NavigationButtons />
    </div>
    
    <!-- Центральная область: FunctionalButtons -->
    <div class="footer-center">
      <FunctionalButtons />
    </div>
    
    <!-- Правая область: ActionButtons -->
    <div class="footer-right">
      <ActionButtons />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Компонент подвала с кнопками
 * Шаг 19: NavigationButtons интегрирован
 * Шаг 20: FunctionalButtons интегрирован  
 * Шаг 21: ActionButtons интегрирован (БЕЗ хардкода!)
 */
import { NavigationButtons, FunctionalButtons, ActionButtons } from '../bases/buttons'
</script>

<style scoped>
.level-footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 2rem;
}

.footer-left {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.footer-center {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-left: 1rem;
  padding-right: 1rem;
}

.footer-right {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .level-footer {
    flex-direction: column;
    align-items: stretch;
  }
  
  .footer-center {
    padding-left: 0;
    padding-right: 0;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .footer-left,
  .footer-center,
  .footer-right {
    justify-content: center;
  }
}
</style>