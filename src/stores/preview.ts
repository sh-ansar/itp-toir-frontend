import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Ephemeral in-memory visual prototype data.
 * Never stored in a browser, never sent to any backend endpoint.
 * The actual TOIR records are always the default mode.
 */
export const usePreviewStore = defineStore('toir-visual-preview', () => {
  const enabled = ref(false)

  function setEnabled(value: boolean) {
    enabled.value = value
  }

  function toggle() {
    enabled.value = !enabled.value
  }

  return { enabled, setEnabled, toggle }
})
