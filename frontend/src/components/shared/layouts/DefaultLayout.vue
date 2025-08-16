<template>
  <div class="default-layout">
    <div class="layout-message">
      <h3>🔧 Разработка в процессе</h3>
      <p>Этот тип уровня использует стандартный макет.</p>
      <p>Конфигурация: <strong>{{ config.name }}</strong></p>
      <p>Категория: <strong>{{ config.category }}</strong></p>
      
      <div class="placeholder-content">
        <div class="answers-placeholder">
          <h4>Ответы ({{ answers.length }})</h4>
          <div v-for="answer in answers" :key="answer.id" class="answer-item">
            <span class="answer-id">{{ answer.id }}</span>
            <span class="answer-variants">{{ answer.variants.join(', ') }}</span>
          </div>
        </div>
        
        <div class="actions-placeholder">
          <button @click="$emit('add-answer')" class="action-btn">+ Добавить ответ</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { LevelTypeConfig, UniversalAnswer } from '../../../types/level-system'

interface Props {
  config: LevelTypeConfig
  answers: UniversalAnswer[]
}

interface Emits {
  (e: 'update:answers', value: UniversalAnswer[]): void
  (e: 'add-answer'): void
  (e: 'remove-answer', id: string | number): void
  (e: 'duplicate-answer', id: string | number): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<style scoped>
.default-layout {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.layout-message {
  text-align: center;
  padding: 40px;
  max-width: 500px;
}

.layout-message h3 {
  color: #6b7280;
  margin-bottom: 15px;
}

.layout-message p {
  color: #9ca3af;
  margin-bottom: 10px;
}

.placeholder-content {
  margin-top: 30px;
  text-align: left;
}

.answers-placeholder {
  margin-bottom: 20px;
}

.answers-placeholder h4 {
  color: #374151;
  margin-bottom: 15px;
}

.answer-item {
  display: flex;
  gap: 10px;
  padding: 8px;
  background: #f9fafb;
  border-radius: 4px;
  margin-bottom: 5px;
}

.answer-id {
  font-weight: 500;
  color: #6b7280;
  width: 40px;
}

.answer-variants {
  color: #374151;
}

.action-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.action-btn:hover {
  background: #2563eb;
}
</style>

