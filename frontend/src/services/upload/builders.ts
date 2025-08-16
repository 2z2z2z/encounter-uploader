/**
 * Универсальные сборщики payload для всех типов запросов к Encounter API
 * Эти функции гарантируют правильную структуру данных для отправки
 */

export interface BonusPayloadArgs {
  domain: string
  gid: string | number
  level: string | number
  name?: string
  task?: string
  hint?: string
  variants: string[]
  time: { 
    hours: number
    minutes: number
    seconds: number
    negative?: boolean 
  }
  delay?: { 
    hours?: number
    minutes?: number
    seconds?: number 
  }
  relativeLimit?: { 
    hours?: number
    minutes?: number
    seconds?: number 
  }
  allLevels: boolean
  levelCheckboxNames?: string[]
}

/**
 * Сборщик payload для задания (Task)
 */
export function buildTaskPayload(
  domain: string, 
  gid: string | number, 
  level: string | number, 
  html: string
): URLSearchParams {
  return new URLSearchParams({
    domain,
    gid: String(gid),
    level: String(level),
    inputTask: html
  })
}

/**
 * Сборщик payload для секторов
 */
export function buildSectorPayload(
  domain: string,
  gid: string | number,
  level: string | number,
  variants: string[],
  sectorName = ''
): URLSearchParams {
  const params = new URLSearchParams({
    domain,
    gid: String(gid),
    level: String(level),
    txtSectorName: sectorName,
    savesector: ' '
  })
  
  // Добавляем варианты ответов с правильной нумерацией
  variants.forEach((variant, index) => {
    params.append(`txtAnswer_${index}`, variant)
    params.append(`ddlAnswerFor_${index}`, '0')
  })
  
  return params
}

/**
 * Универсальный сборщик payload для бонусов
 * Поддерживает все типы: олимпийки, Type100500 и будущие 20+ типов
 */
export function buildBonusPayload(args: BonusPayloadArgs): URLSearchParams {
  const params = new URLSearchParams({
    domain: args.domain,
    gid: String(args.gid),
    level: String(args.level)
  })
  
  // Основные поля бонуса
  params.append('txtBonusName', args.name || '')
  if (args.task) {
    params.append('txtTask', args.task)
  }
  if (args.hint) {
    params.append('txtHelp', args.hint)
  }
  
  // Варианты ответов (с отрицательными индексами для бонусов)
  args.variants.forEach((variant, index) => {
    params.append(`answer_-${index + 1}`, variant)
  })
  
  // Время бонуса
  params.append('txtHours', String(args.time.hours))
  params.append('txtMinutes', String(args.time.minutes))
  params.append('txtSeconds', String(args.time.seconds))
  if (args.time.negative) {
    params.append('negative', 'on')
  }
  
  // Задержка (для Type100500 и будущих типов)
  if (args.delay && (args.delay.hours || args.delay.minutes || args.delay.seconds)) {
    params.append('chkDelay', 'on')
    params.append('txtDelayHours', String(args.delay.hours || 0))
    params.append('txtDelayMinutes', String(args.delay.minutes || 0))
    params.append('txtDelaySeconds', String(args.delay.seconds || 0))
  }
  
  // Ограничение времени (для Type100500 и будущих типов)
  if (args.relativeLimit && 
      (args.relativeLimit.hours || args.relativeLimit.minutes || args.relativeLimit.seconds)) {
    params.append('chkRelativeLimit', 'on')
    params.append('txtValidHours', String(args.relativeLimit.hours || 0))
    params.append('txtValidMinutes', String(args.relativeLimit.minutes || 0))
    params.append('txtValidSeconds', String(args.relativeLimit.seconds || 0))
  }
  
  // Уровни доступности бонуса
  params.append('rbAllLevels', args.allLevels ? '0' : '1')
  if (!args.allLevels && Array.isArray(args.levelCheckboxNames)) {
    args.levelCheckboxNames.forEach(name => {
      params.append(name, 'on')
    })
  }
  
  return params
}

/**
 * Вспомогательная функция для конвертации параметров в объект
 * (для тестирования и дебага)
 */
export function paramsToObject(params: URLSearchParams): Record<string, string | string[]> {
  const result: Record<string, string | string[]> = {}
  
  params.forEach((value, key) => {
    if (key in result) {
      // Если ключ уже существует, делаем массив
      const existing = result[key]
      if (Array.isArray(existing)) {
        existing.push(value)
      } else {
        result[key] = [existing, value]
      }
    } else {
      result[key] = value
    }
  })
  
  return result
}

