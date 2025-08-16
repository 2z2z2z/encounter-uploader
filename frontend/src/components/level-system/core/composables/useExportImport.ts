/**
 * useExportImport - общий экспорт/импорт
 * Реализация согласно плану рефакторинга (Фаза 1.4)
 */

import { ref } from 'vue'
import type { LevelTypeDefinition, UniversalAnswer, LevelState } from '../types/LevelType'

interface ExportOptions {
  format: 'json' | 'csv' | 'txt'
  includeMetadata: boolean
  includeEmptyRows: boolean
  customFields?: boolean
}

interface ImportResult {
  success: boolean
  message: string
  importedCount?: number
  errors?: string[]
}

export function useExportImport(
  data: { value: UniversalAnswer[] }, 
  levelType: LevelTypeDefinition
) {
  // ============================================================================
  // СОСТОЯНИЕ
  // ============================================================================
  
  const showExport = ref(false)
  const showImport = ref(false)
  const isExporting = ref(false)
  const isImporting = ref(false)
  const exportOptions = ref<ExportOptions>({
    format: 'json',
    includeMetadata: true,
    includeEmptyRows: false,
    customFields: true
  })
  
  // ============================================================================
  // ЭКСПОРТ ДАННЫХ
  // ============================================================================
  
  function handleExport(options?: Partial<ExportOptions>) {
    const finalOptions = { ...exportOptions.value, ...options }
    
    try {
      isExporting.value = true
      
      let exportData: any
      let fileName: string
      let mimeType: string
      
      switch (finalOptions.format) {
        case 'json':
          exportData = exportToJson(finalOptions)
          fileName = `${levelType.name}_${Date.now()}.json`
          mimeType = 'application/json'
          break
          
        case 'csv':
          exportData = exportToCsv(finalOptions)
          fileName = `${levelType.name}_${Date.now()}.csv`
          mimeType = 'text/csv'
          break
          
        case 'txt':
          exportData = exportToText(finalOptions)
          fileName = `${levelType.name}_${Date.now()}.txt`
          mimeType = 'text/plain'
          break
          
        default:
          throw new Error(`Неподдерживаемый формат экспорта: ${finalOptions.format}`)
      }
      
      downloadFile(exportData, fileName, mimeType)
      showExport.value = false
      
    } catch (error) {
      console.error('Export error:', error)
      alert(`Ошибка экспорта: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    } finally {
      isExporting.value = false
    }
  }
  
  function exportToJson(options: ExportOptions): string {
    const exportObject: any = {
      version: '2.0',
      type: levelType.name,
      label: levelType.label,
      exportDate: new Date().toISOString(),
      data: filterDataForExport(data.value, options)
    }
    
    if (options.includeMetadata) {
      exportObject.metadata = {
        category: levelType.category,
        capabilities: levelType.capabilities,
        totalRows: data.value.length,
        activeRows: data.value.filter(item => 
          item.inSector || item.inBonus || item.variants.some(v => v.trim())
        ).length
      }
    }
    
    return JSON.stringify(exportObject, null, 2)
  }
  
  function exportToCsv(options: ExportOptions): string {
    const filteredData = filterDataForExport(data.value, options)
    
    if (filteredData.length === 0) {
      return 'ID,Варианты,Сектор,Бонус\n'
    }
    
    // Заголовки
    const headers = ['ID', 'Варианты', 'Сектор', 'Бонус']
    
    // Добавляем заголовки для специфичных полей
    if (levelType.category === 'olymp') {
      headers.push('Название сектора', 'Название бонуса', 'Время бонуса')
    }
    
    if (levelType.category === 'bulk') {
      headers.push('Задержка', 'Ограничение', 'Уровни', 'Задание бонуса', 'Подсказка')
    }
    
    if (options.customFields) {
      const customFieldNames = new Set<string>()
      filteredData.forEach(item => {
        if (item.customFields) {
          Object.keys(item.customFields).forEach(key => customFieldNames.add(key))
        }
      })
      headers.push(...Array.from(customFieldNames))
    }
    
    // Формируем CSV
    const csvRows = [headers.join(',')]
    
    filteredData.forEach(item => {
      const row: string[] = [
        `"${item.id}"`,
        `"${item.variants.join('; ')}"`,
        item.inSector ? 'Да' : 'Нет',
        item.inBonus ? 'Да' : 'Нет'
      ]
      
      // Добавляем специфичные поля
      if (levelType.category === 'olymp') {
        row.push(
          `"${item.sectorName || ''}"`,
          `"${item.bonusName || ''}"`,
          item.bonusTime ? `"${formatTime(item.bonusTime)}"` : '""'
        )
      }
      
      if (levelType.category === 'bulk') {
        row.push(
          item.delay ? `"${formatTime(item.delay)}"` : '""',
          item.relativeLimit ? `"${formatTime(item.relativeLimit)}"` : '""',
          item.allLevels ? 'Все уровни' : (item.targetLevels?.join('; ') || ''),
          `"${item.bonusTask || ''}"`,
          `"${item.bonusHint || ''}"`
        )
      }
      
      // Добавляем кастомные поля
      if (options.customFields) {
        headers.slice(levelType.category === 'olymp' ? 7 : levelType.category === 'bulk' ? 9 : 4).forEach(fieldName => {
          const value = item.customFields?.[fieldName]
          row.push(`"${value || ''}"`)
        })
      }
      
      csvRows.push(row.join(','))
    })
    
    return csvRows.join('\n')
  }
  
  function exportToText(options: ExportOptions): string {
    const filteredData = filterDataForExport(data.value, options)
    
    const lines = [
      `Экспорт данных: ${levelType.label}`,
      `Дата: ${new Date().toLocaleString('ru-RU')}`,
      `Количество записей: ${filteredData.length}`,
      '',
      '=' .repeat(50),
      ''
    ]
    
    filteredData.forEach((item, index) => {
      lines.push(`${index + 1}. ID: ${item.id}`)
      lines.push(`   Варианты: ${item.variants.join(', ')}`)
      lines.push(`   Сектор: ${item.inSector ? 'Да' : 'Нет'}`)
      lines.push(`   Бонус: ${item.inBonus ? 'Да' : 'Нет'}`)
      
      if (item.sectorName) {
        lines.push(`   Название сектора: ${item.sectorName}`)
      }
      
      if (item.bonusName) {
        lines.push(`   Название бонуса: ${item.bonusName}`)
      }
      
      if (item.bonusTime) {
        lines.push(`   Время бонуса: ${formatTime(item.bonusTime)}`)
      }
      
      if (options.customFields && item.customFields) {
        Object.entries(item.customFields).forEach(([key, value]) => {
          lines.push(`   ${key}: ${value}`)
        })
      }
      
      lines.push('')
    })
    
    return lines.join('\n')
  }
  
  // ============================================================================
  // ИМПОРТ ДАННЫХ
  // ============================================================================
  
  function handleImport(file: File): Promise<ImportResult> {
    return new Promise((resolve) => {
      if (!file) {
        resolve({ success: false, message: 'Файл не выбран' })
        return
      }
      
      isImporting.value = true
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const result = importFromFile(content, file.name)
          resolve(result)
        } catch (error) {
          resolve({
            success: false,
            message: `Ошибка чтения файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
          })
        } finally {
          isImporting.value = false
        }
      }
      
      reader.onerror = () => {
        isImporting.value = false
        resolve({ success: false, message: 'Ошибка чтения файла' })
      }
      
      reader.readAsText(file)
    })
  }
  
  function importFromFile(content: string, fileName: string): ImportResult {
    const fileExt = fileName.split('.').pop()?.toLowerCase()
    
    try {
      let importedData: UniversalAnswer[]
      
      switch (fileExt) {
        case 'json':
          importedData = importFromJson(content)
          break
          
        case 'csv':
          importedData = importFromCsv(content)
          break
          
        case 'txt':
          return { success: false, message: 'Импорт из текстовых файлов не поддерживается' }
          
        default:
          return { success: false, message: `Неподдерживаемый формат файла: ${fileExt}` }
      }
      
      // Валидация импортированных данных
      try {
        levelType.schema.parse(importedData)
      } catch (validationError) {
        return {
          success: false,
          message: 'Импортированные данные не соответствуют схеме уровня'
        }
      }
      
      // Замещаем текущие данные
      data.value = importedData
      
      return {
        success: true,
        message: `Успешно импортировано ${importedData.length} записей`,
        importedCount: importedData.length
      }
      
    } catch (error) {
      return {
        success: false,
        message: `Ошибка импорта: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      }
    }
  }
  
  function importFromJson(content: string): UniversalAnswer[] {
    const parsed = JSON.parse(content)
    
    // Проверяем формат данных
    if (parsed.type && parsed.type !== levelType.name) {
      throw new Error(`Тип данных (${parsed.type}) не соответствует текущему уровню (${levelType.name})`)
    }
    
    return parsed.data || parsed
  }
  
  function importFromCsv(content: string): UniversalAnswer[] {
    const lines = content.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      throw new Error('CSV файл должен содержать заголовки и хотя бы одну строку данных')
    }
    
    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
    const dataLines = lines.slice(1)
    
    const results: UniversalAnswer[] = []
    
    dataLines.forEach((line, index) => {
      try {
        const values = line.split(',').map(v => v.replace(/"/g, '').trim())
        
        if (values.length !== headers.length) {
          throw new Error(`Строка ${index + 2}: количество значений не соответствует количеству заголовков`)
        }
        
        const answer: UniversalAnswer = {
          id: values[0] || (index + 1),
          variants: values[1] ? values[1].split(';').map(v => v.trim()) : [''],
          inSector: values[2]?.toLowerCase() === 'да',
          inBonus: values[3]?.toLowerCase() === 'да'
        }
        
        // Добавляем дополнительные поля в зависимости от типа
        if (levelType.category === 'olymp' && values.length >= 7) {
          answer.sectorName = values[4] || undefined
          answer.bonusName = values[5] || undefined
          if (values[6]) {
            answer.bonusTime = parseTimeString(values[6])
          }
        }
        
        results.push(answer)
        
      } catch (rowError) {
        throw new Error(`Ошибка обработки строки ${index + 2}: ${rowError instanceof Error ? rowError.message : 'Неизвестная ошибка'}`)
      }
    })
    
    return results
  }
  
  // ============================================================================
  // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
  // ============================================================================
  
  function filterDataForExport(sourceData: UniversalAnswer[], options: ExportOptions): UniversalAnswer[] {
    if (options.includeEmptyRows) {
      return sourceData
    }
    
    return sourceData.filter(item => 
      item.inSector || item.inBonus || item.variants.some(v => v.trim())
    )
  }
  
  function formatTime(time: { hours?: number, minutes?: number, seconds?: number, negative?: boolean }): string {
    const h = time.hours || 0
    const m = time.minutes || 0
    const s = time.seconds || 0
    const sign = time.negative ? '-' : ''
    
    return `${sign}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  
  function parseTimeString(timeStr: string): { hours: number, minutes: number, seconds: number, negative?: boolean } {
    const negative = timeStr.startsWith('-')
    const cleanStr = timeStr.replace('-', '')
    const parts = cleanStr.split(':')
    
    return {
      hours: parseInt(parts[0]) || 0,
      minutes: parseInt(parts[1]) || 0,
      seconds: parseInt(parts[2]) || 0,
      negative
    }
  }
  
  function downloadFile(content: string, fileName: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  
  // ============================================================================
  // ВОЗВРАЩАЕМЫЕ ЗНАЧЕНИЯ
  // ============================================================================
  
  return {
    // Состояние
    showExport,
    showImport,
    isExporting,
    isImporting,
    exportOptions,
    
    // Методы
    handleExport,
    handleImport,
    exportToJson,
    exportToCsv,
    exportToText,
    importFromJson,
    importFromCsv
  }
}

