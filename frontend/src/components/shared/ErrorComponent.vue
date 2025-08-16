<!--
  ErrorComponent - компонент для отображения ошибок загрузки типов
  Fallback для динамической загрузки компонентов
-->

<template>
  <div class="error-component">
    <div class="error-content">
      <div class="error-icon">⚠️</div>
      
      <h2 class="error-title">Компонент не найден</h2>
      
      <p class="error-message">
        Тип уровня "<strong>{{ type }}</strong>" не найден или не может быть загружен.
      </p>
      
      <div class="error-details">
        <details>
          <summary>Подробности</summary>
          <ul>
            <li>Запрошенный тип: <code>{{ type }}</code></li>
            <li>Доступные типы: <code>{{ availableTypes.join(', ') }}</code></li>
            <li>Время ошибки: {{ errorTime }}</li>
            <li v-if="error">Ошибка: {{ error.message }}</li>
          </ul>
        </details>
      </div>
      
      <div class="error-actions">
        <button @click="goBack" class="action-button primary">
          ← Назад
        </button>
        
        <button @click="goHome" class="action-button secondary">
          🏠 На главную
        </button>
        
        <button @click="retryLoad" class="action-button accent">
          🔄 Повторить
        </button>
      </div>
      
      <div class="suggestions">
        <h3>Возможные решения:</h3>
        <ul>
          <li>Проверьте правильность URL</li>
          <li>Убедитесь, что тип уровня существует</li>
          <li>Попробуйте обновить страницу</li>
          <li v-if="suggestedTypes.length > 0">
            Возможно, вы имели в виду:
            <ul>
              <li v-for="suggested in suggestedTypes" :key="suggested">
                <router-link :to="`/upload/${suggested}`" class="suggestion-link">
                  {{ suggested }}
                </router-link>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getAvailableTypes, getLoadingStats } from '../../router/dynamic-loader'

// ============================================================================
// PROPS
// ============================================================================

const props = withDefaults(defineProps<{
  type?: string
  error?: Error
  showSuggestions?: boolean
}>(), {
  type: '',
  showSuggestions: true
})

// ============================================================================
// ROUTER
// ============================================================================

const router = useRouter()
const route = useRoute()

// ============================================================================
// COMPUTED
// ============================================================================

const currentType = computed(() => 
  props.type || route.params.type?.toString() || 'unknown'
)

const availableTypes = computed(() => getAvailableTypes())

const errorTime = computed(() => new Date().toLocaleString('ru-RU'))

// Предложения похожих типов
const suggestedTypes = computed(() => {
  if (!props.showSuggestions) return []
  
  const current = currentType.value.toLowerCase()
  const available = availableTypes.value
  
  // Ищем похожие типы по названию
  const similar = available.filter(type => {
    const typeLower = type.toLowerCase()
    return typeLower.includes(current) || current.includes(typeLower) ||
           levenshteinDistance(current, typeLower) <= 3
  })
  
  return similar.slice(0, 5) // Максимум 5 предложений
})

// ============================================================================
// МЕТОДЫ
// ============================================================================

function goBack() {
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    goHome()
  }
}

function goHome() {
  router.push('/')
}

function retryLoad() {
  // Перезагружаем текущий маршрут
  router.go(0)
}

// Простой алгоритм Левенштейна для поиска похожих строк
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array.from({ length: str1.length + 1 }, () => 
    Array.from({ length: str2.length + 1 }, () => 0)
  )
  
  for (let i = 0; i <= str1.length; i++) matrix[i][0] = i
  for (let j = 0; j <= str2.length; j++) matrix[0][j] = j
  
  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      )
    }
  }
  
  return matrix[str1.length][str2.length]
}

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(() => {
  console.error(`❌ [ErrorComponent] Component not found: ${currentType.value}`)
  console.info('📊 [ErrorComponent] Loading stats:', getLoadingStats())
})
</script>

<style scoped>
.error-component {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fee2e2 0%, #fef3c7 100%);
  padding: 2rem;
}

.error-content {
  max-width: 600px;
  background: white;
  border-radius: 1rem;
  padding: 2.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  text-align: center;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-title {
  color: #dc2626;
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.error-message {
  color: #374151;
  font-size: 1.125rem;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.error-details {
  margin-bottom: 2rem;
  text-align: left;
}

.error-details summary {
  cursor: pointer;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 1rem;
  list-style: none;
}

.error-details summary::-webkit-details-marker {
  display: none;
}

.error-details summary::before {
  content: '▶ ';
  margin-right: 0.5rem;
  transition: transform 0.2s;
}

.error-details[open] summary::before {
  transform: rotate(90deg);
}

.error-details ul {
  margin-left: 1rem;
  margin-top: 0.5rem;
}

.error-details li {
  margin-bottom: 0.5rem;
  color: #4b5563;
  font-size: 0.875rem;
}

.error-details code {
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.action-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.action-button.primary {
  background: #3b82f6;
  color: white;
}

.action-button.primary:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.action-button.secondary {
  background: #6b7280;
  color: white;
}

.action-button.secondary:hover {
  background: #4b5563;
  transform: translateY(-1px);
}

.action-button.accent {
  background: #10b981;
  color: white;
}

.action-button.accent:hover {
  background: #059669;
  transform: translateY(-1px);
}

.suggestions {
  text-align: left;
  background: #f9fafb;
  border-radius: 0.5rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
}

.suggestions h3 {
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.suggestions ul {
  margin-left: 1.25rem;
}

.suggestions li {
  margin-bottom: 0.5rem;
  color: #4b5563;
  font-size: 0.875rem;
}

.suggestion-link {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  background: #dbeafe;
  transition: all 0.2s;
}

.suggestion-link:hover {
  background: #bfdbfe;
  text-decoration: underline;
}

@media (max-width: 640px) {
  .error-component {
    padding: 1rem;
  }
  
  .error-content {
    padding: 1.5rem;
  }
  
  .error-actions {
    flex-direction: column;
  }
  
  .action-button {
    width: 100%;
  }
}
</style>

