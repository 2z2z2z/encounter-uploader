<template>
  <div class="version-label">
    v{{ version }}
  </div>
</template>

<script setup lang="ts">
// Версия сервиса - легко изменяется здесь
const version = '1.1.1 (последнее обновление 13/08/2025)'
</script>

<style scoped>
.version-label {
  position: relative;
  text-align: center;
  padding: 20px 0;
  font-size: 10px;
  color: rgba(107, 114, 128, 0.3); /* Очень полупрозрачный серый */
  font-family: 'Courier New', monospace;
  user-select: none; /* Нельзя выделить */
  transition: opacity 0.3s ease;
}

/* Показывается чуть больше при наведении */
.version-label:hover {
  opacity: 1;
  color: rgba(107, 114, 128, 0.6);
}

/* На мобильных устройствах делаем ещё меньше */
@media (max-width: 768px) {
  .version-label {
    font-size: 8px;
    padding: 16px 0;
  }
}
</style> 