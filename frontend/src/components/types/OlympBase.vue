<template>
	<div>
		<LevelUploadLayout :title="levelTypeLabel" :showPreview="true" :showTitle="true" :showMeta="true" :showBack="true" :showCommonActions="true" :containerClass="'container max-w-[120rem] mx-auto bg-white p-12 rounded-md shadow-sm'" @back="$router.push('/settings')" @clear="onClear" @export="() => (showExport = true)" @importChange="importData" @preview="() => (showPreview = true)">
			<template #error>
				<Message v-if="error" severity="error" :closable="false" class="mt-4">{{ error }}</Message>
			</template>
			<template #controls>
				<div class="flex-1 min-w-[160px]" v-if="hasControl('sectorMode')">
					<FloatLabel variant="off">
						<Select
							id="sectorMode"
							v-model="sectorMode"
							:options="sectorModeOptions"
							optionLabel="label"
							optionValue="value"
							placeholder="Выберите режим"
							@change="applySectorMode"
							fluid
						/>
						<label for="sectorMode">Закрытие уровня</label>
					</FloatLabel>
				</div>
				<div class="flex-1 flex gap-3" v-if="hasControl('quickBonusTime')">
					<FloatLabel variant="off">
						<div class="flex items-center gap-2 flex-nowrap">
							<InputNumber
								id="bonusHours"
								v-model="quickTime.hours"
								:min="0"
								:step="1"
								showButtons
								suffix=" ч"
								:minFractionDigits="0"
								:maxFractionDigits="0"
								class="z-w-5"
							/>
							<InputNumber
								id="bonusMinutes"
								v-model="quickTime.minutes"
								:min="0"
								showButtons
								suffix=" м"
								:step="1"
								:minFractionDigits="0"
								:maxFractionDigits="0"
								class="z-w-5"
							/>
							<InputNumber
								id="bonusSeconds"
								v-model="quickTime.seconds"
								:min="0"
								showButtons
								suffix=" с"
								:step="1"
								:minFractionDigits="0"
								:maxFractionDigits="0"
								class="z-w-5"
							/>
						</div>
						<label for="bonusHours">Бонусное время (ч, м, с)</label>
					</FloatLabel>
					<div class="flex items-center gap-2">
						<Checkbox
							id="bonusNegative"
							v-model="quickTime.negative"
							:binary="true"
							class="cursor-pointer"
							inputId="bonusNegativeCheckbox"
							size="large"
						/>
						<label for="bonusNegative" class="text-sm text-surface-600 cursor-pointer">
							отрицательное
						</label>
					</div>
				</div>
				<div class="flex-1 min-w-[240px]" v-if="hasControl('closedPattern')">
					<FloatLabel variant="off">
						<InputText
							id="closedPattern"
							v-model="localClosedPattern"
							placeholder="Текст, & или URL картинки"
							fluid
						/>
						<label for="closedPattern">Название закрытого сектора</label>
					</FloatLabel>
				</div>
				<Button 
					v-if="hasControl('fillOpenSectors')" 
					@click="fillOpenSectors" 
					label="Заполнить открытые сектора"
					icon="pi pi-copy"
				/>
			</template>
			<Divider />
			<template #table>
				<Answers />
			</template>
			<template #rightActions>
				<Button 
					v-if="buttons.enableTask" 
					@click="onSendTask" 
					label="Залить задание"
				/>
				<Button 
					@click="onSendSector" 
					label="Залить секторы"
				/>
				<Button 
					v-if="buttons.enableBonuses" 
					@click="onSendBonus" 
					label="Залить бонусы"
				/>
			</template>
		</LevelUploadLayout>

		<Dialog 
			:visible="showPreview"
			@update:visible="showPreview = $event"
			header="Предпросмотр олимпийки" 
			:style="{ width: '90vw', maxWidth: '800px' }"
			:breakpoints="{ '1199px': '95vw', '575px': '98vw' }"
			modal
		>
			<Tabs :value="previewMode" @update:value="handleTabChange">
				<TabList>
					<Tab value="closed">Закрытая</Tab>
					<Tab value="open">Открытая</Tab>
				</TabList>
				<TabPanels class="mt-4 h-full">
					<TabPanel value="closed" class="h-full overflow-auto">
						<div class="olymp-preview" v-html="olympTableHtml"></div>
					</TabPanel>
					<TabPanel value="open" class="h-full overflow-auto">
						<div class="olymp-preview" v-html="olympTableHtml"></div>
					</TabPanel>
				</TabPanels>
			</Tabs>
		</Dialog>

		<Dialog
			:visible="showExport"
			@update:visible="showExport = $event"
			header="Экспортировать как…"
			:style="{ width: '400px' }"
			:breakpoints="{ '575px': '90vw' }"
			modal
		>
			<div class="flex gap-2 justify-center mt-4">
				<Button 
					@click="exportDataAs('json')" 
					label="JSON"
					severity="secondary"
					class="h-10 px-4"
					icon="pi pi-file"
				/>
				<Button 
					@click="exportDataAs('csv')" 
					label="CSV"
					severity="secondary"
					class="h-10 px-4"
					icon="pi pi-file-excel"
				/>
			</div>
		</Dialog>
	</div>
