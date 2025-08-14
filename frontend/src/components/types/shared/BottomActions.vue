<template>
  <div class="flex flex-wrap justify-between gap-2 mt-8">
    <div class="flex flex-wrap gap-2">
      <slot name="left" />
    </div>
    <div class="flex flex-wrap gap-2 px-4">
      <slot name="middle" />
    </div>
    <div class="flex flex-wrap gap-2 items-center">
      <slot name="right" />
    </div>
  </div>
</template>

<script setup lang="ts">
// Лишь layout-компонент под нижнюю панель действий
</script>

<script lang="ts">
export default {}
</script>


