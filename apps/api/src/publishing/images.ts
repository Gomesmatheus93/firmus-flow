import sharp from 'sharp'
import type { AssetUploader, AssetUrlSigner } from '../storage/supabase'

/**
 * Transforma as artes da peça (PNG no bucket privado) no que a Meta aceita:
 * JPEG num link que ela consegue baixar.
 *
 * O Instagram só publica JPEG por link. As artes ficam em PNG porque é o que o
 * Playwright tira e o que a tela de Criação mostra, então a conversão é aqui,
 * na hora de publicar. O JPEG vai para `<empresa>/publicacao/<postagem>/` e o
 * link assinado vale uma hora: tempo de sobra para a Meta baixar.
 */
export type ImagePreparer = (input: {
  companyId: string
  scheduledPostId: string
  /** Caminhos dos PNG no bucket, na ordem dos slides. */
  paths: string[]
}) => Promise<string[]>

export function createImagePreparer(
  signAssetUrls: AssetUrlSigner,
  uploadAsset: AssetUploader,
): ImagePreparer {
  return async ({ companyId, scheduledPostId, paths }) => {
    const links = await signAssetUrls(paths)
    const destinos: string[] = []

    for (const [i, link] of links.entries()) {
      if (!link) throw new Error(`A arte ${i + 1} não está no Storage.`)
      const resposta = await fetch(link, { signal: AbortSignal.timeout(30_000) })
      if (!resposta.ok) throw new Error(`Não consegui baixar a arte ${i + 1} (${resposta.status}).`)

      const jpeg = await sharp(Buffer.from(await resposta.arrayBuffer()))
        .flatten({ background: '#ffffff' })
        .jpeg({ quality: 92, mozjpeg: true })
        .toBuffer()

      const destino = `${companyId}/publicacao/${scheduledPostId}/slide-${String(i + 1).padStart(2, '0')}.jpg`
      await uploadAsset(destino, jpeg, 'image/jpeg')
      destinos.push(destino)
    }

    const publicos = await signAssetUrls(destinos)
    return publicos.map((u, i) => {
      if (!u) throw new Error(`Não consegui gerar o link da arte ${i + 1}.`)
      return u
    })
  }
}
