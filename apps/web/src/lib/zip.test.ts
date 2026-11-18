import { unzipSync } from 'fflate'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildSlidesZip, slideFileName, slugify } from './zip'

describe('nomes dos arquivos', () => {
  it('título vira nome de arquivo sem acento nem símbolo', () => {
    expect(slugify('Quem é a Firmus Tech (Panorama)')).toBe('quem-e-a-firmus-tech-panorama')
    expect(slugify('???')).toBe('carrossel')
  })

  it('slides numerados com dois dígitos, para ficarem na ordem', () => {
    expect(slideFileName(0, 'Capa')).toBe('01-capa.png')
    expect(slideFileName(9, null)).toBe('10.png')
    expect(slideFileName(2, 'Chamada final')).toBe('03-chamada-final.png')
  })
})

describe('zip das artes', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('leva as imagens na ordem e a legenda num .txt', async () => {
    vi.stubGlobal('fetch', async (url: string) => new Response(new Uint8Array([url.length])))

    const blob = await buildSlidesZip(
      [
        { url: 'https://x.test/a.png', nome: '01-capa.png' },
        { url: 'https://x.test/bb.png', nome: '02.png' },
      ],
      'Legenda do post',
    )
    const conteudo = unzipSync(new Uint8Array(await blob.arrayBuffer()))

    expect(Object.keys(conteudo)).toEqual(['01-capa.png', '02.png', 'legenda.txt'])
    expect(new TextDecoder().decode(conteudo['legenda.txt'])).toBe('Legenda do post\n')
  })

  it('imagem que não baixa interrompe com mensagem clara', async () => {
    vi.stubGlobal('fetch', async () => new Response(null, { status: 403 }))

    await expect(
      buildSlidesZip([{ url: 'https://x.test/a.png', nome: '01.png' }], null),
    ).rejects.toThrow('Não consegui baixar 01.png')
  })
})
