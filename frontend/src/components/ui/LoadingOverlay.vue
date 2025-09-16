<template>
  <div v-if="visible" class="loading-overlay">
    <div class="loading-content">
      <ProgressSpinner 
        :style="{ width: spinnerSize, height: spinnerSize }"
        stroke-width="4"
      />
      <div v-if="text" class="loading-text">{{ text }}</div>
      <ProgressBar 
        v-if="showProgress && progress !== null"
        :value="progress"
        class="loading-progress"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ProgressSpinner from 'primevue/progressspinner'
import ProgressBar from 'primevue/progressbar'

interface Props {
  visible?: boolean
  text?: string
  progress?: number | null
  showProgress?: boolean
  spinnerSize?: string
}

withDefaults(defineProps<Props>(), {
  visible: false,
  text: '',
  showProgress: false,
  spinnerSize: '50px',
  progress: null
})
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.loading-content {
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  min-width: 200px;
}

.loading-text {
  font-size: 1rem;
  color: #333;
}

.loading-progress {
  width: 100%;
  min-width: 200px;
}
</style>
