import { ref } from 'vue'
import { defineStore } from 'pinia'
import { ApiError } from '../api/client'
import {
  currentSession, loginSession, logoutSession, switchCompany,
  type SessionData
} from '../api/session'

export const useSessionStore = defineStore('session', () => {
  const session = ref<SessionData | null>(null)
  const checked = ref(false)
  const loading = ref(false)
  const error = ref('')

  async function refresh(): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      session.value = await currentSession()
    } catch (cause) {
      session.value = null
      if (!(cause instanceof ApiError && cause.status === 401)) {
        error.value = cause instanceof Error ? cause.message : 'Не удалось проверить сессию'
      }
    } finally {
      checked.value = true
      loading.value = false
    }
  }

  async function login(email: string, password: string): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      session.value = await loginSession(email.trim().toLowerCase(), password)
      checked.value = true
    } catch (cause) {
      session.value = null
      error.value = cause instanceof Error ? cause.message : 'Ошибка входа'
      throw cause
    } finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      await logoutSession()
      session.value = null
      checked.value = true
    } finally {
      loading.value = false
    }
  }

  async function chooseCompany(id: number): Promise<void> {
    loading.value = true
    try {
      session.value = await switchCompany(id)
    } finally {
      loading.value = false
    }
  }

  return { session, checked, loading, error, refresh, login, logout, chooseCompany }
})
