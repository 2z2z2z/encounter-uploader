<template>
  <div class="level-controls mb-6">
    <!-- Контролы на основе capabilities -->
    <div v-if="capabilities && capabilities.length" class="controls-section">
      <h3 class="text-lg font-semibold mb-3">Настройки</h3>
      
      <div class="controls-grid grid gap-4">
        <!-- Task control -->
        <div v-if="hasCapability('task')" class="control-item">
          <label class="block text-sm font-medium mb-1">HTML задание</label>
          <textarea 
            v-model="config.task" 
            class="w-full p-2 border rounded"
            rows="3"
            placeholder="Введите HTML код задания..."
          />
        </div>
        
        <!-- Sectors control -->
        <div v-if="hasCapability('sectors')" class="control-item">
          <label class="block text-sm font-medium mb-1">Режим секторов</label>
          <select v-model="config.sectorMode" class="w-full p-2 border rounded">
            <option value="all">Все сектора</option>
            <option value="initialAndFinal">Первая половина + финал</option>
            <option value="finalOnly">Только финальный</option>
            <option value="custom">Настраиваемый</option>
          </select>
        </div>
        
        <!-- Bonuses control -->
        <div v-if="hasCapability('bonuses')" class="control-item">
          <label class="flex items-center">
            <input 
              type="checkbox" 
              v-model="config.enableBonuses" 
              class="mr-2"
            />
            <span class="text-sm">Включить бонусы</span>
          </label>
        </div>
        
        <!-- Tabs control -->
        <div v-if="hasCapability('tabs')" class="control-item">
          <label class="flex items-center">
            <input 
              type="checkbox" 
              v-model="config.enableTabs" 
              class="mr-2"
            />
            <span class="text-sm">Использовать табы</span>
          </label>
        </div>
        
        <!-- Delay control -->
        <div v-if="hasCapability('delay')" class="control-item">
          <label class="flex items-center">
            <input 
              type="checkbox" 
              v-model="config.enableDelay" 
              class="mr-2"
            />
            <span class="text-sm">Включить задержки</span>
          </label>
        </div>
        
        <!-- Limits control -->
        <div v-if="hasCapability('limit')" class="control-item">
          <label class="flex items-center">
            <input 
              type="checkbox" 
              v-model="config.enableLimits" 
              class="mr-2"
            />
            <span class="text-sm">Включить ограничения времени</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface LevelCapability {
  type: string
  required: boolean
  config?: any
}

interface Props {
  capabilities: LevelCapability[]
  config: Record<string, any>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:config': [config: Record<string, any>]
}>()

const config = computed({
  get: () => props.config,
  set: (value) => emit('update:config', value)
})

function hasCapability(type: string): boolean {
  return props.capabilities?.some(cap => cap.type === type) || false
}
</script>

<style scoped>
.controls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.control-item {
  padding: 1rem;
  border: 1px solid #e5e5e5;
  border-radius: 0.5rem;
  background: #f9f9f9;
}

.control-item label {
  display: block;
  margin-bottom: 0.5rem;
}

.control-item input,
.control-item select,
.control-item textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 0.25rem;
}

.control-item input[type="checkbox"] {
  width: auto;
  margin-right: 0.5rem;
}
</style>

