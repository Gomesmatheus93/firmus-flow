import { createClient } from '@supabase/supabase-js'
import type { TokenVerifier } from './types'

/**
 * Valida o token perguntando ao próprio Supabase quem é o dono dele.
 * É uma chamada de rede por requisição, mas é a forma que funciona tanto com
 * chave simétrica quanto com as chaves assimétricas novas, sem reimplementar
 * verificação de assinatura aqui.
 */
export function createSupabaseVerifier(url: string, serviceRoleKey: string): TokenVerifier {
  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  return async (token) => {
    const { data, error } = await admin.auth.getUser(token)

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
