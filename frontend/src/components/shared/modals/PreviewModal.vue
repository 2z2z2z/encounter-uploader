<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">Предпросмотр данных</h2>
        <button @click="closeModal" class="modal-close">❌</button>
      </div>
      
      <div class="modal-body">
        <div class="preview-section">
          <h3 class="section-title">Тип: {{ type?.name || 'Неизвестный' }}</h3>
          <p class="section-subtitle">{{ type?.description || '' }}</p>
          
          <div class="data-preview">
            <h4 class="data-title">Данные ({{ data?.length || 0 }} элементов):</h4>
            
            <div v-if="data && data.length > 0" class="data-list">
              <div 
                v-for="(item, index) in previewData" 
                :key="item.id || index"
                class="data-item"
              >
                <div class="item-number">{{ index + 1 }}</div>
                <div class="item-content">
                  <div class="item-variants">
                    <strong>Варианты:</strong> 
                    {{ Array.isArray(item.variants) ? item.variants.join(', ') : 'Нет вариантов' }}
                  </div>
                  <div class="item-flags">
                    <span v-if="item.inSector" class="flag flag-sector">Сектор</span>
                    <span v-if="item.inBonus" class="flag flag-bonus">Бонус</span>
                  </div>
                  <div v-if="item.sectorName" class="item-extra">
                    <small>Имя сектора: {{ item.sectorName }}</small>
                  </div>
                  <div v-if="item.bonusName" class="item-extra">
                    <small>Имя бонуса: {{ item.bonusName }}</small>
                  </div>
                </div>
              </div>
            </div>
            
            <div v-else class="no-data">
              <p>Нет данных для предпросмотра</p>
            </div>
            
            <div v-if="data && data.length > maxPreviewItems" class="more-items">
              ... и еще {{ data.length - maxPreviewItems }} элементов
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button @click="closeModal" class="btn btn-secondary">Закрыть</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface PreviewItem {
  id?: string | number
  variants?: string[]
  inSector?: boolean
  inBonus?: boolean
  sectorName?: string
  bonusName?: string
  [key: string]: any
}

interface PreviewType {
  name: string
  description?: string
  [key: string]: any
}

interface Props {
  show?: boolean
  data?: PreviewItem[]
  type?: PreviewType
  maxPreviewItems?: number
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  maxPreviewItems: 10
})

const emit = defineEmits<{
  'close': []
}>()

const previewData = computed(() => {
  if (!props.data) return []
  return props.data.slice(0, props.maxPreviewItems)
})

function closeModal() {
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e5e5;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.modal-close {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.section-subtitle {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.data-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1rem;
}

.data-list {
  space-y: 1rem;
}

.data-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e5e5e5;
  border-radius: 0.5rem;
  background: #f9f9f9;
}

.item-number {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.item-content {
  flex: 1;
}

.item-variants {
  margin-bottom: 0.5rem;
  word-break: break-word;
}

.item-flags {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.flag {
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.flag-sector {
  background: #dbeafe;
  color: #1e40af;
}

.flag-bonus {
  background: #fef3c7;
  color: #92400e;
}

.item-extra {
  color: #6b7280;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.no-data {
  text-align: center;
  color: #6b7280;
  font-style: italic;
  padding: 2rem;
}

.more-items {
  text-align: center;
  color: #6b7280;
  font-style: italic;
  margin-top: 1rem;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e5e5;
  display: flex;
  justify-content: flex-end;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

/* Responsive */
@media (max-width: 640px) {
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
  
  .data-item {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .item-number {
    align-self: flex-start;
  }
}
</style>

