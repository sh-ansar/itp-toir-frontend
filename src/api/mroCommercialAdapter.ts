import { initializeCsrf } from './client'

interface Options {
  params?: Record<string, unknown>
  responseType?: string
  silent?: boolean
}

const prefix = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.BASE_URL === '/' ? '' : import.meta.env.BASE_URL)).replace(/\/$/, '')
const baseURL = prefix + '/api/v1'

function csrfToken(): string | null {
  const pair = document.cookie.split('; ').find((v) => v.startsWith('XSRF-TOKEN='))
  return pair ? decodeURIComponent(pair.slice(11)) : null
}

async function request(method: string, path: string, payload?: unknown, options: Options = {}) {
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Invalid API path')
  const url = new URL(baseURL + path, window.location.origin)
  for (const [key, value] of Object.entries(options.params || {})) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value))
  }
  if (method !== 'GET' && !csrfToken()) await initializeCsrf()
  const form = payload instanceof FormData
  const headers: Record<string, string> = { Accept: options.responseType === 'blob' ? 'application/pdf' : 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
  if (method !== 'GET') {
    const token = csrfToken()
    if (token) headers['X-XSRF-TOKEN'] = token
    if (payload !== undefined && !form) headers['Content-Type'] = 'application/json'
  }
  const response = await fetch(url.toString(), {
    method,
    credentials: 'include',
    headers,
    body: payload === undefined ? undefined : form ? (payload as FormData) : JSON.stringify(payload),
  })
  if (options.responseType === 'blob' && response.ok) return { data: await response.blob() }
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message = data?.message || (response.status === 403 ? 'Недостаточно прав' : 'Не удалось выполнить операцию')
    throw Object.assign(new Error(message), { data, response: { status: response.status, data }, status: response.status })
  }
  return { data }
}

const api = {
  defaults: { baseURL },
  get(path: string, options?: Options) { return request('GET', path, undefined, options) },
  post(path: string, body?: unknown, options?: Options) { return request('POST', path, body, options) },
  put(path: string, body?: unknown, options?: Options) { return request('PUT', path, body, options) },
  patch(path: string, body?: unknown, options?: Options) { return request('PATCH', path, body, options) },
  delete(path: string, options?: Options) { return request('DELETE', path, undefined, options) },
}
export default api
