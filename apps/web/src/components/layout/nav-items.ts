import {
  Brain,
  CalendarDays,
  CheckCheck,
  Contact,
  Gauge,
  Images,
  LayoutDashboard,
  MessagesSquare,
  PenLine,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { Role } from '@firmus/shared'

export type NavItem = {
  label: string
  to: string
  icon: LucideIcon
  /** Ausente = todos os papéis veem. */
  roles?: Role[]
}

export type NavGroup = {
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: 'Principal',
    items: [{ label: 'Painel', to: '/painel', icon: LayoutDashboard }],
  },
  {
    label: 'Marca',
    items: [
      { label: 'Cérebro da Marca', to: '/marca', icon: Brain },
      { label: 'Auditoria', to: '/auditoria', icon: Gauge },
    ],
  },
  {
    label: 'Conteúdo',
    items: [
      { label: 'Planejamento', to: '/planejamento', icon: CalendarDays },
      { label: 'Textos e legendas', to: '/conteudo', icon: PenLine },
      { label: 'Artes', to: '/artes', icon: Images },
      { label: 'Aprovações', to: '/aprovacoes', icon: CheckCheck },
    ],
  },
  {
    label: 'Atendimento',
    items: [
      { label: 'Conversas', to: '/conversas', icon: MessagesSquare },
      { label: 'Leads', to: '/leads', icon: Contact },
    ],
  },
  {
    label: 'Empresa',
    items: [
      { label: 'Equipe', to: '/equipe', icon: Users, roles: ['chefe'] },
      { label: 'Configurações', to: '/configuracoes', icon: Settings },
    ],
  },
]

export function visibleGroups(role: Role): NavGroup[] {
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles || item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0)
}
