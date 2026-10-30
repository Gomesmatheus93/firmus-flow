import { createClient } from '@supabase/supabase-js'
import type { TokenVerifier } from './types'

/**
 * Valida o token perguntando ao próprio Supabase quem é o dono dele.
 *
 * Usa a chave pública de propósito: para responder "de quem é este token?" ela
 * basta, e assim a chave de administrador não fica carregada numa rota que
 * recebe pedido de qualquer um. Menor privilégio.
 *
 * É uma chamada de rede por requisição, mas funciona tanto com as chaves
 * antigas quanto com as novas, sem reimplementar verificação de assinatura.
 */
export function createSupabaseVerifier(url: string, publicKey: string): TokenVerifier {
  const client = createClient(url, publicKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  return async (token) => {
    const { data, error } = await client.auth.getUser(token)

    if (error || !data.user?.email) return null

    const metadata = data.user.user_metadata
    const fullName = typeof metadata?.full_name === 'string' ? metadata.full_name : null

    return {
      id: data.user.id,
      email: data.user.email,
      fullName: fullName?.trim() || data.user.email,
    }
  }
}
