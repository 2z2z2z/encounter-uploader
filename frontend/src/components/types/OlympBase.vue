<template>
	<div>
		<LevelUploadLayout :title="levelTypeLabel" :showPreview="true" :showTitle="true" :showMeta="true" :showBack="true" :showCommonActions="true" :containerClass="'container max-w-[120rem] mx-auto bg-white p-12 rounded-md shadow-sm'" @back="$router.push('/settings')" @clear="onClear" @export="() => (showExport = true)" @importChange="importData" @preview="() => (showPreview = true)">
			<template #error>
				<div v-if="error" class="text-red-500 text-sm mt-4">{{ error }}</div>
			</template>
			<template #controls>
				<div class="flex-1 min-w-[160px]" v-if="hasControl('sectorMode')">
					<label class="form-label">Закрытие уровня</label>
					<select v-model="sectorMode" @change="applySectorMode" class="form-select h-10 w-full cursor-pointer">
						<option value="all">Все сектора</option>
						<option value="initialAndFinal">Начальные + финал</option>
						<option value="finalOnly">Только финал</option>
						<option value="custom">Кастом</option>
					</select>
				</div>
				<div class="flex-1 min-w-[240px]" v-if="hasControl('quickBonusTime')">
					<label class="form-label">Бонусное время (ч, м, с)</label>
					<div class="flex items-center gap-2">
						<input type="number" min="0" v-model.number="quickTime.hours" placeholder="ч" class="form-input h-10 w-16 text-center" />
						<input type="number" min="0" v-model.number="quickTime.minutes" placeholder="м" class="form-input h-10 w-16 text-center" />
						<input type="number" min="0" v-model.number="quickTime.seconds" placeholder="с" class="form-input h-10 w-16 text-center" />
						<label class="flex items-center gap-1 ml-2">
							<input type="checkbox" v-model="quickTime.negative" class="cursor-pointer" />
							<span class="text-gray-500">–</span>
						</label>
					</div>
				</div>
				<div class="flex-1 min-w-[240px]" v-if="hasControl('closedPattern')">
					<label class="form-label">Название закрытого сектора</label>
					<input v-model="localClosedPattern" placeholder="Текст, & или URL картинки" class="form-input h-10 w-full" />
				</div>
				<button v-if="hasControl('fillOpenSectors')" @click="fillOpenSectors" type="button" class="form-button h-10 px-4 flex-1 min-w-[240px]">Заполнить открытые сектора</button>
			</template>
			<template #table>
				<Answers />
			</template>
			<template #rightActions>
				<button v-if="buttons.enableTask" @click="onSendTask" type="button" class="form-button h-10 px-4">Залить задание</button>
				<button @click="onSendSector" type="button" class="form-button h-10 px-4">Залить секторы</button>
				<button v-if="buttons.enableBonuses" @click="onSendBonus" type="button" class="form-button h-10 px-4">Залить бонусы</button>
			</template>
		</LevelUploadLayout>

		<transition name="fade">
			<div v-if="showPreview" class="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm flex items-center justify-center з-50">
				<div class="bg-[#1d1d1d] text-white rounded-md p-6 w-[90%] max-w-3xl space-y-4 relative">
					<button @click="showPreview = false" class="absolute top-2 right-2 text-gray-400 hover:text-white cursor-pointer">✕</button>
					<h2 class="text-xl font-semibold">Предпросмотр</h2>
					<div class="flex gap-2 mb-4">
						<button :class="previewMode === 'closed' ? 'bg-blue-500 text-white' : 'bg-gray-400 text-black'" class="px-4 py-2 rounded-md cursor-pointer" @click="previewMode = 'closed'">Закрытая</button>
						<button :class="previewMode === 'open' ? 'bg-blue-500 text-white' : 'bg-gray-400 text-black'" class="px-4 py-2 rounded-md cursor-pointer" @click="previewMode = 'open'">Открытая</button>
					</div>
					<div class="overflow-auto max-h-[60vh]"><div v-html="olympTableHtml"></div></div>
				</div>
			</div>
		</transition>

		<transition name="fade">
			<div v-if="showExport" class="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm flex items-center justify-center з-50">
				<div class="bg-white p-6 rounded-md w-[90%] max-w-sm space-y-4 relative">
					<button @click="showExport = false" type="button" class="absolute top-2 right-2 text-gray-400 hover:text-black cursor-pointer">✕</button>
					<h3 class="text-lg font-medium">Экспортировать как…</h3>
					<div class="flex gap-2 justify-end">
						<button @click="exportDataAs('json')" class="form-button h-10 px-4">JSON</button>
						<button @click="exportDataAs('csv')" class="form-button h-10 px-4">CSV</button>
					</div>
				</div>
			</div>
		</transition>
	</div>
</template>

