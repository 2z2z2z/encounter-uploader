<template>
  <div class="min-h-screen bg-blue-50 py-8">
    <div :class="['container mx-auto bg-white p-12 rounded-md shadow-sm', maxWidthClass]">
      <h1 class="text-2xl font-semibold text-center">
        {{ title }}
      </h1>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ title: string; maxWidthClass?: string }>(), {
  maxWidthClass: 'max-w-[120rem]'
})
const { title, maxWidthClass } = props
</script>

<script lang="ts">
export default {}
</script>


