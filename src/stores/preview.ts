import { defineStore } from 'pinia'
import { computed } from 'vue'

// Legacy callers use this read-only state. All workflows now use the real API.
export const usePreviewStore = defineStore('toir-visual-preview', () => {
  const enabled = computed(() => false)
  const setEnabled = (_value:boolean) => {}
  const toggle = () => {}
  return { enabled, setEnabled, toggle }
})
