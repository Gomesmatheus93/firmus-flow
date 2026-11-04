import { contentTypeLabel, type ContentType } from '@firmus/shared'
import {
  BookOpen,
  FileImage,
  FileVideoCamera,
  GalleryHorizontalEnd,
  type LucideIcon,
} from 'lucide-react'
import { cn } from 'cn'

/**
 * Cor e ícone de cada formato, num lugar só. O Planejamento, a Criação e o
 * menu falam dos mesmos quatro formatos; se cada tela escolhesse a sua cor, o
 * carrossel seria azul numa e verde na outra.
 */
export const formatStyle: Record<ContentType, { icon: LucideIcon; dot: string; tint: string }> = {
  carrossel: { icon: GalleryHorizontalEnd, dot: 'bg-azul', tint: 'bg-azul/10 text-azul' },
  post: { icon: FileImage, dot: 'bg-amber-500', tint: 'bg-amber-500/10 text-amber-700' },
  story: { icon: BookOpen, dot: 'bg-ciano', tint: 'bg-ciano/15 text-cyan-700' },
  reel: { icon: FileVideoCamera, dot: 'bg-noite', tint: 'bg-noite/10 text-noite' },
}

/** O selo do formato: ponto colorido e nome. */
export function FormatBadge({ format, className }: { format: ContentType; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
        formatStyle[format].tint,
        className,
      )}
    >
      <span aria-hidden className={cn('size-1.5 rounded-full', formatStyle[format].dot)} />
      {contentTypeLabel[format]}
    </span>
  )
}
