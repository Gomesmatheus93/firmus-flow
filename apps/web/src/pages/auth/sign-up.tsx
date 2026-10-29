import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthLayout } from './auth-layout'

export function SignUpPage() {
  return (
    <AuthLayout
      title="Criar conta"
      description="Em dois minutos sua empresa está dentro."
      footer={
        <>
          Já tem conta?{' '}
          <Link to="/entrar" className="text-ciano hover:underline">
            Entrar
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
          <Label htmlFor="nome">Seu nome</Label>
          <Input id="nome" placeholder="Matheus Gomes" autoComplete="name" />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" placeholder="voce@empresa.com.br" autoComplete="email" />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="senha">Senha</Label>
          <Input id="senha" type="password" autoComplete="new-password" />
          <p className="text-xs text-muted-foreground">Pelo menos 8 caracteres.</p>
        </div>

        <Button
          type="submit"
          className="mt-2 w-full bg-linear-to-r from-firme to-ciano text-gelo shadow-lg shadow-firme/25 hover:opacity-90"
        >
          Criar conta
          <ArrowRight />
        </Button>
      </form>
    </AuthLayout>
  )
}
