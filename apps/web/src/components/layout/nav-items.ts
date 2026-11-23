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

/**
 * O menu, em seções pelo que a pessoa vai fazer: planejar, criar, publicar,
 * atender e medir. Só o nome em cada item: a barra lateral é clara e enxuta.
 */
export const navGroups: NavGroup[] = [
  {
    label: 'Módulos',
    items: [{ label: 'Painel', to: '/painel', icon: LayoutDashboard }],
  },
  {
    label: 'Planejar',
    items: [
      { label: 'Planejamento', to: '/planejamento', icon: CalendarDays },
      { label: 'Aprovações', to: '/aprovacoes', icon: CheckCheck },
    ],
  },
  {
    label: 'Criar',
    items: [
      { label: 'Carrossel', to: '/criar/carrossel', icon: GalleryHorizontalEnd },
      { label: 'Post', to: '/criar/post', icon: FileImage },
      { label: 'Stories', to: '/criar/story', icon: BookOpen },
      { label: 'Roteiro de reels', to: '/criar/reel', icon: FileVideoCamera },
    ],
  },
  {
    label: 'Publicar',
    items: [
      { label: 'Programador', to: '/programador', icon: CalendarClock },
      { label: 'Prévia do feed', to: '/feed', icon: Grid3x3 },
      { label: 'Automação de comentários', to: '/comentarios', icon: MessageSquareReply },
    ],
  },
  {
    label: 'Atender',
    items: [
      { label: 'Conversas', to: '/conversas', icon: MessagesSquare },
      { label: 'Leads', to: '/leads', icon: Contact },
    ],
  },
  {
    label: 'Medir',
    items: [
      { label: 'Analytics', to: '/analytics', icon: BarChart3 },
      { label: 'Tendências', to: '/tendencias', icon: Flame },
      { label: 'Auditoria', to: '/auditoria', icon: Gauge },
    ],
  },
  {
    label: 'Marca',
    items: [{ label: 'Cérebro da Marca', to: '/marca', icon: Brain }],
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

/**
 * O nome da tela aberta, para o topo da página: o item do menu cujo endereço
 * mais combina com o atual. Fora do menu, `null`.
 */
export function pageTitleFor(pathname: string): string | null {
  const itens = [firmusGroup, ...navGroups].flatMap((g) => g.items)
  const achado = itens
    .filter((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0]
  return achado?.label ?? null
}
