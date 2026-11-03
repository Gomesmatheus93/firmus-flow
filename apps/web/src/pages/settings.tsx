import { useMutation } from '@tanstack/react-query'
import { AtSign, Building2, MessageCircle, UserRound } from 'lucide-react'
import { useState, type ComponentProps, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InstagramConnection } from '@/components/instagram-connection'
import { MetaPending } from '@/components/meta-pending'
import { Panel } from '@/components/surface'
import { PageHeader } from '@/components/page-header'
import { api } from '@/lib/api'
import { useAuth } from '@/providers/auth-provider'

function Field({ label, ...props }: { label: string } & ComponentProps<typeof Input>) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...props} />
    </div>
  )
}

/**
 * Um bloco de configuração que salva de verdade.
 *
 * `onSave` recebe os campos do formulário. O botão fica desabilitado enquanto
 * salva — antes ele não fazia nada e descartava o que a pessoa digitou.
 */
function SavingSection({
  children,
  onSave,
  action = 'Salvar',
  disabled,
  hint,
}: {
  children: ReactNode
  onSave: (campos: FormData) => Promise<unknown>
  action?: string
  disabled?: boolean
  hint?: string
}) {
  const [salvo, setSalvo] = useState(false)

  const salvar = useMutation({
    mutationFn: onSave,
    onSuccess: () => {
      setSalvo(true)
      toast.success('Salvo.')
    },
    onError: (erro: Error) => toast.error(erro.message),
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSalvo(false)
    salvar.mutate(new FormData(event.currentTarget))
  }

  return (
    <Panel>
      <form onSubmit={handleSubmit}>
        <div className="grid max-w-md gap-5">{children}</div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={disabled || salvar.isPending}>
            {salvar.isPending ? 'Salvando…' : action}
          </Button>
          {salvo && !salvar.isPending && <span className="text-xs text-ardosia">tudo certo</span>}
          {hint && <span className="text-xs text-ardosia">{hint}</span>}
        </div>
      </form>
    </Panel>
  )
}

export function SettingsPage() {
  const { user, company, refresh } = useAuth()
  const isBoss = company?.role === 'chefe'

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Dados da empresa, do seu perfil e a conexão com o WhatsApp."
      />

      <Tabs defaultValue="empresa">
        <TabsList>
          <TabsTrigger value="empresa">
            <Building2 />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="perfil">
            <UserRound />
            Meu perfil
          </TabsTrigger>
          <TabsTrigger value="instagram">
            <AtSign />
            Instagram
          </TabsTrigger>
          <TabsTrigger value="whatsapp">
            <MessageCircle />
            WhatsApp
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="mt-6">
          <SavingSection
            disabled={!isBoss}
            hint={isBoss ? undefined : 'só o chefe pode mudar os dados da empresa'}
            onSave={async (campos) => {
              await api.patch('/company', {
                name: String(campos.get('name') ?? ''),
                segment: String(campos.get('segment') ?? ''),
                instagramHandle: String(campos.get('instagramHandle') ?? ''),
              })
              // A barra lateral e o cabeçalho mostram o nome da empresa.
              await refresh()
            }}
          >
            <Field
              label="Nome da empresa"
              name="name"
              defaultValue={company?.name ?? ''}
              disabled={!isBoss}
            />
            <Field
              label="Segmento"
              name="segment"
              defaultValue={company?.segment ?? ''}
              disabled={!isBoss}
            />
            <Field
              label="Instagram"
              name="instagramHandle"
              defaultValue={company?.instagramHandle ?? ''}
              disabled={!isBoss}
              placeholder="@suaempresa"
            />
          </SavingSection>
        </TabsContent>

        <TabsContent value="perfil" className="mt-6">
          <SavingSection
            onSave={async (campos) => {
              await api.patch('/me', { fullName: String(campos.get('fullName') ?? '') })
              await refresh()
            }}
          >
            <Field label="Seu nome" name="fullName" defaultValue={user?.fullName ?? ''} />
            <Field
              label="E-mail"
              type="email"
              defaultValue={user?.email ?? ''}
              disabled
              title="O e-mail é o seu login e não muda por aqui."
            />
          </SavingSection>
        </TabsContent>

        <TabsContent value="instagram" className="mt-6">
          {isBoss ? (
            <InstagramConnection />
          ) : (
            <Panel>
              <p className="text-sm leading-relaxed text-grafite">
                <span className="font-semibold text-noite">Isso é do chefe.</span> Conectar o
                Instagram da empresa mexe no que os agentes publicam, então só quem administra pode
                fazer.
              </p>
            </Panel>
          )}
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-6">
          {/* Guardar o token de uma empresa exige decidir onde segredo de
              cliente mora — o .env não serve num SaaS multi-empresa. Isso vem
              junto com o resto da integração com a Meta. */}
          <MetaPending
            permission="whatsapp_business_messaging"
            what="Conectar o número da empresa à WhatsApp Cloud API"
          />
        </TabsContent>
      </Tabs>
    </>
  )
}
