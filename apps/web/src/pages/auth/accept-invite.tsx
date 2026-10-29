import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useAuth } from '@/providers/auth-provider'
import { AuthLayout } from './auth-layout'
import { FormError } from './form-error'

type InviteResponse = {
  invitation: { email: string; role: string; companyName: string }
}

/**
 * Tela do link de convite. A consulta é pública de propósito: quem recebe o
 * link normalmente ainda não tem conta e precisa ver de qual empresa é o
 * convite antes de se cadastrar.
 */
export function AcceptInvitePage() {
  const { token } = useParams()
  const { user, refresh } = useAuth()
  const navigate = useNavigate()

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const invite = useQuery({
    queryKey: ['invite', token],
    queryFn: () => api.get<InviteResponse>(`/invitations/${token}`),
    retry: false,
  })

  async function accept() {
    setError(null)
    setSubmitting(true)

    try {
      await api.post(`/invitations/${token}/accept`)
      await refresh()
      void navigate('/painel', { replace: true })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível aceitar o convite.')
    } finally {
      setSubmitting(false)
    }
  }

  if (invite.isPending) {
    return (
      <AuthLayout title="Convite" description="Conferindo o convite..." footer={null}>
        <div className="h-20" />
      </AuthLayout>
    )
  }

  if (invite.isError) {
    return (
      <AuthLayout
        title="Convite inválido"
        description={
          invite.error instanceof Error
            ? invite.error.message
            : 'Este convite não existe ou já foi usado.'
        }
        footer={
          <Link to="/entrar" className="text-ciano hover:underline">
            Ir para a entrada
          </Link>
        }
      >
        <div className="h-4" />
      </AuthLayout>
    )
  }

  const { companyName, email } = invite.data.invitation

  return (
    <AuthLayout
      title={`Entrar na ${companyName}`}
      description={`O convite foi enviado para ${email}.`}
      footer={
        user ? null : (
          <>
            Crie sua conta com esse e-mail e volte a este link.{' '}
            <Link to="/criar-conta" className="text-ciano hover:underline">
              Criar conta
            </Link>
          </>
        )
      }
    >
      <div className="grid gap-4">
        <FormError message={error} />

        {user ? (
          <Button
            onClick={() => void accept()}
            disabled={submitting}
            className="w-full bg-linear-to-r from-firme to-ciano text-gelo shadow-lg shadow-firme/25 hover:opacity-90"
          >
            {submitting ? 'Entrando...' : 'Aceitar convite'}
            {!submitting && <ArrowRight />}
          </Button>
        ) : (
          <Button asChild variant="outline" className="w-full">
            <Link to="/entrar">Já tenho conta, entrar</Link>
          </Button>
        )}
      </div>
    </AuthLayout>
  )
}
