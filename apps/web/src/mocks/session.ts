import type { Role } from '@firmus/shared'

/**
 * Usuário e empresa do modo demonstração, usados quando o Supabase ainda não
 * está no .env. Com o Supabase configurado, estes dados não são lidos:
 * tudo vem de GET /me.
 */
export const currentUser = {
  name: 'Matheus Gomes',
  email: 'matheus@studioaura.com.br',
  role: 'chefe' as Role,
}

export const currentCompany = {
  name: 'Studio Aura',
  segment: 'Estética e bem-estar · Mossoró/RN',
  instagram: '@studioaura.mossoro',
}

export const roleLabel: Record<Role, string> = {
  chefe: 'Chefe',
  funcionario: 'Funcionário',
}
