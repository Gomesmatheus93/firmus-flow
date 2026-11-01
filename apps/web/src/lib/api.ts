import { apiBaseUrl } from './env'
import { lerEmpresaEscolhida } from './operator'
import { supabase } from './supabase'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function accessToken(): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

/**
 * Chama a api anexando o token da sessão do Supabase.
 *
 * Quando há empresa escolhida (só acontece para a equipe da Firmus), manda
 * também o cabeçalho X-Firmus-Company. A api confere o papel no banco antes
 * de obedecer: para quem não é operador, o cabeçalho é ignorado.
 *
 * O erro vem da api já em português, então repassamos a mensagem como está.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await accessToken()
  const empresa = lerEmpresaEscolhida()

  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (empresa) headers.set('X-Firmus-Company', empresa.id)

  const response = await fetch(`${apiBaseUrl}${path}`, { ...init, headers })

  if (response.status === 204) return undefined as T

  const body: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const error =
      body && typeof body === 'object' && 'error' in body
        ? (body.error as { message?: string; code?: string })
        : null

    throw new ApiError(
      response.status,
      error?.message ?? 'Não foi possível concluir. Tente de novo.',
      error?.code ?? 'erro_desconhecido',
    )
  }

  return body as T
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
}
