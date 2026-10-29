import type { Role } from '@firmus/shared'

export const members = [
  {
    id: 'm1',
    name: 'Matheus Gomes',
    email: 'matheus@studioaura.com.br',
    initials: 'MG',
    role: 'chefe' as Role,
    joinedAt: '12/08/2026',
  },
  {
    id: 'm2',
    name: 'Ana Beatriz Dias',
    email: 'ana@studioaura.com.br',
    initials: 'AB',
    role: 'funcionario' as Role,
    joinedAt: '03/09/2026',
  },
  {
    id: 'm3',
    name: 'Rafael Tavares',
    email: 'rafael@studioaura.com.br',
    initials: 'RT',
    role: 'funcionario' as Role,
    joinedAt: '21/09/2026',
  },
]

export const pendingInvites = [
  {
    id: 'iv1',
    email: 'camila@studioaura.com.br',
    role: 'funcionario' as Role,
    sentAt: '26/10/2026',
  },
]