</template>

<script setup lang="ts">
import LevelUploadLayout from '../LevelUploadLayout.vue'
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useNotification } from '../../composables/useNotification'
import { useConfirm } from 'primevue/useconfirm'
import { useProgressStore } from '../../store/progress'
import { useUploadStore } from '../../store'
import { useAuthStore } from '../../store/auth'
import Answers from './olymp/Answers.vue'
import { generateOlympLayout, type Cell } from '../../utils/olymp'
import { startUploadVisibilityTracking, stopUploadVisibilityTracking } from '../../utils/visibility'
import { serializeCsv, downloadBlob, parseCsv } from '../../utils/csv'
import { sendTask, sendSector, sendBonuses } from '../../services/uploader'
import { getTypeConfig } from '../level-system/registry/types'
import type { TypeButtonsConfig } from '../level-system/registry/schema'

import Message from 'primevue/message'
import Select from 'primevue/select'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Checkbox from 'primevue/checkbox'
import Button from 'primevue/button'
import FloatLabel from 'primevue/floatlabel'
import Divider from 'primevue/divider'
import Dialog from 'primevue/dialog'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'


const props = defineProps<{ 
  totalSectors: number
  customTitle?: string
}>()

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

const sectorModeOptions = [
	{ label: 'Все сектора', value: 'all' },
	{ label: 'Начальные + финал', value: 'initialAndFinal' },
	{ label: 'Только финал', value: 'finalOnly' },
	{ label: 'Кастом', value: 'custom' }
]

const store = useUploadStore()
const authStore = useAuthStore()
const progress = useProgressStore()
const notify = useNotification()
const confirm = useConfirm()

const error = ref('')
const showPreview = ref(false)
const previewMode = ref<'closed' | 'open'>('closed')
const showExport = ref(false)

const levelTypeLabel = computed(() => props.customTitle || olympTitle(props.totalSectors))
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
watch(() => ({ ...quickTime }), (qt) => {
	if (!store.answers) return
	store.answers.forEach((r) => (r.bonusTime = { ...qt }))
}, { deep: true })

const localClosedPattern = ref('')
watch(localClosedPattern, (val) => {
	if (!store.answers) return
	store.answers.forEach((r) => {
		r.closedText = (val || '').replace(/&/g, String(r.number))
	})
})
onMounted(() => { localClosedPattern.value = '' })

function applySectorMode() {
	if (!store.answers) return
	const half = Math.floor((props.totalSectors + 1) / 2)
	const mode = sectorMode.value
	
	switch (mode) {
		case 'all':
			store.answers.forEach((r) => (r.inSector = true))
			break
		case 'initialAndFinal':
			store.answers.forEach((r) => {
				r.inSector = r.number <= half || r.number === props.totalSectors
			})
			break
		case 'finalOnly':
			store.answers.forEach((r) => {
				r.inSector = r.number === props.totalSectors
			})
			break
		case 'custom':
			// оставляем как есть
			break
	}
}

function fillOpenSectors() {
	if (!store.answers) return
	store.answers.forEach((r) => {
		r.displayText = r.variants[0] || ''
	})
}

function handleTabChange(value: string | number) {
	previewMode.value = value as 'closed' | 'open'
}
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
					notify.error('Неверный формат JSON', 'Файл должен содержать answers и config')
				}
			} else {
				const rows = parseCsv(text)
				if (!rows.length) { notify.warn('CSV пустой', 'Файл не содержит данных для импорта'); return }
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
		} catch (err) { notify.error('Ошибка при импорте', (err as any)?.message || 'Не удалось обработать файл') }
	}
	reader.readAsText(file)
}

function formatClosedText(text: string): string {
	const trimmed = text.trim()
	if (/^https?:\/\//i.test(trimmed)) {
		return `<a href="${trimmed}" target="_blank"><img src="${trimmed}" style="max-width: 150px; max-height: 150px;"></a>`
	}
	return text
}

