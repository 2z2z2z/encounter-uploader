<template>
  <PageLayout :title="title" maxWidthClass="max-w-[120rem]">
    <LevelInfo />

    <div v-if="error" class="text-red-500 text-sm mt-4">{{ error }}</div>

    <div class="flex flex-wrap justify-between items-end gap-4 mt-8 mb-8">
      <div class="flex-1 min-w-[160px]">
        <label class="form-label">Закрытие уровня</label>
        <select
          v-model="sectorMode"
          @change="applySectorMode"
          class="form-select h-10 w-full cursor-pointer"
        >
          <option value="all">Все сектора</option>
          <option value="initialAndFinal">Начальные + финал</option>
          <option value="finalOnly">Только финал</option>
          <option value="custom">Кастом</option>
        </select>
      </div>

      <div class="flex-1 min-w-[240px]">
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

      <div class="flex-1 min-w-[240px]">
        <label class="form-label">Название закрытого сектора</label>
        <input v-model="localClosedPattern" placeholder="Текст, & или URL картинки" class="form-input h-10 w-full" />
      </div>

      <button @click="fillOpenSectors" type="button" class="form-button h-10 px-4 flex-1 min-w-[240px]">Заполнить открытые сектора</button>
    </div>

    <Answers />

    <BottomBar
      :showBack="true"
      :showClear="true"
      :showExport="true"
      :showImport="true"
      :showPreview="true"
      :showSendTask="true"
      :showSendSectors="true"
      :showSendBonuses="true"
      @back="$router.push('/settings')"
      @clear="onClear"
      @export="() => (showExport = true)"
      @import="importData"
      @preview="() => (showPreview = true)"
      @sendTask="onSendTask"
      @sendSectors="onSendSector"
      @sendBonuses="onSendBonus"
    />

    <PreviewModal :show="showPreview" :previewMode="previewMode" :html="olympTableHtml" @update:show="(v)=>showPreview=v" @update:previewMode="(m)=>previewMode=m" />

    <ExportModal :show="showExport" @update:show="showExport = $event" @export-json="() => exportDataAs('json')" @export-csv="() => exportDataAs('csv')" />
  </PageLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useUploadStore } from '../../../store'
import { useAuthStore } from '../../../store/auth'
import { useProgressStore } from '../../../store/progress'
import Answers from '../shared/Answers.vue'
import LevelInfo from '../shared/LevelInfo.vue'
import ExportModal from '../shared/ExportModal.vue'
import BottomBar from '../shared/BottomBar.vue'
import { generateOlympLayout, type Cell } from '../../../utils/olymp'
import { showUploadWarning, startUploadVisibilityTracking, stopUploadVisibilityTracking, showCompletionNotification } from '../../../utils/visibility'
import { sendTask, sendSector, sendBonuses } from '../../../services/uploader'
import PageLayout from '../shared/PageLayout.vue'
import { exportOlympDataAs, importOlympData } from './useExportImportOlymp'
import { useUploader } from '../../../composables/uploader'

const { title, totalSectors } = defineProps<{ title: string; totalSectors: number }>()

type SectorMode = 'all' | 'initialAndFinal' | 'finalOnly' | 'custom'

const store = useUploadStore()
const authStore = useAuthStore()
const progress = useProgressStore()

const error = ref('')
const showPreview = ref(false)
const previewMode = ref<'closed' | 'open'>('closed')
const showExport = ref(false)

const sectorMode = computed<SectorMode>({
  get: () => store.config.sectorMode as SectorMode,
  set: (v) => {
    ;(store.config as any).sectorMode = v
  },
})

const quickTime = reactive({ hours: 0, minutes: 0, seconds: 0, negative: false })
watch(
  () => ({ ...quickTime }),
  (qt) => store.answers.forEach((r) => (r.bonusTime = { ...qt })),
  { deep: true }
)

const localClosedPattern = ref('')
watch(localClosedPattern, (val) =>
  store.answers.forEach((r) => {
    r.closedText = val.replace(/&/g, String(r.number))
  })
)
onMounted(() => {
  localClosedPattern.value = ''
})

function applySectorMode() {
  const half = Math.floor(totalSectors / 2)
  switch (sectorMode.value) {
    case 'all':
      store.answers.forEach((r) => (r.inSector = true))
      break
    case 'initialAndFinal':
      store.answers.forEach((r) => {
        r.inSector = r.number <= half || r.number === totalSectors
      })
      break
    case 'finalOnly':
      store.answers.forEach((r) => {
        r.inSector = r.number === totalSectors
      })
      break
    case 'custom':
      break
  }
}

function fillOpenSectors() {
  store.answers.forEach((r) => {
    r.displayText = r.variants[0] || ''
  })
}

function onClear() {
  store.clearTypeData()
}

function exportDataAs(format: 'json' | 'csv') {
  exportOlympDataAs(store as any, format)
  showExport.value = false
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
  const layout: Cell[][] = generateOlympLayout(totalSectors, store.levelId)

  function formatClosedText(text: string): string {
    const trimmed = text.trim()
    if (/^https?:\/\//i.test(trimmed)) {
      return `<a href="${trimmed}" target="_blank"><img src="${trimmed}" style="max-width: 150px; max-height: 150px;"></a>`
    }
    return text
  }

  let html = style + '<table class="olymp">'
  layout.forEach((row) => {
    html += '<tr>'
    row.forEach((cell) => {
      if (!cell.id) return
      const num = parseInt(cell.id.split('_')[1], 10)
      let rawText =
        previewMode.value === 'closed'
          ? store.answers[num - 1].closedText
          : store.answers[num - 1].displayText || store.answers[num - 1].closedText
      const content = formatClosedText(rawText)
      let cellHtml = content
      if (previewMode.value === 'open' && store.answers[num - 1].displayText && !/^https?:\/\//i.test(rawText.trim())) {
        cellHtml = `<p class="up">${content}</p>`
      }
      const rsAttr = cell.rs ? `rowspan="${cell.rs}"` : ''
      html += `<td id="${cell.id}" ${rsAttr}>${cellHtml}</td>`
    })
    html += '</tr>'
  })
  html += '</table>'
  return html
})

const uploader = useUploader({ domain: store.domain, gameId: store.gameId, levelId: store.levelId })

async function onSendTask() {
  const prevMode = previewMode.value
  previewMode.value = 'closed'
  const htmlClosed = olympTableHtml.value
  previewMode.value = prevMode
  await uploader.uploadTask(htmlClosed)
}

async function onSendSector() {
  await uploader.uploadSectors(store.answers as any)
}

async function onSendBonus() {
  await uploader.uploadBonuses(store.answers as any)
}
function importData(e: Event) {
  importOlympData(e, store as any)
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


