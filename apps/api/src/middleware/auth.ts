import type { Database } from '@firmus/db'
import { users } from '@firmus/db/schema'
import type { RequestHandler } from 'express'
import { unauthorized } from '../http/errors'
import type { TokenVerifier } from '../auth/types'

function readBearerToken(header: string | undefined): string | null {
  if (!header) return null
  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null
  return token
}

/**
 * Exige um token válido e anexa o usuário em req.auth.
 *
 * Também espelha o usuário na nossa tabela `users`. O `platformRole` vem da
 * linha devolvida por esse espelhamento, e nunca do token: quem decide se
 * alguém é operador é o nosso banco, não o Supabase nem o navegador.
 */
export function requireAuth(db: Database, verifyToken: TokenVerifier): RequestHandler {
  return async (req, _res, next) => {
    const token = readBearerToken(req.headers.authorization)

    if (!token) {
      next(unauthorized())
      return
    }

    const identidade = await verifyToken(token)

    if (!identidade) {
      next(unauthorized('Sua sessão expirou. Entre de novo.', 'sessao_invalida'))
      return
    }

    const [linha] = await db
      .insert(users)
      .values({
        id: identidade.id,
        email: identidade.email,
        fullName: identidade.fullName,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: { email: identidade.email, fullName: identidade.fullName, updatedAt: new Date() },
      })
      .returning({ platformRole: users.platformRole })

    req.auth = { ...identidade, platformRole: linha?.platformRole ?? null }
    next()
  }
}
