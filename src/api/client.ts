export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
    this.name = 'ApiError'
  }
}

const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

function csrfHeader(): string | undefined {
  const item = document.cookie.split('; ').find((cookie) => cookie.startsWith('XSRF-TOKEN='))
  if (!item) return undefined
  return decodeURIComponent(item.slice('XSRF-TOKEN='.length))
}

export async function initializeCsrf(): Promise<void> {
  const response = await fetch(base + '/sanctum/csrf-cookie', {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
  })
  if (!response.ok) throw new ApiError('Не удалось открыть защищённую сессию.', response.status)
}

export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const method = options.method || 'GET'
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (method !== 'GET') {
    const token = csrfHeader()
    if (token) headers['X-XSRF-TOKEN'] = token
  }

  let response: Response
  try {
    response = await fetch(base + path, {
      method,
      credentials: 'include',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    })
  } catch {
    throw new ApiError('Сервер ТОИР недоступен. Проверьте подключение.', 0)
  }

  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    let message = response.status === 401 ? 'Сессия завершена. Войдите снова.' :
      response.status === 419 ? 'Сессия устарела. Обновите страницу и повторите попытку.' :
      'Не удалось выполнить операцию.'
    if (payload && typeof payload === 'object' && 'message' in payload &&
        typeof payload.message === 'string') {
      message = payload.message
    }
    throw new ApiError(message, response.status)
  }
  return payload as T
}
