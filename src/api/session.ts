import { api, initializeCsrf } from './client'

export interface User {
  id: number
  name: string
  email: string
  is_active: boolean
}

export interface Company {
  id: number
  name: string
  code: string
  role: 'owner' | 'admin' | 'manager' | 'engineer' | 'technician' | 'viewer'
}

export interface SessionData {
  user: User
  companies: Company[]
  active_company_id: number | null
  active_role: Company['role'] | null
}

type DataResponse<T> = { data: T }
type MessageResponse = { message: string }

export async function currentSession(): Promise<SessionData> {
  return (await api<DataResponse<SessionData>>('/api/v1/auth/me')).data
}

export async function loginSession(email: string, password: string): Promise<SessionData> {
  await initializeCsrf()
  return (await api<DataResponse<SessionData>>('/api/v1/auth/login', {
    method: 'POST', body: { email, password }
  })).data
}

export async function logoutSession(): Promise<void> {
  await api<MessageResponse>('/api/v1/auth/logout', { method: 'POST' })
}

export async function switchCompany(company_id: number): Promise<SessionData> {
  return (await api<DataResponse<SessionData>>('/api/v1/auth/companies/switch', {
    method: 'POST', body: { company_id }
  })).data
}

export async function requestReset(email: string): Promise<string> {
  await initializeCsrf()
  return (await api<MessageResponse>('/api/v1/auth/password/forgot', {
    method: 'POST', body: { email }
  })).message
}

export async function confirmReset(data: {
  email: string; token: string; password: string; password_confirmation: string
}): Promise<string> {
  await initializeCsrf()
  return (await api<MessageResponse>('/api/v1/auth/password/reset', {
    method: 'POST', body: data
  })).message
}

export async function changePassword(data: {
  current_password: string; password: string; password_confirmation: string
}): Promise<string> {
  return (await api<MessageResponse>('/api/v1/auth/password', {
    method: 'PUT', body: data
  })).message
}

export async function apiHealth(): Promise<boolean> {
  try {
    const health = await api<{ status: string; service: string }>('/api/v1/health')
    return health.status === 'ok' && health.service === 'itp-toir-api'
  } catch {
    return false
  }
}
