import type { PlatformRole, Role } from '@firmus/shared'

/** Quem é o usuário: identidade do Supabase mais o papel de plataforma, que é nosso. */
export type AuthUser = {
  id: string
  email: string
  fullName: string
  /** Só a equipe da Firmus tem. Nulo para todo mundo mais. */
  platformRole: PlatformRole | null
}

/** De qual empresa ele é e o que pode fazer lá. Sempre do banco, nunca do navegador. */
export type CompanyContext = {
  companyId: string
  role: Role
  /**
   * Verdadeiro quando quem está vendo é um operador da Firmus olhando a
   * empresa de um cliente. Rotas com dado pessoal de terceiros usam isto
   * para barrar o acesso.
   */
  asOperator: boolean
}

/**
 * Troca o token do cabeçalho Authorization por uma identidade.
 * Em produção é o Supabase; nos testes, uma função falsa.
 *
 * Note que ela não devolve platformRole: esse papel é nosso, não do Supabase,
 * e sai da nossa tabela `users`.
 */
export type TokenVerifier = (token: string) => Promise<Omit<AuthUser, 'platformRole'> | null>

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthUser
      company?: CompanyContext
    }
  }
}
