// OmniAI - Client API
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: any
  token?: string
}

/**
 * Client API générique
 */
export async function api<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options

  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Erreur API')
  }

  return res.json()
}

// Endpoints spécifiques
export const chatApi = {
  send: (message: string, conversationId?: string, token?: string) =>
    api<{ message: string; conversationId: string }>('/api/chat', {
      method: 'POST',
      body: { message, conversationId },
      token
    }),

  getHistory: (token: string) =>
    api<any[]>('/api/chat/history', { token })
}

export const codeApi = {
  generate: (prompt: string, language?: string, token?: string) =>
    api<{ code: string; language: string }>('/api/code', {
      method: 'POST',
      body: { prompt, language },
      token
    }),

  fix: (code: string, error?: string, token?: string) =>
    api<{ fixedCode: string }>('/api/code/fix', {
      method: 'POST',
      body: { code, error },
      token
    }),

  explain: (code: string, token?: string) =>
    api<{ explanation: string }>('/api/code/explain', {
      method: 'POST',
      body: { code },
      token
    })
}

export const imageApi = {
  generate: (prompt: string, style?: string, size?: string, token?: string) =>
    api<{ id: string; url: string; revisedPrompt: string }>('/api/image/generate', {
      method: 'POST',
      body: { prompt, style, size },
      token
    }),

  get: (id: string, token: string) =>
    api<any>(`/api/image/${id}`, { token })
}

export const videoApi = {
  generate: async (images: File[], prompt: string, model: string, token?: string): Promise<{ jobId: string; status: string }> => {
    const formData = new FormData()
    images.forEach(img => formData.append('images', img))
    formData.append('prompt', prompt)
    formData.append('model', model)

    const headers: HeadersInit = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${API_URL}/api/video/generate`, {
      method: 'POST',
      headers,
      body: formData
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Erreur API')
    }

    return res.json()
  },

  getStatus: (id: string, token: string) =>
    api<{ status: string; progress: number; videoUrl?: string }>(`/api/video/${id}/status`, { token })
}
