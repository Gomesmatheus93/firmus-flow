import { Building2, MessageCircle, UserRound } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Panel } from '@/components/surface'
import { PageHeader } from '@/components/page-header'
import { SampleBadge } from '@/components/sample-badge'
import { useAuth } from '@/providers/auth-provider'

function Section({ children, action = 'Salvar' }: { children: ReactNode; action?: string }) {
  return (
    <Panel>
      <div className="grid max-w-md gap-5">{children}</div>
      <Button className="mt-7">{action}</Button>
    </Panel>
  )
}

function Field({ label, ...props }: { label: string } & ComponentProps<typeof Input>) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...props} />
    </div>
  )
}

export function SettingsPage() {
  const { user, company } = useAuth()

  return (
    <>
      <PageHeader
        title="Configurações"
        description="Dados da empresa, do seu perfil e a conexão com o WhatsApp."
        badge={<SampleBadge />}
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
          <TabsTrigger value="whatsapp">
            <MessageCircle />
            WhatsApp
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="mt-6">
          <Section>
            <Field label="Nome da empresa" defaultValue={company?.name ?? ''} />
            <Field label="Segmento" defaultValue={company?.segment ?? ''} />
            <Field label="Instagram" defaultValue={company?.instagramHandle ?? ''} />
          </Section>
        </TabsContent>

        <TabsContent value="perfil" className="mt-6">
          <Section>
            <Field label="Seu nome" defaultValue={user?.fullName ?? ''} />
            <Field label="E-mail" type="email" defaultValue={user?.email ?? ''} disabled />
          </Section>
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-6">
          <Section action="Conectar">
            <p className="text-sm leading-relaxed text-ardosia">
              Conecte o número da empresa à WhatsApp Cloud API da Meta para a IA começar a atender.
              Só o chefe pode configurar.
            </p>
            <Field label="ID do número de telefone" placeholder="123456789012345" />
            <Field label="Token de acesso" type="password" placeholder="••••••••••••" />
          </Section>
        </TabsContent>
      </Tabs>
    </>
  )
}
