/**
 * Web Worker для генерации кодов
 * Реализация согласно плану рефакторинга (Фаза 5.2)
 */

// ============================================================================
// ТИПЫ СООБЩЕНИЙ
// ============================================================================

interface GenerateCodesMessage {
  type: 'generateCodes'
  data: {
    count: number
    length: number
    useNumbers: boolean
    useLetters: boolean
    allowDuplicates: boolean
    excludeAmbiguous: boolean
    customCharset?: string
  }
}

interface ValidateCodesMessage {
  type: 'validateCodes'
  data: {
    codes: string[]
    rules: {
      minLength?: number
      maxLength?: number
      allowedCharacters?: string
      forbiddenWords?: string[]
      checkDuplicates?: boolean
    }
  }
}

interface OptimizeCodesMessage {
  type: 'optimizeCodes'
  data: {
    codes: string[]
    target: {
      length?: number
      charset?: string
      removeDuplicates?: boolean
      sortAlphabetically?: boolean
    }
  }
}

type WorkerMessage = GenerateCodesMessage | ValidateCodesMessage | OptimizeCodesMessage

interface WorkerResponse {
  type: string
  success: boolean
  data?: any
  error?: string
  progress?: number
}

// ============================================================================
// КОНСТАНТЫ
// ============================================================================

const CHARSETS = {
  numbers: '0123456789',
  letters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lettersLowercase: 'abcdefghijklmnopqrstuvwxyz',
  // Исключаем похожие символы для лучшей читаемости
  numbersUnambiguous: '23456789',
  lettersUnambiguous: 'ABCDEFGHJKLMNPQRSTUVWXYZ', // Исключены I, O
  special: '!@#$%^&*'
}

const FORBIDDEN_WORDS = [
  // Нецензурные и неподходящие комбинации
  'FUCK', 'SHIT', 'DAMN', 'HELL',
  'NAZI', 'KILL', 'DEAD', 'DIE',
  // Потенциально проблематичные коды
  '1234', '0000', 'AAAA', 'ZZZZ'
]

// ============================================================================
// ОБРАБОТЧИК СООБЩЕНИЙ
// ============================================================================

