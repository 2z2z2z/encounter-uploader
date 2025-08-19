import { useConfirm } from 'primevue/useconfirm'

export function useConfirmation() {
  const confirm = useConfirm()
  
  return {
    confirm(options: {
      message: string
      header?: string
      icon?: string
      accept?: () => void
      reject?: () => void
    }) {
      confirm.require({
        message: options.message,
        header: options.header || 'Подтверждение',
        icon: options.icon || 'pi pi-exclamation-triangle',
        acceptLabel: 'Да',
        rejectLabel: 'Нет',
        accept: options.accept,
        reject: options.reject
      })
    },
    
    delete(itemName: string, onConfirm: () => void) {
      confirm.require({
        message: `Вы уверены, что хотите удалить ${itemName}?`,
        header: 'Подтверждение удаления',
        icon: 'pi pi-trash',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Удалить',
        rejectLabel: 'Отмена',
        accept: onConfirm
      })
    },
    
    save(onConfirm: () => void) {
      confirm.require({
        message: 'Сохранить изменения?',
        header: 'Сохранение',
        icon: 'pi pi-save',
        acceptLabel: 'Сохранить',
        rejectLabel: 'Отмена',
        accept: onConfirm
      })
    },
    
    unsavedChanges(onConfirm: () => void) {
      confirm.require({
        message: 'У вас есть несохраненные изменения. Продолжить без сохранения?',
        header: 'Несохраненные изменения',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-warning',
        acceptLabel: 'Продолжить',
        rejectLabel: 'Отмена',
        accept: onConfirm
      })
    }
  }
}
