import { zipSync } from 'fflate'

/**
 * Nome de arquivo a partir do título da peça: sem acento, sem símbolo, com
 * hífen no lugar do espaço. "Quem é a Firmus Tech (Panorama)" vira
 * "quem-e-a-firmus-tech-panorama".
 */
export function slugify(texto: string): string {
  return (
    texto
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'carrossel'
  )
}

/** "01-capa.png", "02.png"... na ordem dos slides, para o Instagram receber na ordem. */
export function slideFileName(indice: number, rotulo: string | null): string {
  const numero = String(indice + 1).padStart(2, '0')
  const sufixo = rotulo ? slugify(rotulo) : ''
  return sufixo && sufixo !== 'carrossel' ? `${numero}-${sufixo}.png` : `${numero}.png`
}

/**
 * Monta o zip das artes de uma peça: as imagens na ordem e a legenda num
 * .txt, pronta para colar no Instagram.
 *
 * Roda no navegador: baixa cada imagem pelo link temporário (o Storage libera
 * o download de qualquer origem) e junta tudo aqui mesmo, sem passar pela api.
 */
export async function buildSlidesZip(
  slides: { url: string; nome: string }[],
  legenda: string | null,
): Promise<Blob> {
  const arquivos: Record<string, Uint8Array> = {}

  const baixados = await Promise.all(
    slides.map(async ({ url, nome }) => {
      const resposta = await fetch(url)
      if (!resposta.ok)
        throw new Error(`Não consegui baixar ${nome}. Recarregue a página e tente de novo.`)
      return [nome, new Uint8Array(await resposta.arrayBuffer())] as const
    }),
  )
  for (const [nome, dados] of baixados) arquivos[nome] = dados

  if (legenda?.trim()) arquivos['legenda.txt'] = new TextEncoder().encode(legenda.trim() + '\n')

  // PNG já vem comprimido: `level: 0` só empacota, e o zip sai na hora.
  const zip = zipSync(arquivos, { level: 0 })
  return new Blob([zip], { type: 'application/zip' })
}

/** Dispara o download de um arquivo no navegador. */
export function saveBlob(blob: Blob, nomeArquivo: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Dá tempo do navegador começar o download antes de liberar a memória.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}
