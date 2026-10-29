import { Navigate, Outlet } from 'react-router'
import { Splash } from '@/components/splash'
import { useAuth } from '@/providers/auth-provider'

/** Exige login. Sem empresa, manda criar uma. */
export function RequireCompany() {
  const { loading, user, company } = useAuth()

  if (loading) return <Splash />
  if (!user) return <Navigate to="/entrar" replace />
  if (!company) return <Navigate to="/criar-empresa" replace />

  return <Outlet />
}

/** Exige login, mas não exige empresa. Para a tela de criar empresa. */
export function RequireUser() {
  const { loading, user } = useAuth()

  if (loading) return <Splash />
  if (!user) return <Navigate to="/entrar" replace />

  return <Outlet />
}

/**
 * Telas de entrada. Quem já está logado é mandado para dentro.
 * Em modo demonstração não redirecionamos, para dar para ver o desenho delas.
 */
export function GuestOnly() {
  const { loading, user, company, mode } = useAuth()

  if (loading) return <Splash />
  if (user && mode === 'supabase') {
    return <Navigate to={company ? '/painel' : '/criar-empresa'} replace />
  }

  return <Outlet />
}
