import { Ref } from 'vue'
import type { Answer, OlympConfig, ExportData, ImportData } from '../types'
import { serializeCsv, parseCsv, downloadBlob, type CsvRow } from '../../../../utils/csv'

export function useExportImport() {
  /**
   * Экспортирует данные в JSON
   */
  function exportToJson(
    config: OlympConfig,
    closedPattern: string,
    answers: Answer[]
  ): string {
    const data: ExportData = {
      config,
      closedPattern,
      answers,
      version: 2
    }
    return JSON.stringify(data, null, 2)
  }
  
  /**
   * Экспортирует данные в CSV
   */
  function exportToCsv(answers: Answer[]): string {
    const rows: CsvRow[] = answers.map((r) => ({
      number: String(r.number),
      // Объединяем варианты через "|"
      variants: r.variants.filter(v => v).join('|'),
      inSector: r.inSector ? 'да' : 'нет',
      inBonus: r.inBonus ? 'да' : 'нет',
      bonusHours: String(r.bonusTime.hours || 0),
      bonusMinutes: String(r.bonusTime.minutes || 0),
      bonusSeconds: String(r.bonusTime.seconds || 0),
      bonusNegative: r.bonusTime.negative ? 'да' : 'нет',
      closedText: r.closedText || '',
      displayText: r.displayText || '',
      sectorName: r.sectorName || '',
      bonusName: r.bonusName || '',
      bonusTask: r.bonusTask || '',
      bonusHint: r.bonusHint || '',
      // Для Type100500
      delayHours: String(r.delay?.hours || 0),
      delayMinutes: String(r.delay?.minutes || 0),
      delaySeconds: String(r.delay?.seconds || 0),
      validHours: String(r.relativeLimit?.hours || 0),
      validMinutes: String(r.relativeLimit?.minutes || 0),
      validSeconds: String(r.relativeLimit?.seconds || 0),
      allLevels: r.allLevels ? 'да' : 'нет',
      targetLevels: r.targetLevels?.join(',') || ''
    }))
    
    return serializeCsv(rows)
  }
  
  /**
   * Импортирует данные из JSON с поддержкой миграции
   */
  function importFromJson(
    jsonString: string,
    answers: Ref<Answer[]>,
    config: Ref<OlympConfig>,
    closedPattern: Ref<string>
  ): { success: boolean; error?: string } {
    try {
      const data = JSON.parse(jsonString) as ImportData
      
      // Миграция старого формата
      if (data.answers) {
        const migratedAnswers = data.answers.map((a: any) => {
          // Миграция answer -> variants
          if (a.answer && !a.variants) {
            a.variants = [a.answer]
            delete a.answer
          }
          // Убеждаемся что variants всегда массив
          if (!Array.isArray(a.variants)) {
            a.variants = a.variants ? [a.variants] : ['']
          }
          // Дефолтные значения для новых полей
          if (!a.bonusTime) {
            a.bonusTime = { hours: 0, minutes: 0, seconds: 0, negative: false }
          }
          return a
        })
        answers.value = migratedAnswers
      }
      
      if (data.config) {
        Object.assign(config.value, data.config)
      }
      
      if (data.closedPattern !== undefined) {
        closedPattern.value = data.closedPattern
      }
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: `Ошибка импорта JSON: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      }
    }
  }
  
  /**
   * Импортирует данные из CSV
   */
  function importFromCsv(
    csvString: string,
    answers: Ref<Answer[]>
  ): { success: boolean; error?: string } {
    try {
      const rows = parseCsv(csvString)
      
      answers.value = rows.map((row): Answer => ({
        number: parseInt(row.number) || 0,
        // Разбиваем варианты по "|"
        variants: row.variants ? row.variants.split('|').filter(Boolean) : [''],
        inSector: row.inSector === 'да',
        inBonus: row.inBonus === 'да',
        bonusTime: {
          hours: parseInt(row.bonusHours) || 0,
          minutes: parseInt(row.bonusMinutes) || 0,
          seconds: parseInt(row.bonusSeconds) || 0,
          negative: row.bonusNegative === 'да'
        },
        closedText: row.closedText || '',
        displayText: row.displayText || '',
        sectorName: row.sectorName || '',
        bonusName: row.bonusName || '',
        bonusTask: row.bonusTask || '',
        bonusHint: row.bonusHint || '',
        // Для Type100500
        delay: (row.delayHours || row.delayMinutes || row.delaySeconds) ? {
          hours: parseInt(row.delayHours) || 0,
          minutes: parseInt(row.delayMinutes) || 0,
          seconds: parseInt(row.delaySeconds) || 0
        } : undefined,
        relativeLimit: (row.validHours || row.validMinutes || row.validSeconds) ? {
          hours: parseInt(row.validHours) || 0,
          minutes: parseInt(row.validMinutes) || 0,
          seconds: parseInt(row.validSeconds) || 0
        } : undefined,
        allLevels: row.allLevels === 'да',
        targetLevels: row.targetLevels ? row.targetLevels.split(',').filter(Boolean) : undefined
      }))
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: `Ошибка импорта CSV: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      }
    }
  }
  
  /**
   * Скачивает данные в выбранном формате
   */
  function downloadData(
    format: 'json' | 'csv',
    config: OlympConfig,
    closedPattern: string,
    answers: Answer[],
    filename: string
  ) {
    if (format === 'json') {
      const json = exportToJson(config, closedPattern, answers)
      downloadBlob(json, `${filename}.json`, 'application/json')
    } else {
      const csv = exportToCsv(answers)
      downloadBlob(csv, `${filename}.csv`, 'text/csv')
    }
  }
  
  /**
   * Обрабатывает импорт файла
   */
  async function handleFileImport(
    file: File,
    answers: Ref<Answer[]>,
    config: Ref<OlympConfig>,
    closedPattern: Ref<string>
  ): Promise<{ success: boolean; error?: string }> {
    const text = await file.text()
    const isJson = file.name.endsWith('.json') || file.type === 'application/json'
    
    if (isJson) {
      return importFromJson(text, answers, config, closedPattern)
    } else {
      return importFromCsv(text, answers)
    }
  }
  
  return {
    exportToJson,
    exportToCsv,
    importFromJson,
    importFromCsv,
    downloadData,
    handleFileImport
  }
}