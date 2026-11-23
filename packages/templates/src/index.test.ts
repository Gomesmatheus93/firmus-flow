import { describe, expect, it } from 'vitest'
import { isTemplateKey, renderKit, renderLaveFoto, TEMPLATE_KEYS, templates } from '.'

const assets = { symbolUrl: '/firmus-symbol.png' }

describe('catálogo de modelos', () => {
  it('cada chave tem um modelo, e cada modelo diz a própria chave', () => {
    for (const key of TEMPLATE_KEYS) {
      expect(templates[key].key).toBe(key)
    }
  })

  it('toda prévia tem pelo menos um slide, e cada slide é um documento completo', () => {
    for (const key of TEMPLATE_KEYS) {
      const slides = templates[key].preview(assets)
      expect(slides.length).toBeGreaterThan(0)
      for (const slide of slides) {
        expect(slide.html.startsWith('<!doctype html>')).toBe(true)
        expect(slide.html).toContain('width:1080px; height:1350px')
      }
    }
  })

  it('o kit tem os cinco tipos de slide', () => {
    const tipos = templates['kit-carrossel'].preview(assets).map((s) => s.label)
    expect(tipos).toEqual(['Capa', 'Texto', 'Diagrama', 'Texto em cor', 'Chamada final'])
  })

  it('todo modelo é um carrossel completo: abre na capa e fecha na chamada', () => {
    for (const key of TEMPLATE_KEYS) {
      const tipos = templates[key].preview(assets).map((s) => s.label)
      expect(tipos.length).toBeGreaterThanOrEqual(3)
      expect(tipos[0]).toBe('Capa')
      expect(tipos.at(-1)).toBe('Chamada final')
    }
  })

  it('reconhece só as chaves que existem', () => {
    expect(isTemplateKey('kit-carrossel')).toBe(true)
    expect(isTemplateKey('modelo-de-outra-empresa')).toBe(false)
  })
})

describe('arraste para o lado', () => {
  it('aparece em todo slide de carrossel, menos no último', () => {
    for (const key of TEMPLATE_KEYS.filter((k) => templates[k].formats.includes('carrossel'))) {
      const slides = templates[key].preview(assets)
      for (const slide of slides.slice(0, -1)) {
        expect(slide.html.toLowerCase(), `${key}: ${slide.label}`).toContain('arraste para o lado')
      }
      expect(slides.at(-1)!.html.toLowerCase(), `${key}: último`).not.toContain(
        'arraste para o lado',
      )
    }
  })

  it('some quando o slide é post único', () => {
    const html = renderKit(
      { kind: 'capa', antes: 'a', linha1: 'b', linha2: 'c', arraste: false },
      assets,
    )
    expect(html.toLowerCase()).not.toContain('arraste para o lado')
  })
})

describe('desenho dos slides', () => {
  it('texto de quem escreve não vira HTML', () => {
    // Legenda gerada pela IA ou digitada pelo chefe nunca pode injetar código
    // no slide: o mesmo HTML vai ser aberto no navegador e no worker.
    const html = renderKit(
      { kind: 'texto', paragrafos: ['<script>alert(1)</script> e **destaque**'] },
      assets,
    )
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('**trecho** vira sublinhado e *palavra* vira cor', () => {
    const html = renderKit({ kind: 'texto', paragrafos: ['um **dois** *três*'] }, assets)
    expect(html).toContain('text-decoration:underline')
    expect(html).toContain('>dois</span>')
    expect(html).toContain('>três</span>')
  })

  it('com foto, a foto entra no lugar do elemento gráfico', () => {
    const semFoto = renderKit({ kind: 'capa', antes: 'a', linha1: 'b', linha2: 'c' }, assets)
    const comFoto = renderKit(
      { kind: 'capa', antes: 'a', linha1: 'b', linha2: 'c', foto: 'https://x.test/foto.jpg' },
      assets,
    )
    expect(semFoto).not.toContain('foto.jpg')
    expect(comFoto).toContain('https://x.test/foto.jpg')
  })

  it('no Lave Seque Foto, a foto entra no lugar da máquina desenhada', () => {
    const semFoto = renderLaveFoto({ kind: 'faixas', faixas: ['a', 'b'] }, assets)
    const comFoto = renderLaveFoto(
      { kind: 'faixas', faixas: ['a', 'b'], foto: 'https://x.test/loja.jpg' },
      assets,
    )
    expect(semFoto).toContain('sua foto aqui')
    expect(comFoto).not.toContain('sua foto aqui')
    expect(comFoto).toContain('https://x.test/loja.jpg')
  })

  it('cada arte da Lave Seque é um modelo próprio, em carrossel, post e story', () => {
    const lave = TEMPLATE_KEYS.filter((k) => k.startsWith('lave-') && k !== 'lave-seque')
    expect(lave).toHaveLength(12)
    for (const key of lave) {
      expect(templates[key].formats).toEqual(['carrossel', 'post', 'story'])
      for (const slide of templates[key].preview(assets, 'story')) {
        expect(slide.html, key).toContain('height:1920px')
        expect(slide.html.toLowerCase(), key).not.toContain('arraste para o lado')
      }
    }
  })
})
