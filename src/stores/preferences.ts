import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type Locale = 'ru' | 'en' | 'ka'
export type Theme = 'light' | 'dark'

function savedValue<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value && allowed.includes(value as T) ? value as T : fallback
  } catch {
    return fallback
  }
}

function readSidebarCollapsed(): boolean {
  try { return localStorage.getItem('toir-sidebar-collapsed') === 'true' }
  catch { return false }
}

export const usePreferencesStore = defineStore('preferences', () => {
  const theme = ref<Theme>(savedValue('toir-theme', ['light', 'dark'], 'light'))
  const locale = ref<Locale>(savedValue('toir-locale', ['ru', 'en', 'ka'], 'ru'))
  const sidebarCollapsed = ref(readSidebarCollapsed())

  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  watch(sidebarCollapsed, value => {
    try { localStorage.setItem('toir-sidebar-collapsed', String(value)) }
    catch { /* Local storage may be disabled. */ }
  })

  watch(theme, value => {
    document.documentElement.dataset.theme = value
    try { localStorage.setItem('toir-theme', value) } catch { /* browser storage disabled */ }
  }, { immediate: true })

  watch(locale, value => {
    document.documentElement.lang = value
    try { localStorage.setItem('toir-locale', value) } catch { /* browser storage disabled */ }
  }, { immediate: true })

  function toggleTheme(): void {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }
  return { theme, locale, sidebarCollapsed, toggleSidebar, toggleTheme }
})
