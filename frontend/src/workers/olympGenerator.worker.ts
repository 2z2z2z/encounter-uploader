/**
 * Web Worker для генерации олимпийских макетов
 * Реализация согласно плану рефакторинга (Фаза 5.2)
 */

import { generateOlympLayout } from '../utils/olymp'

// ============================================================================
// ТИПЫ СООБЩЕНИЙ
// ============================================================================

interface GenerateLayoutMessage {
  type: 'generateLayout'
  data: {
    sectors: number
    level: string
  }
}

interface GenerateMultipleLayoutsMessage {
  type: 'generateMultipleLayouts'
  data: {
    requests: Array<{ sectors: number; level: string; id: string }>
  }
}

interface OptimizeLayoutMessage {
  type: 'optimizeLayout'
  data: {
    sectors: number
    level: string
    options: {
      minify: boolean
      compress: boolean
    }
  }
}

type WorkerMessage = GenerateLayoutMessage | GenerateMultipleLayoutsMessage | OptimizeLayoutMessage

interface WorkerResponse {
  type: string
  success: boolean
  data?: any
  error?: string
  requestId?: string
}

// ============================================================================
// ОБРАБОТЧИК СООБЩЕНИЙ
// ============================================================================

self.addEventListener('message', async (event) => {
  const message: WorkerMessage = event.data
  
  try {
    let response: WorkerResponse
    
    switch (message.type) {
      case 'generateLayout':
        response = await handleGenerateLayout(message.data)
        break
        
      case 'generateMultipleLayouts':
        response = await handleGenerateMultipleLayouts(message.data)
        break
        
      case 'optimizeLayout':
        response = await handleOptimizeLayout(message.data)
        break
        
      default:
        response = {
          type: 'error',
          success: false,
          error: 'Неизвестный тип сообщения'
        }
    }
    
    self.postMessage(response)
    
  } catch (error) {
    self.postMessage({
      type: 'error',
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    })
  }
})

// ============================================================================
// ОБРАБОТЧИКИ ЗАДАЧ
// ============================================================================

async function handleGenerateLayout(data: { sectors: number; level: string }): Promise<WorkerResponse> {
  const startTime = performance.now()
  
  try {
    const layout = generateOlympLayout(data.sectors, data.level)
    const endTime = performance.now()
    
    return {
      type: 'generateLayout',
      success: true,
      data: {
        layout,
        sectors: data.sectors,
        level: data.level,
        generationTime: endTime - startTime
      }
    }
  } catch (error) {
    return {
      type: 'generateLayout',
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка генерации макета'
    }
  }
}

async function handleGenerateMultipleLayouts(data: { requests: Array<{ sectors: number; level: string; id: string }> }): Promise<WorkerResponse> {
  const startTime = performance.now()
  const results = []
  
  for (const request of data.requests) {
    try {
      const layout = generateOlympLayout(request.sectors, request.level)
      results.push({
        id: request.id,
        success: true,
        layout,
        sectors: request.sectors,
        level: request.level
      })
    } catch (error) {
      results.push({
        id: request.id,
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка генерации'
      })
    }
    
    // Отправляем промежуточный прогресс
    self.postMessage({
      type: 'progress',
      success: true,
      data: {
        completed: results.length,
        total: data.requests.length,
        percentage: Math.round((results.length / data.requests.length) * 100)
      }
    })
  }
  
  const endTime = performance.now()
  
  return {
    type: 'generateMultipleLayouts',
    success: true,
    data: {
      results,
      totalTime: endTime - startTime,
      averageTime: (endTime - startTime) / data.requests.length
    }
  }
}

async function handleOptimizeLayout(data: { sectors: number; level: string; options: { minify: boolean; compress: boolean } }): Promise<WorkerResponse> {
  const startTime = performance.now()
  
  try {
    let layout = generateOlympLayout(data.sectors, data.level)
    
    // Оптимизация макета
    if (data.options.minify) {
      layout = minifyHtml(layout)
    }
    
    if (data.options.compress) {
      layout = compressHtml(layout)
    }
    
    const endTime = performance.now()
    
    return {
      type: 'optimizeLayout',
      success: true,
      data: {
        layout,
        sectors: data.sectors,
        level: data.level,
        optimized: true,
        optimizationTime: endTime - startTime,
        originalSize: generateOlympLayout(data.sectors, data.level).length,
        optimizedSize: layout.length
      }
    }
  } catch (error) {
    return {
      type: 'optimizeLayout',
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка оптимизации'
    }
  }
}

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

function minifyHtml(html: string): string {
  return html
    .replace(/\s+/g, ' ')           // Заменяем множественные пробелы одним
    .replace(/>\s+</g, '><')        // Убираем пробелы между тегами
    .replace(/\s+>/g, '>')          // Убираем пробелы перед закрывающими скобками
    .replace(/<\s+/g, '<')          // Убираем пробелы после открывающих скобок
    .trim()
}

function compressHtml(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, '') // Убираем HTML комментарии
    .replace(/\n\s*/g, '')          // Убираем переносы строк и отступы
    .replace(/\s{2,}/g, ' ')        // Заменяем множественные пробелы одним
    .trim()
}

// ============================================================================
// УВЕДОМЛЕНИЕ О ГОТОВНОСТИ
// ============================================================================

self.postMessage({
  type: 'ready',
  success: true,
  data: {
    workerName: 'olympGenerator',
    capabilities: ['generateLayout', 'generateMultipleLayouts', 'optimizeLayout'],
    version: '1.0.0'
  }
})

