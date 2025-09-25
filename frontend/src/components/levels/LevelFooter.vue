<template>
  <div class="level-footer mt-10 gap-x-10 gap-y-5 flex flex-wrap justify-between">
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
import { NavigationButtons, FunctionalButtons, ActionButtons } from '@/components/ui/buttons'
</script>
