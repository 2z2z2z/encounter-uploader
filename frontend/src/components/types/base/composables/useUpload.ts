import { ref, Ref } from 'vue'
import type { Answer } from '../types'
import { sendTask, sendSector, sendBonuses } from '../../../../services/uploader'
import { generateOlympLayout } from '../../../../utils/olymp'
import { useProgressStore } from '../../../../store/progress'
import { useAuthStore } from '../../../../store/auth'
import { 
  showUploadWarning, 
  startUploadVisibilityTracking, 
  stopUploadVisibilityTracking, 
  showCompletionNotification 
} from '../../../../utils/visibility'

export function useUpload(sectorsCount: number) {
  const progressStore = useProgressStore()
  const authStore = useAuthStore()
  const isUploading = ref(false)
  const uploadError = ref('')
  
  /**
   * Форматирует текст закрытого сектора
   */
  function formatClosedText(text: string): string {
    const trimmed = text.trim()
    if (/^https?:\/\//i.test(trimmed)) {
      return `<a href="${trimmed}" target="_blank"><img src="${trimmed}" style="max-width: 150px; max-height: 150px;"></a>`
    }
    return text
  }
  
  /**
   * Генерирует HTML таблицу для задания
   */
  function generateTaskHtml(
    answers: Answer[],
    levelId: string,
    mode: 'closed' | 'open' = 'closed'
  ): string {
    const layout = generateOlympLayout(sectorsCount, levelId)
    let html = '<table border="1" cellpadding="5" cellspacing="0" style="width: 100%; table-layout: fixed;">\n'
    
    for (const row of layout) {
      html += '  <tr>\n'
      for (const cell of row) {
        if (!cell.id) {
          html += '    <td>&nbsp;</td>\n'
        } else {
          const cellNumber = parseInt(cell.id.split('_')[1])
          const answer = answers.find(a => a.number === cellNumber)
          
          let content = ''
          if (mode === 'closed') {
            content = answer?.closedText ? formatClosedText(answer.closedText) : `Сектор ${cellNumber}`
          } else {
            if (answer?.displayText) {
              content = `<p class="up">${answer.displayText}</p>`
            } else if (answer?.closedText) {
              const formatted = formatClosedText(answer.closedText)
              if (formatted.includes('<img')) {
                content = formatted
              } else {
                content = `<p class="up">${formatted}</p>`
              }
            } else {
              content = `Сектор ${cellNumber}`
            }
          }
          
          const rowspan = cell.rs ? ` rowspan="${cell.rs}"` : ''
          html += `    <td id="${cell.id}"${rowspan}>${content}</td>\n`
        }
      }
      html += '  </tr>\n'
    }
    
    html += '</table>'
    return html
  }
  
  /**
   * Отправляет задание
   */
  async function uploadTask(
    domain: string,
    gameId: string,
    levelId: string,
    answers: Answer[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      isUploading.value = true
      uploadError.value = ''
      
      showUploadWarning()
      startUploadVisibilityTracking()
      
      progressStore.startProgress('Отправка задания...', 1)
      
      const taskHtml = generateTaskHtml(answers, levelId, 'closed')
      await sendTask(domain, gameId, levelId, taskHtml)
      
      progressStore.updateProgress(1)
      progressStore.completeProgress()
      
      stopUploadVisibilityTracking()
      showCompletionNotification('Задание успешно отправлено!')
      
      return { success: true }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Неизвестная ошибка'
      uploadError.value = errorMsg
      progressStore.setError(errorMsg)
      stopUploadVisibilityTracking()
      return { success: false, error: errorMsg }
    } finally {
      isUploading.value = false
    }
  }
  
  /**
   * Отправляет секторы
   */
  async function uploadSectors(
    domain: string,
    gameId: string,
    levelId: string,
    answers: Answer[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      isUploading.value = true
      uploadError.value = ''
      
      const sectors = answers.filter(a => a.inSector)
      if (sectors.length === 0) {
        throw new Error('Нет секторов для отправки')
      }
      
      showUploadWarning()
      startUploadVisibilityTracking()
      
      progressStore.startProgress('Отправка секторов...', sectors.length)
      
      // Повторная авторизация перед отправкой
      await authStore.authenticate(domain)
      
      for (let i = 0; i < sectors.length; i++) {
        const sector = sectors[i]
        const validVariants = sector.variants.filter(v => v.trim())
        
        if (validVariants.length === 0) {
          console.warn(`Сектор ${sector.number} пропущен - нет вариантов ответа`)
          continue
        }
        
        await sendSector(
          domain,
          gameId,
          levelId,
          validVariants,
          sector.closedText,
          sector.sectorName || ''
        )
        
        progressStore.updateProgress(i + 1)
        
        // Повторная авторизация каждые 25 секторов
        if ((i + 1) % 25 === 0 && i < sectors.length - 1) {
          console.log('Повторная авторизация после 25 секторов...')
          await authStore.authenticate(domain)
        }
      }
      
      progressStore.completeProgress()
      stopUploadVisibilityTracking()
      showCompletionNotification('Секторы успешно отправлены!')
      
      return { success: true }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Неизвестная ошибка'
      uploadError.value = errorMsg
      progressStore.setError(errorMsg)
      stopUploadVisibilityTracking()
      return { success: false, error: errorMsg }
    } finally {
      isUploading.value = false
    }
  }
  
  /**
   * Отправляет бонусы
   */
  async function uploadBonuses(
    domain: string,
    gameId: string,
    levelId: string,
    answers: Answer[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      isUploading.value = true
      uploadError.value = ''
      
      const bonuses = answers.filter(a => a.inBonus)
      if (bonuses.length === 0) {
        throw new Error('Нет бонусов для отправки')
      }
      
      showUploadWarning()
      startUploadVisibilityTracking()
      
      progressStore.startProgress('Отправка бонусов...', bonuses.length + 1)
      
      // Повторная авторизация перед отправкой
      await authStore.authenticate(domain)
      progressStore.updateProgress(1)
      
      // Отправляем бонусы через общую функцию
      await sendBonuses(domain, gameId, levelId, bonuses)
      
      progressStore.completeProgress()
      stopUploadVisibilityTracking()
      showCompletionNotification('Бонусы успешно отправлены!')
      
      return { success: true }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Неизвестная ошибка'
      uploadError.value = errorMsg
      progressStore.setError(errorMsg)
      stopUploadVisibilityTracking()
      return { success: false, error: errorMsg }
    } finally {
      isUploading.value = false
    }
  }
  
  return {
    isUploading,
    uploadError,
    generateTaskHtml,
    uploadTask,
    uploadSectors,
    uploadBonuses
  }
}