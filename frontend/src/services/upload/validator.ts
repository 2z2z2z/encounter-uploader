/**
 * Простая валидация критических полей для запросов к Encounter API
 * Используется для проверки корректности данных перед отправкой
 */

export type RequestType = 'task' | 'sector' | 'bonus'

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Проверка критических полей для каждого типа запроса
 */
export function validateCriticalFields(
  requestType: RequestType, 
  data: Record<string, any>
): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  }
  
  // Базовые поля для всех типов
  const baseFields = ['domain', 'gid', 'level']
  for (const field of baseFields) {
    if (!data[field]) {
      result.errors.push(`Отсутствует обязательное поле: ${field}`)
      result.valid = false
    }
  }
  
  // Специфичные поля для каждого типа
  switch (requestType) {
    case 'task':
      if (!data.inputTask) {
        result.errors.push('Отсутствует HTML содержимое задания (inputTask)')
        result.valid = false
      } else if (data.inputTask.length < 10) {
        result.warnings.push('Подозрительно короткое содержимое задания')
      }
      break
      
    case 'sector':
      if (!data.savesector) {
        result.errors.push('Отсутствует поле savesector')
        result.valid = false
      }
      
      // Проверка парности txtAnswer_N и ddlAnswerFor_N
      const answerKeys = Object.keys(data).filter(k => k.startsWith('txtAnswer_'))
      const ddlKeys = Object.keys(data).filter(k => k.startsWith('ddlAnswerFor_'))
      
      if (answerKeys.length !== ddlKeys.length) {
        result.errors.push(
          `Несоответствие количества ответов (${answerKeys.length}) и ddl полей (${ddlKeys.length})`
        )
        result.valid = false
      }
      
      if (answerKeys.length === 0) {
        result.warnings.push('Нет вариантов ответов для сектора')
      }
      
      // Проверка правильной нумерации
      answerKeys.forEach(key => {
        const index = key.replace('txtAnswer_', '')
        if (!data[`ddlAnswerFor_${index}`]) {
          result.errors.push(`Отсутствует ddlAnswerFor_${index} для ${key}`)
          result.valid = false
        }
      })
      break
      
    case 'bonus':
      // Проверка временных полей
      const timeFields = ['txtHours', 'txtMinutes', 'txtSeconds']
      for (const field of timeFields) {
        if (data[field] === undefined) {
          result.errors.push(`Отсутствует временное поле: ${field}`)
          result.valid = false
        }
      }
      
      // Проверка вариантов ответов с отрицательными индексами
      const bonusAnswerKeys = Object.keys(data).filter(k => k.startsWith('answer_-'))
      if (bonusAnswerKeys.length === 0) {
        result.warnings.push('Нет вариантов ответов для бонуса')
      }
      
      // Проверка уровней
      if (data.rbAllLevels === undefined) {
        result.errors.push('Не указан параметр доступности бонуса (rbAllLevels)')
        result.valid = false
      } else if (data.rbAllLevels === '1') {
        // Если "на указанных уровнях", должен быть хотя бы один чекбокс
        const levelKeys = Object.keys(data).filter(k => k.startsWith('level_'))
        if (levelKeys.length === 0) {
          result.errors.push('Не выбрано ни одного уровня для бонуса')
          result.valid = false
        }
      }
      
      // Проверка задержки (если включена)
      if (data.chkDelay === 'on') {
        const delayFields = ['txtDelayHours', 'txtDelayMinutes', 'txtDelaySeconds']
        for (const field of delayFields) {
          if (data[field] === undefined) {
            result.errors.push(`Включена задержка, но отсутствует поле: ${field}`)
            result.valid = false
          }
        }
      }
      
      // Проверка ограничения времени (если включено)
      if (data.chkRelativeLimit === 'on') {
        const limitFields = ['txtValidHours', 'txtValidMinutes', 'txtValidSeconds']
        for (const field of limitFields) {
          if (data[field] === undefined) {
            result.errors.push(`Включено ограничение, но отсутствует поле: ${field}`)
            result.valid = false
          }
        }
      }
      break
  }
  
  return result
}

/**
 * Проверка payload перед отправкой
 */
export function validatePayload(
  requestType: RequestType,
  payload: URLSearchParams
): ValidationResult {
  // Конвертируем URLSearchParams в объект для проверки
  const data: Record<string, any> = {}
  payload.forEach((value, key) => {
    data[key] = value
  })
  
  return validateCriticalFields(requestType, data)
}

/**
 * Вспомогательная функция для логирования результатов валидации
 */
export function logValidationResult(
  result: ValidationResult, 
  requestType?: RequestType
): void {
  if (result.valid) {
    console.log(`✅ Валидация ${requestType ? `для ${requestType}` : ''} успешна`)
  } else {
    console.error(`❌ Валидация ${requestType ? `для ${requestType}` : ''} провалена:`)
    result.errors.forEach(error => console.error(`  - ${error}`))
  }
  
  if (result.warnings.length > 0) {
    console.warn(`⚠️ Предупреждения:`)
    result.warnings.forEach(warning => console.warn(`  - ${warning}`))
  }
}