<script setup lang="ts">
import LevelUploadLayout from '../LevelUploadLayout.vue'
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useProgressStore } from '../../store/progress'
import { useUploadStore } from '../../store'
import { useAuthStore } from '../../store/auth'
import Answers from './olymp/Answers.vue'
import { generateOlympLayout, type Cell } from '../../utils/olymp'
import { showUploadWarning, startUploadVisibilityTracking, stopUploadVisibilityTracking, showCompletionNotification } from '../../utils/visibility'
import { serializeCsv, downloadBlob, parseCsv } from '../../utils/csv'
import { sendTask, sendSector, sendBonuses } from '../../services/uploader'
import { getTypeConfig } from '../level-system/registry/types'
import type { TypeButtonsConfig } from '../level-system/registry/schema'
import { applyClosedPatternToAnswers, applyQuickBonusTimeToAnswers, applySectorModeToAnswers, fillOpenSectorsFromFirstVariant } from '../level-system/useOlympControls'

const props = defineProps<{ totalSectors: number }>()

function olympTitle(n: number): string {
	switch (n) {
		case 15: return 'Олимпийка (15 секторов)'
		case 31: return 'Олимпийка (31 сектор)'
		case 63: return 'Олимпийка (63 сектора)'
		case 127: return 'Олимпийка (127 сектора)'
		default: return `Олимпийка (${n} секторов)`
	}
}

type SectorMode = 'all' | 'initialAndFinal' | 'finalOnly' | 'custom'
const store = useUploadStore()
const authStore = useAuthStore()
const progress = useProgressStore()

const error = ref('')
const showPreview = ref(false)
const previewMode = ref<'closed' | 'open'>('closed')
const showExport = ref(false)

const levelTypeLabel = computed(() => olympTitle(props.totalSectors))
const buttons = computed<TypeButtonsConfig>(() => {
  const cfg = getTypeConfig(store.uploadType)
  if (cfg && cfg.category === 'olymp') return cfg.buttons
  return { enableTask: true, enablePreview: true, enableSectors: true, enableBonuses: true }
})

function hasControl(id: 'sectorMode' | 'closedPattern' | 'fillOpenSectors' | 'quickBonusTime'): boolean {
  const cfg = getTypeConfig(store.uploadType)
  return !!cfg?.controls?.includes(id as any)
}

const sectorMode = computed<SectorMode>({
	get: () => store.config.sectorMode as SectorMode,
	set: (v) => { (store.config as any).sectorMode = v },
})

const quickTime = reactive({ hours: 0, minutes: 0, seconds: 0, negative: false })
watch(() => ({ ...quickTime }), (qt) => applyQuickBonusTimeToAnswers(qt as any, store.answers as any), { deep: true })

const localClosedPattern = ref('')
watch(localClosedPattern, (val) => applyClosedPatternToAnswers(val, store.answers as any))
onMounted(() => { localClosedPattern.value = '' })

function applySectorMode() {
	applySectorModeToAnswers(sectorMode.value as any, props.totalSectors, store.answers as any)
}

function fillOpenSectors() { fillOpenSectorsFromFirstVariant(store.answers as any) }
function onClear() { store.clearTypeData() }

function exportDataAs(format: 'json' | 'csv') {
	const { levelId, ...state } = store.$state as any
	if (format === 'csv') {
		const rows = store.answers.map((r) => ({
			number: String(r.number || ''),
			variants: (Array.isArray(r.variants) ? r.variants : []).join(' | '),
			inSector: r.inSector ? '1' : '0',
			inBonus: r.inBonus ? '1' : '0',
			bonusHours: String(r.bonusTime?.hours ?? ''),
			bonusMinutes: String(r.bonusTime?.minutes ?? ''),
			bonusSeconds: String(r.bonusTime?.seconds ?? ''),
			bonusNegative: r.bonusTime?.negative ? '1' : '0',
			closedText: r.closedText || '',
			displayText: r.displayText || '',
		}))
		const csv = serializeCsv(rows)
		downloadBlob(csv, 'encounter-olymp.csv', 'text/csv')
	} else {
		const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = 'encounter-olymp.json'
		a.click()
		URL.revokeObjectURL(url)
	}
	showExport.value = false
}

function importData(e: Event) {
	const file = (e.target as HTMLInputElement).files?.[0]
	if (!file) return
	const reader = new FileReader()
	reader.onload = () => {
		try {
			const text = String(reader.result || '')
			const trimmed = text.trim()
			if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
				const obj = JSON.parse(text)
				if (Array.isArray(obj.answers) && obj.config) {
					const { levelId, ...rest } = obj
					store.$patch(rest)
				} else {
					alert('Неверный формат JSON')
				}
			} else {
				const rows = parseCsv(text)
				if (!rows.length) { alert('CSV пустой'); return }
				const answers = rows.map((r) => ({
					number: Number(r.number) || 0,
					variants: (r.variants || '').split('|').map((s: string) => s.trim()).filter(Boolean),
					inSector: r.inSector === '1' || /true/i.test(r.inSector || ''),
					inBonus: r.inBonus === '1' || /true/i.test(r.inBonus || ''),
					bonusTime: {
						hours: Number(r.bonusHours) || 0,
						minutes: Number(r.bonusMinutes) || 0,
						seconds: Number(r.bonusSeconds) || 0,
						negative: r.bonusNegative === '1' || /true|-/i.test(r.bonusNegative || ''),
					},
					closedText: r.closedText || '',
					displayText: r.displayText || '',
				}))
				answers.sort((a, b) => a.number - b.number)
				const normalized = answers.map((a, idx) => ({ ...a, number: idx + 1 }))
				store.$patch({ answers: normalized })
			}
		} catch (err) { alert('Ошибка при импорте: ' + (err as any)?.message) }
	}
	reader.readAsText(file)
}

