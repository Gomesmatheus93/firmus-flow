import { ShieldAlert, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { sairDaEmpresa } from '@/lib/operator'
import { useAuth } from '@/providers/auth-provider'

/**
 * Faixa sempre visível enquanto a equipe da Firmus está olhando a empresa de
 * um cliente.
 *
 * Sem ela é questão de tempo até confundir os dados de um cliente com os de
 * outro — e, pior, tomar decisão em cima da empresa errada.
 */
export function OperatorBanner() {
  const { company } = useAuth()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  if (!company?.viewedAsOperator) return null

  function sair() {
    sairDaEmpresa()
    queryClient.clear()
    void navigate('/admin', { replace: true })
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-amber-400 px-4 py-2.5">
      <ShieldAlert className="size-4 shrink-0 text-amber-950" />
      <p className="min-w-0 flex-1 text-sm text-amber-950">
        Você está vendo <span className="font-semibold">{company.name}</span> como operador da
        Firmus. Este acesso fica registrado.
      </p>
      <button
        type="button"
        onClick={sair}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-950 px-3 py-1.5 text-xs font-medium text-amber-50 transition-opacity hover:opacity-90"
      >
        <X className="size-3" />
        Sair da empresa
      </button>
    </div>
  )
}
