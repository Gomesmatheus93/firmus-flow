import { createClient } from '@supabase/supabase-js'

/**
 * Troca caminhos do bucket por links temporários, na mesma ordem. Caminho que
 * o Storage não achou volta `null`.
 *
 * É um tipo próprio pelo mesmo motivo do `ModelClient`: o teste entrega uma
 * função falsa e o caminho de produção roda sem rede.
 */
export type AssetUrlSigner = (paths: string[]) => Promise<(string | null)[]>

/** Quanto tempo o link da imagem vale. Uma hora cobre uma sessão de revisão. */
const VALIDADE_SEGUNDOS = 60 * 60

/**
 * O gerador de links do Supabase Storage.
 *
 * O bucket é privado: imagem de cliente não fica com endereço público. Quem
 * pode ver é decidido pela api, que só gera link para peça da empresa da
 * sessão — e por isso usa a chave de administrador, que fica só aqui no
 * servidor.
 */
export function createSupabaseSigner(
  url: string,
  serviceRoleKey: string,
  bucket: string,
): AssetUrlSigner {
  const client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  return async (paths) => {
    if (paths.length === 0) return []

    const { data, error } = await client.storage
      .from(bucket)
      .createSignedUrls(paths, VALIDADE_SEGUNDOS)

    // Storage fora do ar não derruba a tela: a peça aparece sem imagem.
    if (error || !data) {
      console.error('[api] não consegui gerar os links das imagens:', error?.message)
      return paths.map(() => null)
    }

    // Casado pelo caminho, não pela posição: a ordem da resposta não é
    // contrato documentado do Storage.
    const porCaminho = new Map(data.map((item) => [item.path, item.signedUrl ?? null]))
    return paths.map((path) => porCaminho.get(path) ?? null)
  }
}
