import { useAuth } from '@/providers/auth-provider'

/**
 * Aparece só enquanto o Supabase não está no .env. Deixa explícito que o
 * login e os dados não são reais ainda.
 */
export function DemoBanner() {
  const { mode } = useAuth()

  if (mode !== 'demo') return null

  return (
    <p className="mt-4 rounded-xl bg-noite px-4 py-2.5 text-xs text-white/85">
      <span className="font-semibold text-white">Modo demonstração.</span> Sem login de verdade e
      com dados de exemplo — preencha as variáveis do Supabase no <code>.env</code> da raiz para
      ligar a plataforma.
    </p>
  )
}
