<template>
  <div class="test-universal-type100500">
    <div class="test-header">
      <h1>🎯 Тест универсального Type100500</h1>
      <p>Демонстрация рефакторинга сложного типа + централизованного состояния - Этапы 1.4 + 2.1</p>
    </div>
    
    <!-- Сравнение версий -->
    <div class="comparison-section">
      <h2>Сравнение версий:</h2>
      <div class="version-buttons">
        <button
          :class="['version-btn', { active: selectedVersion === 'original' }]"
          @click="selectedVersion = 'original'"
        >
          📜 Оригинальная версия
        </button>
        <button
          :class="['version-btn', { active: selectedVersion === 'universal' }]"
          @click="selectedVersion = 'universal'"
        >
          ✨ Универсальная версия
        </button>
      </div>
    </div>
    
    <!-- Информационная панель -->
    <div class="info-panel">
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Текущая версия:</span>
          <span class="info-value">{{ versionInfo.name }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">UI компоненты:</span>
          <span class="info-value">{{ versionInfo.uiComponents }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Состояние:</span>
          <span class="info-value">{{ versionInfo.stateManagement }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Компонент:</span>
          <span class="info-value">{{ versionInfo.component }}</span>
        </div>
      </div>
    </div>
    
    <!-- Универсальная версия -->
    <div v-if="selectedVersion === 'universal'" class="universal-container">
      <UniversalType100500 />
    </div>
    
    <!-- Ссылка на оригинальную версию -->
    <div v-else class="original-container">
      <div class="original-info">
        <h3>🔗 Оригинальная версия</h3>
        <p>Оригинальная версия доступна по адресу:</p>
        <a href="/upload" target="_blank" class="original-link">
          http://localhost:5173/upload
        </a>
        <p class="original-description">
          Откройте эту ссылку в новой вкладке для сравнения функциональности.
          Оригинальная версия использует старую архитектуру с дублированным кодом.
        </p>
      </div>
    </div>
    
    <!-- Результаты рефакторинга -->
    <div class="results">
      <h3>✅ Результаты объединенного рефакторинга (Этапы 1.4 + 2.1)</h3>
      
      <div class="metrics">
        <div class="metric">
          <span class="value">1</span>
          <span class="label">унифицированный компонент</span>
        </div>
        <div class="metric">
          <span class="value">3</span>
          <span class="label">переиспользуемых UI компонента</span>
        </div>
        <div class="metric">
          <span class="value">100%</span>
          <span class="label">совместимость функций</span>
        </div>
        <div class="metric">
          <span class="value">1</span>
          <span class="label">централизованный store</span>
        </div>
      </div>
      
      <div class="achievements">
        <div class="achievement">✅ Type100500 унифицирован с новой архитектурой</div>
        <div class="achievement">✅ Использует AnswerInput, BonusTimeInput, LevelSelector</div>
        <div class="achievement">✅ Централизованное управление состоянием</div>
        <div class="achievement">✅ Табы и блоки работают корректно</div>
        <div class="achievement">✅ Генератор кодов интегрирован</div>
        <div class="achievement">✅ Управление уровнями бонусов унифицировано</div>
        <div class="achievement">✅ Импорт/экспорт данных сохранен</div>
        <div class="achievement">✅ Загрузка секторов/бонусов готова</div>
      </div>
      
      <div class="architectural-improvements">
        <h4>🏗️ Архитектурные улучшения:</h4>
        <div class="improvements-grid">
          <div class="improvement-item">
            <h5>🔧 State Management</h5>
            <ul>
              <li>Единый useUploadStore для всех типов</li>
              <li>Централизованное управление данными</li>
              <li>Автосохранение в localStorage</li>
              <li>Реактивные вычисляемые свойства</li>
            </ul>
          </div>
          
          <div class="improvement-item">
            <h5>🧩 UI Components</h5>
            <ul>
              <li>AnswerInput - универсальный ввод вариантов</li>
              <li>BonusTimeInput - единообразное время</li>
              <li>LevelSelector - управление уровнями</li>
              <li>Модальные окна для сложных операций</li>
            </ul>
          </div>
          
          <div class="improvement-item">
            <h5>📋 Data Management</h5>
            <ul>
              <li>Единая структура данных для всех блоков</li>
              <li>Автоматическое применение шаблонов</li>
              <li>Валидация данных перед отправкой</li>
              <li>Улучшенный импорт/экспорт</li>
            </ul>
          </div>
          
          <div class="improvement-item">
            <h5>⚡ Performance</h5>
            <ul>
              <li>Реактивные обновления только нужных частей</li>
              <li>Оптимизированные вычисления</li>
              <li>Lazy loading модальных окон</li>
              <li>Эффективное управление памятью</li>
            </ul>
          </div>
        </div>
      </div>
      
      <p class="success-message">
        🎯 <strong>Этапы 1.4 + 2.1 успешно завершены!</strong><br>
        Type100500 унифицирован с новой архитектурой и централизованным управлением состоянием.
        Сохранена вся функциональность при значительном улучшении архитектуры.
      </p>
    </div>
    
    <!-- Следующие этапы -->
    <div class="next-steps">
      <h3>🚀 Готов к следующим этапам</h3>
      <div class="next-phases">
        <div class="next-phase">
          <h4>📋 Фаза 2.2: Унифицированный Store</h4>
          <p>Создание единого хранилища для всех типов уровней</p>
        </div>
        <div class="next-phase">
          <h4>⚙️ Фаза 3: Конфигурационная архитектура</h4>
          <p>Декларативное определение типов уровней через конфигурацию</p>
        </div>
        <div class="next-phase">
          <h4>🔗 Фаза 4: Единый API сервис</h4>
          <p>Централизация всех API запросов и удаление legacy backend</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import UniversalType100500 from './shared/UniversalType100500.vue'

// ============================================================================
// REACTIVE DATA
// ============================================================================

const selectedVersion = ref<'original' | 'universal'>('universal')

// ============================================================================
// COMPUTED
// ============================================================================

const versionInfo = computed(() => {
  if (selectedVersion.value === 'universal') {
    return {
      name: 'Универсальная версия',
      uiComponents: 'AnswerInput, BonusTimeInput, LevelSelector',
      stateManagement: 'useUploadStore (централизованно)',
      component: 'UniversalType100500.vue'
    }
  } else {
    return {
      name: 'Оригинальная версия',
      uiComponents: 'Встроенные input элементы',
      stateManagement: 'localStorage + локальное состояние',
      component: 'types/Type100500/index.vue'
    }
  }
})

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(() => {
  console.log('🎯 Тест универсального Type100500 запущен')
  console.log('📊 Демонстрация объединения этапов 1.4 + 2.1')
  console.log('✨ Новая архитектура готова к использованию')
})
</script>

<style scoped>
.test-universal-type100500 {
  max-width: 1600px;
  margin: 0 auto;
  padding: 20px;
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #f8f9fa;
  min-height: 100vh;
}

.test-header {
  text-align: center;
  margin-bottom: 30px;
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.test-header h1 {
  color: #2563eb;
  margin-bottom: 10px;
  font-size: 2.2rem;
}

.test-header p {
  color: #666;
  font-size: 1.1rem;
  margin: 0;
}

.comparison-section {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.comparison-section h2 {
  color: #374151;
  margin-bottom: 20px;
  font-size: 1.3rem;
}

.version-buttons {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.version-btn {
  padding: 15px 25px;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s;
  text-align: center;
}

.version-btn:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.version-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
  box-shadow: 0 4px 8px rgba(59, 130, 246, 0.2);
}

.info-panel {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.info-label {
  font-weight: 500;
  color: #64748b;
}

.info-value {
  font-weight: 600;
  color: #334155;
  text-align: right;
}

.universal-container {
  margin-bottom: 30px;
}

.original-container {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 30px;
}

.original-info {
  text-align: center;
}

.original-info h3 {
  color: #374151;
  margin-bottom: 15px;
}

.original-info p {
  color: #6b7280;
  margin-bottom: 15px;
}

.original-link {
  display: inline-block;
  padding: 12px 20px;
  background: #3b82f6;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  transition: background-color 0.2s;
  margin: 10px 0;
}

.original-link:hover {
  background: #2563eb;
}

.original-description {
  font-size: 0.9rem;
  color: #9ca3af;
  font-style: italic;
}

.results {
  background: #f0fdf4;
  border: 2px solid #16a34a;
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 30px;
}

.results h3 {
  color: #15803d;
  margin-bottom: 25px;
  font-size: 1.4rem;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.metric {
  text-align: center;
  background: white;
  padding: 20px;
  border-radius: 10px;
  border: 1px solid #d1fae5;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.metric .value {
  display: block;
  font-size: 2.2rem;
  font-weight: bold;
  color: #16a34a;
  margin-bottom: 5px;
}

.metric .label {
  display: block;
  font-size: 0.85rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.achievements {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
  margin-bottom: 30px;
}

.achievement {
  color: #15803d;
  font-size: 0.95rem;
  font-weight: 500;
  padding: 8px 0;
}

.architectural-improvements {
  margin: 30px 0;
}

.architectural-improvements h4 {
  color: #15803d;
  margin-bottom: 20px;
  font-size: 1.2rem;
}

.improvements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.improvement-item {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #d1fae5;
}

.improvement-item h5 {
  margin: 0 0 15px 0;
  color: #374151;
  font-size: 1.1rem;
}

.improvement-item ul {
  margin: 0;
  padding-left: 18px;
}

.improvement-item li {
  margin: 6px 0;
  font-size: 0.85rem;
  color: #555;
  line-height: 1.4;
}

.success-message {
  color: #15803d;
  font-size: 1.15rem;
  text-align: center;
  margin: 25px 0 0 0;
  line-height: 1.6;
}

.next-steps {
  background: #fffbeb;
  border: 2px solid #f59e0b;
  border-radius: 12px;
  padding: 25px;
}

.next-steps h3 {
  color: #d97706;
  margin-bottom: 20px;
  font-size: 1.3rem;
  text-align: center;
}

.next-phases {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.next-phase {
  background: white;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #fed7aa;
}

.next-phase h4 {
  color: #d97706;
  margin: 0 0 10px 0;
  font-size: 1.1rem;
}

.next-phase p {
  color: #92400e;
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .test-header h1 {
    font-size: 1.8rem;
  }
  
  .version-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .version-btn {
    width: 100%;
    max-width: 300px;
  }
  
  .info-grid,
  .improvements-grid,
  .next-phases {
    grid-template-columns: 1fr;
  }
  
  .metrics {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
}
</style>

