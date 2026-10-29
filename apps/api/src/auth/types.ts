import type { Role } from '@firmus/shared'

/** Quem é o usuário, segundo o Supabase Auth. */
export type AuthUser = {
  id: string
  email: string
  fullName: string
}

/** De qual empresa ele é e o que pode fazer lá. Sempre vem do banco, nunca do navegador. */
export type CompanyContext = {
  companyId: string
  role: Role
}

/**
 * Troca o token do cabeçalho Authorization por um usuário.
 * Em produção é o Supabase; nos testes, uma função falsa.
 */
export type TokenVerifier = (token: string) => Promise<AuthUser | null>

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthUser
      company?: CompanyContext
    }
  }
}
