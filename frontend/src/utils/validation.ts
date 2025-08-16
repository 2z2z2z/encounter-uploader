/**
 * Простая альтернатива Zod для валидации
 * Создано для замены закомментированных Zod импортов
 */

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings?: string[]
}

export interface SimpleSchema {
  parse(data: any): any
  safeParse(data: any): { success: boolean; data?: any; error?: any }
  array(): SimpleSchema
}

// Базовая валидация для UniversalAnswer
export function validateUniversalAnswer(data: any): ValidationResult {
  const errors: string[] = []
  
  if (!data || typeof data !== 'object') {
    errors.push('Данные должны быть объектом')
    return { valid: false, errors }
  }
  
  if (data.id === undefined || data.id === null) {
    errors.push('Поле id обязательно')
  }
  
  if (!Array.isArray(data.variants)) {
    errors.push('Поле variants должно быть массивом')
  } else if (data.variants.length === 0) {
    errors.push('Массив variants не может быть пустым')
  }
  
  if (typeof data.inSector !== 'boolean') {
    errors.push('Поле inSector должно быть булевым')
  }
  
  if (typeof data.inBonus !== 'boolean') {
    errors.push('Поле inBonus должно быть булевым')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// Валидация массива UniversalAnswer
export function validateUniversalAnswerArray(data: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  if (!Array.isArray(data)) {
    errors.push('Данные должны быть массивом')
    return { valid: false, errors, warnings }
  }
  
  if (data.length === 0) {
    warnings.push('Массив данных пуст')
  }
  
  data.forEach((item, index) => {
    const itemValidation = validateUniversalAnswer(item)
    if (!itemValidation.valid) {
      errors.push(`Элемент ${index + 1}: ${itemValidation.errors.join(', ')}`)
    }
  })
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

// Создание простой схемы
export function createSimpleSchema(validator: (data: any) => ValidationResult): SimpleSchema {
  return {
    parse: (data: any) => {
      const result = validator(data)
      if (!result.valid) {
        throw new Error(`Validation failed: ${result.errors.join(', ')}`)
      }
      return data
    },
    
    safeParse: (data: any) => {
      const result = validator(data)
      if (result.valid) {
        return { success: true, data }
      } else {
        return { 
          success: false, 
          error: new Error(result.errors.join(', '))
        }
      }
    },
    
    array: () => createSimpleSchema((data: any) => validateUniversalAnswerArray(data))
  }
}

// Экспорт основных схем для замены Zod
export const UniversalAnswerSchema = createSimpleSchema(validateUniversalAnswer)
export const UniversalAnswerArraySchema = createSimpleSchema(validateUniversalAnswerArray)

// Утилита для создания кастомных полей валидации
export function validateCustomField(
  fieldName: string, 
  value: any, 
  fieldDefinition: any
): ValidationResult {
  const errors: string[] = []
  
  if (fieldDefinition.required && (value === undefined || value === null || value === '')) {
    errors.push(`Поле ${fieldName} обязательно для заполнения`)
  }
  
  if (value !== undefined && value !== null && fieldDefinition.type) {
    switch (fieldDefinition.type) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push(`Поле ${fieldName} должно быть строкой`)
        }
        break
      case 'number':
        if (typeof value !== 'number' && !isNaN(Number(value))) {
          errors.push(`Поле ${fieldName} должно быть числом`)
        }
        break
      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push(`Поле ${fieldName} должно быть булевым значением`)
        }
        break
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// Заглушка для z объекта (замена Zod)
export const z = {
  object: (shape: any) => createSimpleSchema((data: any) => {
    const errors: string[] = []
    
    Object.keys(shape).forEach(key => {
      if (shape[key].required && !data[key]) {
        errors.push(`Поле ${key} обязательно`)
      }
    })
    
    return { valid: errors.length === 0, errors }
  }),
  
  string: () => ({
    min: (length: number) => ({
      required: true,
      type: 'string',
      minLength: length
    })
  }),
  
  number: () => ({
    min: (value: number) => ({
      required: true,
      type: 'number',
      minValue: value
    })
  }),
  
  boolean: () => ({
    required: true,
    type: 'boolean'
  }),
  
  array: (schema: any) => ({
    required: true,
    type: 'array',
    itemSchema: schema
  })
}

