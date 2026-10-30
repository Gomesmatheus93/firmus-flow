import type { Role } from '@firmus/shared'

/**
 * Usuário e empresa de vitrine, usados só quando o Supabase não está no .env.
 * Serve para a casca abrir e você conseguir navegar — sem isso você só veria a
 * tela de login.
 *
 * Isto é sessão, não conteúdo: nenhuma tela inventa dado. Com o Supabase
 * configurado, tudo vem de GET /me.
 */
export const demoUser = {
  name: 'Visitante',
  email: 'visitante@firmus.tech',
  role: 'chefe' as Role,
}

export const demoCompany = {
  name: 'Empresa de demonstração',
  segment: 'Configure o Supabase para usar sua empresa',
  instagram: null,
}

export const roleLabel: Record<Role, string> = {
  chefe: 'Chefe',
  funcionario: 'Funcionário',
}