const olympTableHtml = computed(() => {
	const style = `
		<style>
			.olymp {max-width:800px;width:100%;margin: 10px 0;}
			.olymp td { border:1px solid #414141; padding:10px; width:120px!important; text-align:center; vertical-align:middle; }
			.up {color:#0F0;font-weight:bold;}
			.cols-wrapper {display: none;}
			h3 {display: none !important;}
			.timer, .bonus_count, .color_bonus, .color_correct {display: block !important;}
		</style>`
	const layout: Cell[][] = generateOlympLayout(props.totalSectors, store.levelId)
	let html = style + '<table class="olymp">'
	layout.forEach((row) => {
		html += '<tr>'
		row.forEach((cell) => {
			if (!cell.id) return
			const num = parseInt(cell.id.split('_')[1], 10)
			let rawText = previewMode.value === 'closed'
				? store.answers[num - 1].closedText
				: store.answers[num - 1].displayText || store.answers[num - 1].closedText
			const content = /^https?:\/\//i.test(rawText.trim())
				? `<a href="${rawText.trim()}" target="_blank"><img src="${rawText.trim()}" style="max-width: 150px; max-height: 150px;"></a>`
				: rawText
			let cellHtml = content
			if (previewMode.value === 'open' && store.answers[num - 1].displayText && !/^https?:\/\//i.test(rawText.trim())) {
				cellHtml = `<p class='up'>${content}</p>`
			}
			const rsAttr = cell.rs ? `rowspan="${cell.rs}"` : ''
			html += `<td id="${cell.id}" ${rsAttr}>${cellHtml}</td>`
		})
		html += '</tr>'
	})
	html += '</table>'
	return html
})

async function onSendTask() {
	try {
		const prevMode = previewMode.value
		previewMode.value = 'closed'
		const htmlClosed = olympTableHtml.value
		previewMode.value = prevMode
		await sendTask(store.domain, store.gameId, store.levelId, htmlClosed)
		alert('✅ Задание отправлено')
	} catch (e: any) { alert('❌ Ошибка отправки задания: ' + e.message) }
}

async function onSendSector() {
	try {
		const sectors = store.answers.filter((r) => r.inSector)
		if (sectors.length === 0) { alert('ℹ️ Нет отмеченных секторов для отправки'); return }
		if (!showUploadWarning('сектора')) { return }
		startUploadVisibilityTracking('сектора')
		progress.start('sector', sectors.length)
		for (const row of sectors) {
			progress.update(`Сектор ${row.number}`)
			await sendSector(store.domain, store.gameId, store.levelId, row.variants, row.closedText)
		}
		progress.finish(); stopUploadVisibilityTracking(); showCompletionNotification('сектора', sectors.length)
		alert('✅ Все отмеченные сектора отправлены')
	} catch (e: any) { stopUploadVisibilityTracking(); alert('❌ Ошибка отправки секторов: ' + e.message) }
}

async function onSendBonus() {
	try {
		const bonusesToSend = store.answers.filter((r) => r.inBonus)
		if (bonusesToSend.length === 0) { alert('ℹ️ Нет отмеченных бонусов для отправки'); return }
		if (!showUploadWarning('бонусы')) { return }
		startUploadVisibilityTracking('бонусы')
		await authStore.authenticate(store.domain)
		progress.start('bonus', bonusesToSend.length)
		for (let idx = 0; idx < bonusesToSend.length; idx++) {
			const bonusRow = bonusesToSend[idx]
			progress.update(`Бонус ${bonusRow.number}`)
			await sendBonuses(store.domain, store.gameId, store.levelId, [bonusRow])
			if ((idx + 1) % 25 === 0) { await authStore.authenticate(store.domain) }
		}
		progress.finish(); stopUploadVisibilityTracking(); showCompletionNotification('бонусы', bonusesToSend.length)
		alert('✅ Все отмеченные бонусы отправлены')
	} catch (e: any) { stopUploadVisibilityTracking(); alert('❌ Ошибка отправки бонусов: ' + e.message) }
}
</script>

<script lang="ts">
export default {}
</script>

<style>
.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>


