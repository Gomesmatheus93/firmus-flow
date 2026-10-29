import { Building2, MessageCircle, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/page-header'
import { SampleBadge } from '@/components/sample-badge'
import { useAuth } from '@/providers/auth-provider'

function Section({ children, onSave = 'Salvar' }: { children: ReactNode; onSave?: string }) {
  return (
    <div className="glass rounded-xl border border-border bg-card p-5">
      <div className="grid max-w-xl gap-4">{children}</div>
      <Button className="mt-6">{onSave}</Button>
    </div>
  )
}

function Field({ label, ...props }: { label: string } & React.ComponentProps<typeof Input>) {
  const id = label.toLowerCase().replace(/\s+/g, '-')

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

        <TabsContent value="empresa" className="mt-5">
          <Section>
            <Field label="Nome da empresa" defaultValue={company?.name ?? ''} />
            <Field label="Segmento" defaultValue={company?.segment ?? ''} />
            <Field label="Instagram" defaultValue={company?.instagramHandle ?? ''} />
          </Section>
        </TabsContent>

        <TabsContent value="perfil" className="mt-5">
          <Section>
            <Field label="Seu nome" defaultValue={user?.fullName ?? ''} />
            <Field label="E-mail" type="email" defaultValue={user?.email ?? ''} disabled />
          </Section>
        </TabsContent>

        <TabsContent value="whatsapp" className="mt-5">
          <Section onSave="Conectar">
            <p className="text-sm text-muted-foreground">
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
