import { useAuthStore } from '../../../store/auth'
import { useProgressStore } from '../../../store/progress'
import { showUploadWarning, startUploadVisibilityTracking, stopUploadVisibilityTracking, showCompletionNotification } from '../../../utils/visibility'
import { sendSector, sendBonuses, type Answer } from '../../../services/uploader'

interface UploadContext {
	domain: string
	gameId: string
	levelId: string
}

export function useUploader100500(ctx: UploadContext) {
	const auth = useAuthStore()
	const progress = useProgressStore()

	async function uploadSectors(rows: Array<{
		number: number
		variants: string[]
		inSector: boolean
		sectorName?: string
	}>, combine?: boolean) {
		try {
			if (!showUploadWarning('сектора')) return
			startUploadVisibilityTracking('сектора')

			if (combine) {
				// rows ожидаются уже «сшитые» по логике вызывающей стороны
				progress.start('sector', rows.length)
				for (const row of rows) {
					if (!row.inSector) { progress.update('Пропуск'); continue }
					progress.update(`Сектор ${row.number}`)
					await sendSector(ctx.domain, ctx.gameId, ctx.levelId, row.variants, '', row.sectorName || '')
				}
				progress.finish()
			} else {
				const rowsToSend = rows.filter(r => r.inSector)
				if (!rowsToSend.length) {
					alert('ℹ️ Нет отмеченных секторов для отправки')
					stopUploadVisibilityTracking()
					return
				}
				progress.start('sector', rowsToSend.length)
				for (const row of rowsToSend) {
					progress.update(`Сектор ${row.number}`)
					await sendSector(ctx.domain, ctx.gameId, ctx.levelId, (Array.isArray(row.variants) && row.variants.length ? row.variants : ['']), '', row.sectorName || '')
				}
				progress.finish()
			}

			stopUploadVisibilityTracking()
			showCompletionNotification('сектора', combine ? rows.filter(r => r.inSector).length : rows.filter(r => r.inSector).length)
			alert('✅ Все сектора отправлены')
		} catch (e: any) {
			stopUploadVisibilityTracking()
			alert('❌ Ошибка отправки секторов: ' + e.message)
		}
	}

	async function uploadBonuses(bonusRows: Answer[]) {
		try {
			const rows = bonusRows.filter(r => r.inBonus)
			if (!rows.length) { alert('ℹ️ Нет отмеченных бонусов для отправки'); return }
			if (!showUploadWarning('бонусы')) return
			startUploadVisibilityTracking('бонусы')
			await auth.authenticate(ctx.domain)
			progress.start('bonus', rows.length)
			for (let idx = 0; idx < rows.length; idx++) {
				const b = rows[idx]
				progress.update(`Бонус ${b.number}`)
				await sendBonuses(ctx.domain, ctx.gameId, ctx.levelId, [b])
				if ((idx + 1) % 25 === 0) await auth.authenticate(ctx.domain)
			}
			progress.finish()
			stopUploadVisibilityTracking()
			showCompletionNotification('бонусы', rows.length)
			alert('✅ Все бонусы отправлены')
		} catch (e: any) {
			stopUploadVisibilityTracking()
			alert('❌ Ошибка отправки бонусов: ' + e.message)
		}
	}

	return { uploadSectors, uploadBonuses }
}


