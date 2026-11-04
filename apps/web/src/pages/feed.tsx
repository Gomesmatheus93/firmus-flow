import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  GalleryHorizontalEnd,
  Grid3x3,
  UserRound,
  RefreshCw,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from 'cn'
import { AsyncState } from '@/components/async-state'
import { PageHeader } from '@/components/page-header'
import { Panel } from '@/components/surface'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { formatDayMonth } from '@/lib/dates'
import { useCompanyData } from '@/lib/queries'

type FeedProfile = {
  username: string
  name: string | null
  biography: string | null
  profilePictureUrl: string | null
  followers: number | null
  follows: number | null
  mediaCount: number | null
}

type UpcomingPost = {
  id: string
  type: 'carrossel' | 'post'
  status: string
  title: string
  scheduledFor: string | null
  images: string[]
}

type PublishedPost = {
  id: string
  mediaType: string
  thumbnailUrl: string | null
  permalink: string | null
  caption: string | null
  postedAt: string
}

export type Feed = {
  profile: FeedProfile | null
  upcoming: UpcomingPost[]
  published: PublishedPost[]
}

const numero = (n: number | null) => (n == null ? '—' : n.toLocaleString('pt-BR'))

/** O topo do perfil, como o Instagram mostra. */
function ProfileHeader({ profile, total }: { profile: FeedProfile | null; total: number }) {
  return (
    <div className="flex items-center gap-5 px-1 sm:gap-8">
      <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-2 ring-border sm:size-24">
        {profile?.profilePictureUrl ? (
          <img src={profile.profilePictureUrl} alt="" className="size-full object-cover" />
        ) : (
          <UserRound className="size-8 text-ardosia" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-semibold text-noite">
          {profile ? `@${profile.username}` : 'Instagram não conectado'}
        </p>
        <dl className="mt-2 flex gap-6 text-sm">
          {[
            ['posts', profile ? numero((profile.mediaCount ?? 0) + total) : '—'],
            ['seguidores', numero(profile?.followers ?? null)],
            ['seguindo', numero(profile?.follows ?? null)],
          ].map(([rotulo, valor]) => (
            <div key={rotulo} className="flex flex-col sm:flex-row sm:gap-1.5">
              <dt className="order-2 text-ardosia">{rotulo}</dt>
              <dd className="tabular order-1 font-semibold text-noite">{valor}</dd>
            </div>
          ))}
        </dl>
        {profile?.name && <p className="mt-2 text-sm font-medium text-noite">{profile.name}</p>}
        {profile?.biography && (
          <p className="mt-0.5 line-clamp-3 text-sm whitespace-pre-line text-grafite">
            {profile.biography}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Um quadrado da grade, em 3:4 como o perfil do Instagram mostra hoje. A
 * imagem do post é 4:5: o `object-cover` corta as laterais igual ao app.
 */
function Tile({
  image,
  carousel,
  badge,
  faded,
  label,
  onClick,
}: {
  image: string | null
  carousel: boolean
  badge?: ReactNode
  faded?: boolean
  label: string
  onClick: () => void
}) {
  return (
    <li className="relative">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={cn(
          'group relative block aspect-[3/4] w-full overflow-hidden bg-white/60',
          faded && 'opacity-60 hover:opacity-100',
        )}
      >
        {image ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform group-hover:scale-[1.02]"
          />
        ) : (
          <span className="flex size-full items-end p-2 text-left text-xs text-ardosia">
            {label}
          </span>
        )}
        {carousel && (
          <GalleryHorizontalEnd className="absolute top-2 right-2 size-4 text-white drop-shadow" />
        )}
        {badge}
      </button>
    </li>
  )
}

/** O carrossel inteiro de uma peça que ainda vai entrar. */
function UpcomingViewer({ post, onClose }: { post: UpcomingPost | null; onClose: () => void }) {
  const [atual, setAtual] = useState(0)
  const imagens = post?.images ?? []

  return (
    <Dialog open={post !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[min(92vw,30rem)] gap-4 p-4">
        <DialogTitle className="pr-8 text-sm font-medium text-noite">{post?.title}</DialogTitle>
        <DialogDescription className="text-xs text-ardosia">
          {post?.scheduledFor
            ? `Programado para ${formatDayMonth(post.scheduledFor)}`
            : 'Aprovado, ainda sem data no Programador'}
          {imagens.length > 1 ? ` · ${atual + 1} de ${imagens.length}` : ''}
        </DialogDescription>

        {imagens[atual] ? (
          <div className="relative">
            <img
              src={imagens[atual]}
              alt=""
              className="aspect-[4/5] w-full rounded-md border border-border object-cover"
            />
            {/* Na capa, a moldura mostra o que a grade do perfil deixa à vista. */}
            {atual === 0 && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 left-[3.125%] right-[3.125%] rounded-sm border-2 border-dashed border-white/90 mix-blend-difference"
              />
            )}
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-input p-6 text-center text-sm text-ardosia">
            Esta peça ainda não tem imagem.
          </p>
        )}

        {atual === 0 && imagens.length > 0 && (
          <p className="text-xs text-ardosia">
            O tracejado é o que aparece na grade do perfil. O resto da capa aparece quando a pessoa
            abre o post.
          </p>
        )}

        {imagens.length > 1 && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              disabled={atual === 0}
              onClick={() => setAtual(atual - 1)}
            >
              <ChevronLeft />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={atual === imagens.length - 1}
              onClick={() => setAtual(atual + 1)}
            >
              Próximo
              <ChevronRight />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function FeedPage() {
  const { data, isPending, error } = useCompanyData<Feed>(['feed'], '/feed', {
    profile: null,
    upcoming: [],
    published: [],
  })

  return <FeedView data={data} isPending={isPending} error={error} />
}

/** A tela, sem a busca: recebe os dados prontos. */
export function FeedView({
  data,
  isPending,
  error,
}: {
  data: Feed
  isPending: boolean
  error: unknown
}) {
  const [aberta, setAberta] = useState<UpcomingPost | null>(null)

  const { profile, upcoming, published } = data
  const vazio = upcoming.length === 0 && published.length === 0

  return (
    <>
      <PageHeader
        title="Prévia do feed"
        description="Como o perfil vai ficar com o que está programado e aprovado, em cima do que já está publicado. Nada daqui vai para o Instagram."
      />

      {!isPending && !profile && (
        <Panel className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-grafite">
            Conecte o Instagram para a prévia mostrar o perfil e os posts que já estão publicados.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/configuracoes">Conectar o Instagram</Link>
          </Button>
        </Panel>
      )}

      {!isPending && profile && published.length === 0 && (
        <Panel className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-grafite">
            Os posts já publicados ainda não foram buscados no Instagram.
          </p>
          <Button asChild variant="outline" size="sm">
            <Link to="/analytics">
              <RefreshCw />
              Atualizar no Analytics
            </Link>
          </Button>
        </Panel>
      )}

      <AsyncState
        isPending={isPending}
        error={error}
        isEmpty={vazio}
        empty={{
          icon: Grid3x3,
          title: 'Nada para mostrar ainda',
          description:
            'Quando houver peças aprovadas ou programadas, elas aparecem aqui na ordem em que vão entrar no perfil.',
        }}
      >
        <div className="mx-auto w-full max-w-[34rem] space-y-5">
          <ProfileHeader profile={profile} total={upcoming.length} />

          <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-3 text-xs text-ardosia">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-azul" />
              Programado
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-500" />
              Aprovado, sem data
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-ardosia/50" />
              Já publicado
            </span>
          </div>

          <ul className="grid grid-cols-3 gap-0.5 overflow-hidden rounded-lg">
            {upcoming.map((post) => (
              <Tile
                key={post.id}
                image={post.images[0] ?? null}
                carousel={post.images.length > 1}
                label={post.title}
                onClick={() => setAberta(post)}
                badge={
                  <span
                    className={cn(
                      'absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold text-white shadow',
                      post.scheduledFor ? 'bg-azul' : 'bg-amber-500',
                    )}
                  >
                    {post.scheduledFor ? (
                      <>
                        <CalendarClock className="size-3" />
                        {formatDayMonth(post.scheduledFor)}
                      </>
                    ) : (
                      'sem data'
                    )}
                  </span>
                }
              />
            ))}

            {published.map((post) => (
              <Tile
                key={post.id}
                image={post.thumbnailUrl}
                carousel={post.mediaType === 'CAROUSEL_ALBUM'}
                faded
                label={post.caption?.slice(0, 60) || 'Post publicado'}
                onClick={() => post.permalink && window.open(post.permalink, '_blank', 'noopener')}
                badge={
                  post.permalink ? (
                    <ExternalLink className="absolute bottom-2 left-2 size-3.5 text-white opacity-0 drop-shadow group-hover:opacity-100" />
                  ) : undefined
                }
              />
            ))}
          </ul>
        </div>
      </AsyncState>

      {/* O `key` volta para a capa a cada peça aberta. */}
      <UpcomingViewer key={aberta?.id ?? 'nenhuma'} post={aberta} onClose={() => setAberta(null)} />
    </>
  )
}
