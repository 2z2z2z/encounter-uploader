<template>
  <div class="default-table">
    <div class="table-container">
      <table class="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Варианты ответов</th>
            <th>В секторах</th>
            <th>В бонусах</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in data" :key="item.id || index" class="table-row">
            <td>{{ index + 1 }}</td>
            <td>
              <input 
                v-model="item.variants[0]" 
                type="text" 
                class="input-field"
                placeholder="Введите ответ..."
                @input="updateData"
              />
            </td>
            <td>
              <input 
                type="checkbox" 
                v-model="item.inSector"
                @change="updateData"
              />
            </td>
            <td>
              <input 
                type="checkbox" 
                v-model="item.inBonus"
                @change="updateData"
              />
            </td>
            <td>
              <button 
                @click="removeRow(index)"
                class="btn-remove"
                title="Удалить строку"
              >
                ❌
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div class="table-actions">
        <button @click="addRow" class="btn btn-primary">
          ➕ Добавить строку
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface TableItem {
  id?: string | number
  variants: string[]
  inSector?: boolean
  inBonus?: boolean
  [key: string]: any
}

interface Props {
  data: TableItem[]
  config?: Record<string, any>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:data': [data: TableItem[]]
}>()

function updateData() {
  emit('update:data', props.data)
}

function addRow() {
  const newRow: TableItem = {
    id: Date.now(),
    variants: [''],
    inSector: true,
    inBonus: false
  }
  
  const updatedData = [...props.data, newRow]
  emit('update:data', updatedData)
}

function removeRow(index: number) {
  if (confirm('Удалить эту строку?')) {
    const updatedData = props.data.filter((_, i) => i !== index)
    emit('update:data', updatedData)
  }
}
</script>

<style scoped>
.default-table {
  width: 100%;
  margin: 1rem 0;
}

.table-container {
  border: 1px solid #e5e5e5;
  border-radius: 0.5rem;
  overflow: hidden;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e5e5;
}

.table th {
  background: #f9f9f9;
  font-weight: 600;
  color: #374151;
}

.table-row:hover {
  background: #f9f9f9;
}

.input-field {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.input-field:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}

.btn-remove {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
}

.btn-remove:hover {
  background: #fee2e2;
}

.table-actions {
  padding: 1rem;
  background: #f9f9f9;
  border-top: 1px solid #e5e5e5;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}
</style>

