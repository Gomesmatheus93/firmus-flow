import {
  BarChart3,
  Brain,
  Building2,
  CalendarDays,
  CalendarClock,
  CheckCheck,
  Contact,
  Flame,
  Gauge,
  LayoutDashboard,
  MessageSquareReply,
  MessagesSquare,
  Receipt,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
  FileImage,
  GalleryHorizontalEnd,
  Grid3x3,
  BookOpen,
  FileVideoCamera,
} from 'lucide-react'
import type { PlatformRole, Role } from '@firmus/shared'

export type NavItem = {
  label: string
  to: string
  icon: LucideIcon
  /** Linha curta embaixo do nome, no menu. Ausente = só o nome. */
  description?: string
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
      {
        label: 'Planejamento',
        to: '/planejamento',
        icon: CalendarDays,
        description: 'O calendário de postagens',
      },
      {
        label: 'Aprovações',
        to: '/aprovacoes',
        icon: CheckCheck,
        description: 'O que espera sua decisão',
      },
    ],
  },
  {
    label: 'Criar',
    items: [
      {
        label: 'Carrossel',
        to: '/criar/carrossel',
        icon: GalleryHorizontalEnd,
        description: 'Slides para o feed',
      },
      {
        label: 'Post',
        to: '/criar/post',
        icon: FileImage,
        description: 'Arte e legenda para o feed',
      },
      {
        label: 'Post Story',
        to: '/criar/story',
        icon: BookOpen,
        description: 'Sequência do dia em 9:16',
      },
      {
        label: 'Roteiro de reels',
        to: '/criar/reel',
        icon: FileVideoCamera,
        description: 'Gancho e roteiro falado',
      },
    ],
  },
  {
    label: 'Crescimento',
    items: [
      { label: 'Tendências', to: '/tendencias', icon: Flame },
      { label: 'Analytics', to: '/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Publicação',
    items: [
      { label: 'Programador', to: '/programador', icon: CalendarClock },
      {
        label: 'Prévia do feed',
        to: '/feed',
        icon: Grid3x3,
        description: 'Como o perfil vai ficar',
      },
      { label: 'Comentários', to: '/comentarios', icon: MessageSquareReply },
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

/** Grupo que só a equipe da Firmus enxerga. */
const firmusGroup: NavGroup = {
  label: 'Firmus',
  items: [
    { label: 'Visão geral', to: '/admin', icon: ShieldCheck },
    { label: 'Empresas', to: '/admin/empresas', icon: Building2 },
    { label: 'Planos', to: '/admin/planos', icon: Receipt },
  ],
}

export function visibleGroups(role: Role, platformRole?: PlatformRole | null): NavGroup[] {
  const base = platformRole === 'operador' ? [firmusGroup, ...navGroups] : navGroups

  return base
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles || item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0)
}
