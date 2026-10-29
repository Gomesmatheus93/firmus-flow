import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from './auth-layout'

export function SignInPage() {
  return (
    <AuthLayout
      title="Entrar"
      description="Acesse o painel da sua empresa."
      footer={
        <>
          Ainda não tem conta?{' '}
          <Link to="/criar-conta" className="text-ciano hover:underline">
            Criar conta
          </Link>
        </>
      }
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault()
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" placeholder="voce@empresa.com.br" autoComplete="email" />
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="senha">Senha</Label>
            <Link to="/entrar" className="text-xs text-muted-foreground hover:text-ciano">
              Esqueci a senha
            </Link>
          </div>
          <Input id="senha" type="password" autoComplete="current-password" />
        </div>

        <Button
          type="submit"
          className="mt-2 w-full bg-linear-to-r from-firme to-ciano text-gelo shadow-lg shadow-firme/25 hover:opacity-90"
        >
          Entrar
          <ArrowRight />
        </Button>
      </form>
    </AuthLayout>
  )
}
