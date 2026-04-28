import type {
  User,
  Issue,
  Project,
  IssueCreate,
  IssueUpdate,
  IssueStatus,
  IssuePriority,
  ProjectCreate,
  ProjectUpdate,
  TokenResponse,
} from '@/types'

// TODO (backend): Add GET /auth/me endpoint to fetch current user profile from token
// TODO (backend): Add ?project_id= filter to GET /issues for project-scoped views

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000/api/v1'

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  { redirectOn401 = true } = {},
): Promise<T> {
  const token = getToken()

  const defaultHeaders: Record<string, string> = {}
  if (typeof options.body === 'string') {
    defaultHeaders['Content-Type'] = 'application/json'
  }
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...(options.headers as Record<string, string>),
    },
  })

  if (response.status === 401) {
    const data = await response.json().catch(() => ({}))
    const msg = data?.detail ?? 'Session expired. Please log in again.'
    if (redirectOn401 && typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      window.location.href = '/login'
    }
    throw new ApiError(401, typeof msg === 'string' ? msg : JSON.stringify(msg))
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const msg = data?.detail ?? `Request failed: ${response.status}`
    throw new ApiError(response.status, typeof msg === 'string' ? msg : JSON.stringify(msg))
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const authApi = {
  login(email: string, password: string) {
    const body = new URLSearchParams()
    body.set('username', email)
    body.set('password', password)
    return request<TokenResponse>(
      '/auth/login',
      { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() },
      { redirectOn401: false },
    )
  },

  register(data: { email: string; password: string; username: string; name?: string }) {
    return request<User>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify(data) },
      { redirectOn401: false },
    )
  },
}

export const issuesApi = {
  list(params?: {
    status?: IssueStatus
    priority?: IssuePriority
    page?: number
    limit?: number
  }) {
    const q = new URLSearchParams()
    if (params?.status) q.set('status', params.status)
    if (params?.priority) q.set('priority', params.priority)
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    const qs = q.size ? `?${q.toString()}` : ''
    return request<Issue[]>(`/issues${qs}`)
  },

  get(id: number) {
    return request<Issue>(`/issues/${id}`)
  },

  create(data: IssueCreate) {
    return request<Issue>('/issues', { method: 'POST', body: JSON.stringify(data) })
  },

  update(id: number, data: IssueUpdate) {
    return request<Issue>(`/issues/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  delete(id: number) {
    return request<{ message: string }>(`/issues/${id}`, { method: 'DELETE' })
  },
}

export const projectsApi = {
  list(params?: { page?: number; limit?: number }) {
    const q = new URLSearchParams()
    if (params?.page) q.set('page', String(params.page))
    if (params?.limit) q.set('limit', String(params.limit))
    const qs = q.size ? `?${q.toString()}` : ''
    return request<Project[]>(`/projects${qs}`)
  },

  get(id: number) {
    return request<Project>(`/projects/${id}`)
  },

  create(data: ProjectCreate) {
    return request<Project>('/projects', { method: 'POST', body: JSON.stringify(data) })
  },

  update(id: number, data: ProjectUpdate) {
    return request<Project>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
  },

  delete(id: number) {
    return request<{ message: string }>(`/projects/${id}`, { method: 'DELETE' })
  },
}
