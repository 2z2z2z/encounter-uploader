import { useAuthStore } from '../store/auth'
import { useProgressStore } from '../store/progress'
import { showUploadWarning, startUploadVisibilityTracking, stopUploadVisibilityTracking, showCompletionNotification } from '../utils/visibility'
import { sendTask, sendSector, sendBonuses, type Answer } from '../services/uploader'

interface UploadContext {
  domain: string
  gameId: string | number
  levelId: string | number
}

interface SectorRowLike {
  number: number
  variants: string[]
  inSector: boolean
  closedText?: string
  sectorName?: string
}

export function useUploader(ctx: UploadContext) {
  const auth = useAuthStore()
  const progress = useProgressStore()

  async function uploadTask(htmlClosed: string) {
    try {
      await sendTask(ctx.domain, ctx.gameId, ctx.levelId, htmlClosed)
      alert('✅ Задание отправлено')
    } catch (e: any) {
      alert('❌ Ошибка отправки задания: ' + e.message)
    }
  }

  async function uploadSectors(rows: SectorRowLike[]) {
    try {
      const sectors = rows.filter((r) => r.inSector)
      if (sectors.length === 0) {
        alert('ℹ️ Нет отмеченных секторов для отправки')
        return
      }
      if (!showUploadWarning('сектора')) return
      startUploadVisibilityTracking('сектора')
      progress.start('sector', sectors.length)
      for (const row of sectors) {
        progress.update(`Сектор ${row.number}`)
        await sendSector(
          ctx.domain,
          ctx.gameId,
          ctx.levelId,
          Array.isArray(row.variants) && row.variants.length ? row.variants : [''],
          row.closedText || '',
          row.sectorName || ''
        )
      }
      progress.finish()
      stopUploadVisibilityTracking()
      showCompletionNotification('сектора', sectors.length)
      alert('✅ Все отмеченные сектора отправлены')
    } catch (e: any) {
      stopUploadVisibilityTracking()
      alert('❌ Ошибка отправки секторов: ' + e.message)
    }
  }

  async function uploadBonuses(bonuses: Answer[]) {
    try {
      const bonusesToSend = bonuses.filter((r) => r.inBonus)
      if (bonusesToSend.length === 0) {
        alert('ℹ️ Нет отмеченных бонусов для отправки')
        return
      }
      if (!showUploadWarning('бонусы')) return
      startUploadVisibilityTracking('бонусы')
      await auth.authenticate(ctx.domain)
      progress.start('bonus', bonusesToSend.length)
      for (let idx = 0; idx < bonusesToSend.length; idx++) {
        const bonusRow = bonusesToSend[idx]
        progress.update(`Бонус ${bonusRow.number}`)
        await sendBonuses(ctx.domain, ctx.gameId, ctx.levelId, [bonusRow])
        if ((idx + 1) % 25 === 0) {
          await auth.authenticate(ctx.domain)
        }
      }
      progress.finish()
      stopUploadVisibilityTracking()
      showCompletionNotification('бонусы', bonusesToSend.length)
      alert('✅ Все отмеченные бонусы отправлены')
    } catch (e: any) {
      stopUploadVisibilityTracking()
      alert('❌ Ошибка отправки бонусов: ' + e.message)
    }
  }

  return { uploadTask, uploadSectors, uploadBonuses }
}


