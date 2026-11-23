/**
 * Papel e etiqueta.
 *
 * Fundo de papel escuro com textura, título em blocos, e a palavra-chave numa
 * etiqueta clara de borda rasgada. Embaixo, a figura apoiada numa "mesa".
 *
 * A sequência do carrossel continua no mesmo papel: a etiqueta passa a marcar
 * o assunto de cada slide, e a lista vira tiras de papel coladas uma embaixo
 * da outra.
 */
import {
  arrasteSuave,
  cor,
  escapar,
  espacoFoto,
  janela,
  marcar,
  pagina,
  textura,
  type TemplateAssets,
} from '../base'

export type PaperSlide =
  | {
      kind: 'capa'
      tags?: string[]
      linhas: string[]
      etiqueta: string
      tamanhoEtiqueta?: number
      subtitulo: string
      foto?: string | null
      /** "Arraste para o lado". Padrão: ligado. Desligue em post único. */
      arraste?: boolean
    }
  | {
      kind: 'texto'
      tags?: string[]
      rotulo: string
      titulo: string
      paragrafos: string[]
      arraste?: boolean
    }
  | { kind: 'lista'; tags?: string[]; titulo: string; itens: string[]; arraste?: boolean }
  | {
      kind: 'chamada'
      tags?: string[]
      titulo: string
      etiqueta: string
      texto: string
      foto?: string | null
    }

/** Borda rasgada: um polígono com dentes irregulares em cima e embaixo. */
function rasgado(semente = 0) {
  const alturas = [0, 1.8, 0.6, 2.4, 1, 2, 0.4, 1.6]
  const dentes = (y: number, sentido: 1 | -1, deslocamento: number) =>
    Array.from({ length: 24 }, (_, i) => {
      const x = (i / 23) * 100
      const d = alturas[(i + deslocamento) % alturas.length]!
      return `${x.toFixed(1)}% ${(y + sentido * d).toFixed(1)}%`
    })
  return `polygon(${[...dentes(0, 1, semente), ...dentes(100, -1, semente + 3).reverse()].join(',')})`
}

/** Um pedaço de papel claro com texto, de borda rasgada e levemente torto. */
function etiqueta(
  conteudo: string,
  { giro = -2, padding = '18px 40px 26px', semente = 0, estilo = '' } = {},
) {
  return `<div style="display:inline-block;padding:${padding};background:${cor.gelo};clip-path:${rasgado(semente)};transform:rotate(${giro}deg);${estilo}">${conteudo}</div>`
}

const topo = (tags: string[] = []) => `
  <div style="position:absolute;top:72px;left:80px;right:80px;display:flex;justify-content:space-between;font-size:28px;font-weight:600;color:#fff">
    <span>Firmos Tech</span>
    <span style="display:flex;gap:44px;font-weight:500;opacity:.85">${tags.map((t) => `<span>${escapar(t)}</span>`).join('')}</span>
  </div>`

/** A "mesa" escura embaixo, onde a figura se apoia. */
const mesa = `<div style="position:absolute;left:0;right:0;bottom:0;height:180px;background:#0a1830"></div>`

const marcas = { sublinhado: cor.ciano, destaque: cor.ciano }

/** O aviso de arraste, numa tira de papel apoiada na mesa. */
const avisoPapel = (ligado: boolean | undefined) =>
  ligado === false
    ? ''
    : `<div style="position:absolute;right:70px;bottom:44px">${etiqueta(
        `<span style="display:flex;align-items:center;gap:16px;font-size:30px;font-weight:800;font-style:italic;color:${cor.noite};white-space:nowrap">Arraste para o lado
           <svg width="46" height="22" viewBox="0 0 46 22"><path d="M2 11 H40 M30 2 L42 11 L30 20" fill="none" stroke="${cor.azul}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
         </span>`,
        { giro: -2, padding: '14px 30px 18px', semente: 4 },
      )}</div>`

