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
 * Também espelha o usuário na nossa tabela `users`: o Supabase é a fonte da
 * verdade do login, mas precisamos do nome e do e-mail no nosso banco para
 * montar telas sem ir ao Supabase a cada consulta.
 */
export function requireAuth(db: Database, verifyToken: TokenVerifier): RequestHandler {
  return async (req, _res, next) => {
    const token = readBearerToken(req.headers.authorization)

    if (!token) {
      next(unauthorized())
      return
    }

    const user = await verifyToken(token)

    if (!user) {
      next(unauthorized('Sua sessão expirou. Entre de novo.', 'sessao_invalida'))
      return
    }

    await db
      .insert(users)
      .values({ id: user.id, email: user.email, fullName: user.fullName })
      .onConflictDoUpdate({
        target: users.id,
        set: { email: user.email, fullName: user.fullName, updatedAt: new Date() },
      })

    req.auth = user
    next()
  }
}
