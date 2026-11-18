import { Link, NavLink } from 'react-router'
import { cn } from 'cn'
import { Logo } from '@/components/logo'
import { useAuth } from '@/providers/auth-provider'
import { visibleGroups, type NavItem } from './nav-items'

function SidebarLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon

  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
          isActive
            ? 'bg-azul font-medium text-white shadow-[0_6px_16px_-6px_rgb(28_140_255/0.7)]'
            : 'text-white/65 hover:bg-white/[0.06] hover:text-white',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn('size-[1.125rem] shrink-0', isActive ? 'text-white' : 'text-white/45')}
          />
          <span className="min-w-0">
            <span className="block truncate">{item.label}</span>
            {item.description && (
              <span
                className={cn(
                  'block truncate text-xs font-normal',
                  isActive ? 'text-white/75' : 'text-white/40',
                )}
              >
                {item.description}
              </span>
            )}
          </span>
        </>
      )}
    </NavLink>
  )
}

/**
 * A barra lateral: azul-noite de cima a baixo, item ativo numa pílula Azul
 * Firmus — o desenho das referências SaaS aprovadas em 18/11/2026. Quem está
 * logado e o menu de sair moravam aqui; agora ficam na barra do topo.
 */
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { company, user } = useAuth()
  const groups = visibleGroups(company?.role ?? 'funcionario', user?.platformRole)

  return (
    <div className="flex h-full flex-col bg-lateral">
      <div className="px-6 pt-6 pb-5">
        <Link to="/painel" onClick={onNavigate} className="inline-flex">
          <Logo tone="light" />
        </Link>
      </div>

      <div className="px-4">
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] px-3 py-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-ciano/15 text-xs font-semibold text-ciano">
            {company?.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-white">{company?.name}</span>
            <span className="block truncate text-xs text-white/45">{company?.segment}</span>
          </span>
        </div>
      </div>

      <nav className="dark-scroll flex-1 space-y-5 overflow-y-auto px-4 py-5">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="label px-3 pb-2 text-white/35">{group.label}</p>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.to}>
                  <SidebarLink item={item} onNavigate={onNavigate} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  )
}
