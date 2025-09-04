import { useToast } from 'primevue/usetoast'

export function useNotification() {
  const toast = useToast()
  
  return {
    success(message: string, detail?: string) {
      toast.add({
        severity: 'success',
        summary: message,
        detail,
        life: 3000
      })
    },
    
    info(message: string, detail?: string) {
      toast.add({
        severity: 'info',
        summary: message,
        detail,
        life: 3000
      })
    },
    
    warn(message: string, detail?: string) {
      toast.add({
        severity: 'warn',
        summary: message,
        detail,
        life: 3000
      })
    },
    
    error(message: string, detail?: string) {
      toast.add({
        severity: 'error',
        summary: message,
        detail,
        life: 3000
      })
    }
  }
}