self.addEventListener('message', async (event) => {
  const message: WorkerMessage = event.data
  
  try {
    let response: WorkerResponse
    
    switch (message.type) {
      case 'generateCodes':
        response = await handleGenerateCodes(message.data)
        break
        
      case 'validateCodes':
        response = await handleValidateCodes(message.data)
        break
        
      case 'optimizeCodes':
        response = await handleOptimizeCodes(message.data)
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

async function handleGenerateCodes(data: GenerateCodesMessage['data']): Promise<WorkerResponse> {
  const startTime = performance.now()
  
  try {
    // Формируем набор символов
    let charset = data.customCharset || ''
    
    if (!charset) {
      if (data.useNumbers) {
        charset += data.excludeAmbiguous ? CHARSETS.numbersUnambiguous : CHARSETS.numbers
      }
      if (data.useLetters) {
        charset += data.excludeAmbiguous ? CHARSETS.lettersUnambiguous : CHARSETS.letters
      }
    }
    
    if (!charset) {
      throw new Error('Не указан набор символов для генерации')
    }
    
    // Генерируем коды
    const codes = await generateUniqueSequences(
      data.count,
      data.length,
      charset,
      data.allowDuplicates
    )
    
    const endTime = performance.now()
    
    return {
      type: 'generateCodes',
      success: true,
      data: {
        codes,
        count: codes.length,
        length: data.length,
        charset,
        generationTime: endTime - startTime,
        duplicatesFound: data.count - codes.length,
        statistics: generateStatistics(codes, charset)
      }
    }
  } catch (error) {
    return {
      type: 'generateCodes',
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка генерации кодов'
    }
  }
}

async function handleValidateCodes(data: ValidateCodesMessage['data']): Promise<WorkerResponse> {
  const startTime = performance.now()
  
  try {
    const results = []
    const issues = []
    
    for (let i = 0; i < data.codes.length; i++) {
      const code = data.codes[i]
      const validation = validateSingleCode(code, data.rules)
      
      results.push({
        code,
        valid: validation.valid,
        issues: validation.issues
      })
      
      if (!validation.valid) {
        issues.push(...validation.issues.map(issue => ({ code, issue })))
      }
      
      // Отправляем прогресс каждые 100 кодов
      if ((i + 1) % 100 === 0) {
        self.postMessage({
          type: 'progress',
          success: true,
          progress: Math.round(((i + 1) / data.codes.length) * 100)
        })
      }
    }
    
    const endTime = performance.now()
    
    return {
      type: 'validateCodes',
      success: true,
      data: {
        results,
        summary: {
          total: data.codes.length,
          valid: results.filter(r => r.valid).length,
          invalid: results.filter(r => !r.valid).length,
          issues: issues.length
        },
        issues,
        validationTime: endTime - startTime
      }
    }
  } catch (error) {
    return {
      type: 'validateCodes',
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка валидации кодов'
    }
  }
}

async function handleOptimizeCodes(data: OptimizeCodesMessage['data']): Promise<WorkerResponse> {
  const startTime = performance.now()
  
  try {
    let optimizedCodes = [...data.codes]
    const optimizations = []
    
    // Удаляем дубликаты
    if (data.target.removeDuplicates) {
      const beforeCount = optimizedCodes.length
      optimizedCodes = [...new Set(optimizedCodes)]
      optimizations.push(`Удалено дубликатов: ${beforeCount - optimizedCodes.length}`)
    }
    
    // Приводим к целевой длине
    if (data.target.length) {
      optimizedCodes = optimizedCodes.map(code => {
        if (code.length > data.target.length!) {
          return code.substring(0, data.target.length!)
        } else if (code.length < data.target.length!) {
          const charset = data.target.charset || CHARSETS.numbersUnambiguous
          return code.padEnd(data.target.length!, charset[0])
        }
        return code
      })
      optimizations.push(`Приведено к длине: ${data.target.length}`)
    }
    
    // Фильтруем по набору символов
    if (data.target.charset) {
      optimizedCodes = optimizedCodes.filter(code => 
        [...code].every(char => data.target.charset!.includes(char))
      )
      optimizations.push(`Отфильтровано по набору символов`)
    }
    
    // Сортируем
    if (data.target.sortAlphabetically) {
      optimizedCodes.sort()
      optimizations.push('Отсортировано по алфавиту')
    }
    
    const endTime = performance.now()
    
    return {
      type: 'optimizeCodes',
      success: true,
      data: {
        originalCodes: data.codes,
        optimizedCodes,
        optimizations,
        statistics: {
          originalCount: data.codes.length,
          optimizedCount: optimizedCodes.length,
          reductionPercent: Math.round(((data.codes.length - optimizedCodes.length) / data.codes.length) * 100)
        },
        optimizationTime: endTime - startTime
      }
    }
  } catch (error) {
    return {
      type: 'optimizeCodes',
      success: false,
      error: error instanceof Error ? error.message : 'Ошибка оптимизации кодов'
    }
  }
}

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

async function generateUniqueSequences(count: number, length: number, charset: string, allowDuplicates: boolean): Promise<string[]> {
  const codes = new Set<string>()
  const maxPossible = Math.pow(charset.length, length)
  
  if (!allowDuplicates && count > maxPossible) {
    throw new Error(`Невозможно сгенерировать ${count} уникальных кодов. Максимум: ${maxPossible}`)
  }
  
  const batchSize = 1000
  let attempts = 0
  const maxAttempts = count * 10 // Предотвращаем бесконечный цикл
  
  while (codes.size < count && attempts < maxAttempts) {
    // Генерируем коды батчами для лучшей производительности
    const batch = []
    for (let i = 0; i < batchSize && codes.size + batch.length < count; i++) {
      let code = ''
      for (let j = 0; j < length; j++) {
        code += charset[Math.floor(Math.random() * charset.length)]
      }
      
      // Проверяем на запрещенные слова
      if (!FORBIDDEN_WORDS.some(word => code.includes(word))) {
        if (allowDuplicates) {
          batch.push(code)
        } else if (!codes.has(code)) {
          batch.push(code)
        }
      }
    }
    
    batch.forEach(code => codes.add(code))
    attempts += batchSize
    
    // Отправляем прогресс
    const progress = Math.round((codes.size / count) * 100)
    self.postMessage({
      type: 'progress',
      success: true,
      progress
    })
    
    // Небольшая пауза для предотвращения блокировки
    if (attempts % 10000 === 0) {
      await new Promise(resolve => setTimeout(resolve, 1))
    }
  }
  
  return Array.from(codes).slice(0, count)
}

function validateSingleCode(code: string, rules: ValidateCodesMessage['data']['rules']) {
  const issues = []
  
  if (rules.minLength && code.length < rules.minLength) {
    issues.push(`Код слишком короткий (${code.length} < ${rules.minLength})`)
  }
  
  if (rules.maxLength && code.length > rules.maxLength) {
    issues.push(`Код слишком длинный (${code.length} > ${rules.maxLength})`)
  }
  
  if (rules.allowedCharacters) {
    const invalidChars = [...code].filter(char => !rules.allowedCharacters!.includes(char))
    if (invalidChars.length > 0) {
      issues.push(`Недопустимые символы: ${invalidChars.join(', ')}`)
    }
  }
  
  if (rules.forbiddenWords) {
    const foundForbidden = rules.forbiddenWords.filter(word => code.includes(word))
    if (foundForbidden.length > 0) {
      issues.push(`Содержит запрещенные слова: ${foundForbidden.join(', ')}`)
    }
  }
  
  return {
    valid: issues.length === 0,
    issues
  }
}

function generateStatistics(codes: string[], charset: string) {
  const charFrequency: Record<string, number> = {}
  const lengthDistribution: Record<number, number> = {}
  
  codes.forEach(code => {
    // Частота символов
    [...code].forEach(char => {
      charFrequency[char] = (charFrequency[char] || 0) + 1
    })
    
    // Распределение по длинам
    lengthDistribution[code.length] = (lengthDistribution[code.length] || 0) + 1
  })
  
  return {
    totalCodes: codes.length,
    uniqueCodes: new Set(codes).size,
    averageLength: codes.reduce((sum, code) => sum + code.length, 0) / codes.length,
    charFrequency,
    lengthDistribution,
    charsetUsage: Math.round((Object.keys(charFrequency).length / charset.length) * 100)
  }
}

// ============================================================================
// УВЕДОМЛЕНИЕ О ГОТОВНОСТИ
// ============================================================================

self.postMessage({
  type: 'ready',
  success: true,
  data: {
    workerName: 'codeGenerator',
    capabilities: ['generateCodes', 'validateCodes', 'optimizeCodes'],
    version: '1.0.0',
    maxCodes: 100000, // Рекомендуемый максимум для одной операции
    supportedCharsets: Object.keys(CHARSETS)
  }
})