export function renderPaper(s: PaperSlide, _assets: TemplateAssets): string {
  switch (s.kind) {
    case 'capa':
      return pagina(
        `${textura(0.55)}
        ${topo(s.tags)}
        <div style="position:absolute;top:200px;left:110px;right:110px">
          ${s.linhas
            .map(
              (linha, i) =>
                `<p style="font-size:${i === 0 ? 112 : 84}px;line-height:1.02;font-weight:800;color:#fff;letter-spacing:-.03em">${escapar(linha)}</p>`,
            )
            .join('')}
          ${etiqueta(
            `<span style="font-size:${s.tamanhoEtiqueta ?? 112}px;line-height:1;font-weight:900;font-style:italic;color:${cor.noite};letter-spacing:-.04em;white-space:nowrap">${escapar(s.etiqueta)}</span>`,
            { estilo: 'margin-top:22px;margin-left:-22px' },
          )}
          <p style="margin-top:34px;font-size:46px;line-height:1.25;color:rgba(255,255,255,.92)">${escapar(s.subtitulo)}</p>
        </div>
        ${mesa}
        ${textura(0.5)}
        ${espacoFoto({
          foto: s.foto,
          estilo:
            'position:absolute;left:50%;bottom:110px;transform:translateX(-50%);width:540px;height:390px;border-radius:20px',
          semFoto: janela({ largura: 540, fundo: '#ffffff', traco: cor.noite }),
        })}
        ${s.arraste === false ? '' : arrasteSuave({ tema: 'escuro', bottom: 38 })}`,
        cor.noite2,
      )

    case 'texto':
      return pagina(
        `${textura(0.55)}
        ${topo(s.tags)}
        <div style="position:absolute;top:230px;left:110px;right:110px">
          ${etiqueta(
            `<span style="font-size:44px;font-weight:900;font-style:italic;color:${cor.noite};letter-spacing:-.02em;white-space:nowrap">${escapar(s.rotulo)}</span>`,
            { giro: -3, padding: '12px 30px 16px', semente: 2, estilo: 'margin-left:-14px' },
          )}
          <h2 style="margin-top:40px;font-size:96px;line-height:1.04;font-weight:800;color:#fff;letter-spacing:-.03em">${escapar(s.titulo)}</h2>
          <div style="margin-top:60px">
            ${s.paragrafos
              .map(
                (p, i) =>
                  `<p style="${i ? 'margin-top:40px;' : ''}font-size:50px;line-height:1.3;color:rgba(255,255,255,.9);text-wrap:pretty">${marcar(p, marcas)}</p>`,
              )
              .join('')}
          </div>
        </div>
        ${mesa}
        ${textura(0.5)}
        ${avisoPapel(s.arraste)}`,
        cor.noite2,
      )

    case 'lista':
      // Título e tiras no mesmo bloco: a lista começa onde o título termina,
      // tenha ele uma linha ou três.
      return pagina(
        `${textura(0.55)}
        ${topo(s.tags)}
        <div style="position:absolute;top:200px;left:90px;right:90px">
          <h2 style="padding:0 20px;font-size:${s.titulo.length > 26 ? 80 : 96}px;line-height:1.04;font-weight:800;color:#fff;letter-spacing:-.03em">${escapar(s.titulo)}</h2>
          <div style="margin-top:56px;display:flex;flex-direction:column;gap:30px">
            ${s.itens
              .map((item, i) =>
                etiqueta(
                  `<span style="display:flex;align-items:baseline;gap:26px;font-size:44px;font-weight:800;color:${cor.noite};letter-spacing:-.02em">
                     <span style="font-style:italic;color:${cor.azul}">${i + 1}.</span>${escapar(item)}
                   </span>`,
                  {
                    giro: i % 2 ? 1.2 : -1.4,
                    padding: '22px 40px 28px',
                    semente: i * 2,
                    estilo: `align-self:${i % 2 ? 'flex-end' : 'flex-start'}`,
                  },
                ),
              )
              .join('')}
          </div>
        </div>
        ${mesa}
        ${textura(0.5)}
        ${avisoPapel(s.arraste)}`,
        cor.noite2,
      )

    case 'chamada':
      return pagina(
        `${textura(0.55)}
        ${topo(s.tags)}
        <div style="position:absolute;top:210px;left:90px;right:90px;text-align:center">
          <h2 style="font-size:96px;line-height:1.04;font-weight:800;color:#fff;letter-spacing:-.03em">${escapar(s.titulo)}</h2>
          ${etiqueta(
            `<span style="font-size:110px;line-height:1;font-weight:900;font-style:italic;color:${cor.noite};letter-spacing:-.04em;white-space:nowrap">${escapar(s.etiqueta)}</span>`,
            { giro: -2, semente: 5, estilo: 'margin-top:28px' },
          )}
          <p style="margin-top:40px;font-size:48px;line-height:1.3;color:rgba(255,255,255,.92)">${marcar(s.texto, marcas)}</p>
        </div>
        ${mesa}
        ${textura(0.5)}
        ${espacoFoto({
          foto: s.foto,
          estilo:
            'position:absolute;left:50%;bottom:110px;transform:translateX(-50%) rotate(3deg);width:460px;height:331px;border-radius:20px',
          semFoto: janela({ largura: 460, fundo: '#ffffff', traco: cor.noite }),
        })}`,
        cor.noite2,
      )
  }
}