const olympTableHtml = computed(() => {
	const style = `
    <style>
      .olymp {max-width: 1100px; width: 100%;margin: 10px 0;}
      .olymp td {
        border:1px solid #414141;
        padding:10px;
        width:120px!important;
        text-align:center;
        vertical-align:middle;
      }
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
			
			const content = formatClosedText(rawText)
			
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
		const confirmed = await showUploadConfirmation()
		if (!confirmed) return
		startUploadVisibilityTracking('задание')
		
		// Перелогинимся перед отправкой, чтобы продлить сессию
		await authStore.authenticate(store.domain)
		
		progress.start('task', 1)
		progress.updateTitle('Отправка задания')
		const prevMode = previewMode.value
		previewMode.value = 'closed'
		const htmlClosed = olympTableHtml.value
		previewMode.value = prevMode
		await sendTask(store.domain, store.gameId, store.levelId, htmlClosed)
		progress.updateSuccess('Задание отправлено')
		progress.finish(); stopUploadVisibilityTracking()
	} catch (e: any) { stopUploadVisibilityTracking(); notify.error('Ошибка отправки задания', e.message) }
}

const showUploadConfirmation = (): Promise<boolean> => {
	return new Promise<boolean>((resolve) => {
		confirm.require({
			message: 'Во время заливки рекомендуется не переключаться на другие вкладки браузера и не сворачивать его.',
			header: 'Продолжить заливку?',
			icon: 'pi pi-exclamation-triangle',
			acceptLabel: 'Продолжить',
			rejectLabel: 'Отмена',
			rejectClass: 'p-button-outlined',
			accept: () => resolve(true),
			reject: () => resolve(false)
		})
	})
}

async function onSendSector() {
	try {
		const sectors = store.answers.filter((r) => r.inSector)
		if (sectors.length === 0) { notify.info('Нет отмеченных секторов для отправки'); return }
		const confirmed = await showUploadConfirmation()
		if (!confirmed) return
		startUploadVisibilityTracking('сектора')
		
		// Перелогинимся перед массовой загрузкой, чтобы продлить сессию
		await authStore.authenticate(store.domain)
		
		progress.start('sector', sectors.length)
		for (let idx = 0; idx < sectors.length; idx++) {
			const row = sectors[idx]
			// Проверяем паузу перед каждым сектором
			await progress.waitForResume()
			progress.updateTitle(`Сектор ${row.number}`)
			await sendSector(store.domain, store.gameId, store.levelId, row.variants, row.closedText)
			progress.updateSuccess(`Сектор ${row.number} отправлен`)
			
			// Каждые 25 секторов обновляем авторизацию, чтобы избежать истечения сессии
			if ((idx + 1) % 25 === 0) {
				await authStore.authenticate(store.domain)
			}
		}
		progress.finish(); stopUploadVisibilityTracking()
	} catch (e: any) { stopUploadVisibilityTracking(); notify.error('Ошибка отправки секторов', e.message) }
}

async function onSendBonus() {
	try {
		const bonusesToSend = store.answers.filter((r) => r.inBonus)
		if (bonusesToSend.length === 0) { notify.info('Нет отмеченных бонусов для отправки'); return }
		const confirmed = await showUploadConfirmation()
		if (!confirmed) return
		startUploadVisibilityTracking('бонусы')
		await authStore.authenticate(store.domain)
		progress.start('bonus', bonusesToSend.length)
		for (let idx = 0; idx < bonusesToSend.length; idx++) {
			// Проверяем паузу перед каждым бонусом
			await progress.waitForResume()
			const bonusRow = bonusesToSend[idx]
			progress.updateTitle(`Бонус ${bonusRow.number}`)
			await sendBonuses(store.domain, store.gameId, store.levelId, [bonusRow])
			progress.updateSuccess(`Бонус ${bonusRow.number} отправлен`)
			if ((idx + 1) % 25 === 0) { await authStore.authenticate(store.domain) }
		}
		progress.finish(); stopUploadVisibilityTracking()
	} catch (e: any) { stopUploadVisibilityTracking(); notify.error('Ошибка отправки бонусов', e.message) }
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

.olymp-preview {
	display: flex;
	justify-content: center;
	padding: 1rem;
}

/* ConfirmDialog стили для уменьшения ширины и переносов строк */
:deep(.p-confirmdialog) {
	width: 25rem !important;
	max-width: 90vw !important;
}

:deep(.p-confirmdialog .p-confirmdialog-message) {
	white-space: pre-line !important;
}

@media (max-width: 768px) {
	:deep(.p-confirmdialog) {
		width: 95vw !important;
	}
}
</style>


