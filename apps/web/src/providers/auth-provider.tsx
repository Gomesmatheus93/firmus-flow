import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, use, useEffect, useState, type ReactNode } from 'react'
import type { Role } from '@firmus/shared'
import { api } from '@/lib/api'
import { isDemoMode } from '@/lib/env'
import { supabase } from '@/lib/supabase'
import { currentCompany, currentUser } from '@/mocks/session'

export type SessionUser = { id: string; email: string; fullName: string }

export type SessionCompany = {
  id: string
  name: string
  segment: string | null
  instagramHandle: string | null
  role: Role
}

type MeResponse = { user: SessionUser; company: SessionCompany | null }

type AuthValue = {
  /** 'demo' quando o Supabase não está configurado no .env. */
  mode: 'demo' | 'supabase'
  loading: boolean
  /** Nulo quando ninguém está logado. */
  user: SessionUser | null
  /** Nulo quando o usuário ainda não criou nem entrou numa empresa. */
  company: SessionCompany | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (fullName: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  /** Rebusca /me — use depois de criar empresa ou aceitar convite. */
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

const demoValue: AuthValue = {
  mode: 'demo',
  loading: false,
  user: { id: 'demo', email: currentUser.email, fullName: currentUser.name },
  company: {
    id: 'demo',
    name: currentCompany.name,
    segment: currentCompany.segment,
    instagramHandle: currentCompany.instagram,
    role: currentUser.role,
  },
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refresh: async () => {},
}

function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  useEffect(() => {
    if (!supabase) return

    void supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session))
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session))
      void queryClient.invalidateQueries({ queryKey: ['me'] })
    })

    return () => data.subscription.unsubscribe()
  }, [queryClient])

  const me = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<MeResponse>('/me'),
    enabled: hasSession === true,
    retry: false,
  })

  const value: AuthValue = {
    mode: 'supabase',
    loading: hasSession === null || (hasSession && me.isPending),
    user: hasSession ? (me.data?.user ?? null) : null,
    company: hasSession ? (me.data?.company ?? null) : null,

    async signIn(email, password) {
      const { error } = await supabase!.auth.signInWithPassword({ email, password })
      if (error) throw new Error(traduzErroSupabase(error.message))
    },

    async signUp(fullName, email, password) {
      const { error } = await supabase!.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (error) throw new Error(traduzErroSupabase(error.message))
    },

    async signOut() {
      await supabase!.auth.signOut()
      queryClient.clear()
    },

    async refresh() {
      await queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  }

  return <AuthContext value={value}>{children}</AuthContext>
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (isDemoMode) {
    return <AuthContext value={demoValue}>{children}</AuthContext>
  }

  return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>
}

export function useAuth(): AuthValue {
  const value = use(AuthContext)
  if (!value) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return value
}

/** O Supabase responde em inglês; estas são as mensagens que o usuário mais vê. */
function traduzErroSupabase(message: string): string {
  const normalized = message.toLowerCase()

  if (normalized.includes('invalid login credentials')) return 'E-mail ou senha incorretos.'
  if (normalized.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar. Procure a mensagem na sua caixa de entrada.'
  }
  if (normalized.includes('user already registered')) {
    return 'Já existe uma conta com esse e-mail. Tente entrar.'
  }
  if (normalized.includes('password should be at least')) {
    return 'A senha precisa ter pelo menos 6 caracteres.'
  }

  return message
}
