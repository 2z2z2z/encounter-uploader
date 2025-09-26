<template>
  <div
    class="level-footer mt-10 gap-x-10 gap-y-5 flex flex-wrap justify-between"
    data-tour="level-footer"
  >
    <!-- Левая область: NavigationButtons -->
    <div class="footer-left" data-tour="navigation-buttons">
      <NavigationButtons />
    </div>
    
    <!-- Центральная область: FunctionalButtons -->
    <div class="footer-center" data-tour="functional-buttons">
      <FunctionalButtons />
    </div>
    
    <!-- Правая область: ActionButtons -->
    <div class="footer-right" data-tour="action-buttons">
      <ActionButtons />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { NavigationButtons, FunctionalButtons, ActionButtons } from '@/components/ui/buttons'
</script>
