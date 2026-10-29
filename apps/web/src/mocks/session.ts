import type { Role } from '@firmus/shared'

/**
 * Sessão de exemplo. Na Etapa 2 isso vem do Supabase Auth e da tabela memberships.
 * Troque `role` para 'funcionario' se quiser ver a plataforma com menos permissões.
 */
export const currentUser = {
  name: 'Matheus Gomes',
  email: 'matheus@studioaura.com.br',
  initials: 'MG',
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
