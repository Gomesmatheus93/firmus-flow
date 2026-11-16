/**
 * Lave Seque — modelo exclusivo da lavanderia.
 *
 * Feito a partir do estilo que a própria Lave Seque já usa: fundo branco com
 * uma estampa clarinha de ícones de lavanderia, manchas azul-marinho saindo
 * pelos cantos, o logo no alto, uma etiqueta com a data, o título grosso e
 * arredondado em duas cores (marinho e verde) e o texto de apoio embaixo.
 *
 * O logo vem do onboarding da empresa (`assets.logoUrl`); sem ele, fica um
 * espaço reservado. Nada do logo é desenhado aqui.
 */
import { arraste, arrasteSuave, escapar, pagina, type TemplateAssets } from '../base'

export type LaveSlide =
  | {
      kind: 'capa'
      /** A etiqueta acima do título, como "15/09 | dia do cliente". */
      etiqueta?: string
      linha1: string
      linha2: string
      subtitulo?: string
      apoio?: string
      /** Um emoji grande acima da etiqueta. */
      emoji?: string
      /** Tamanho do título, para frase mais longa caber. Padrão: 156. */
      tamanho?: number
      arraste?: boolean
    }
  | {
      kind: 'texto'
      etiqueta?: string
      /** `*palavra*` fica verde. */
      titulo: string
      paragrafos: string[]
      arraste?: boolean
    }
  | { kind: 'lista'; etiqueta?: string; titulo: string; itens: string[]; arraste?: boolean }
  | { kind: 'chamada'; linha1: string; linha2: string; texto: string; botao: string }

const MARINHO = '#0D1257'
const VERDE = '#6CAD34'
const ESTAMPA = '#DCE0EA'
const FONTE = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&display=swap'

/** Título e textos em Baloo 2: grosso e arredondado, como o da marca. */
const baloo = "font-family:'Baloo 2',sans-serif"

/** `*palavra*` vira verde; o resto continua marinho. */
const verde = (texto: string) =>
  escapar(texto).replace(/\*(.+?)\*/g, `<span style="color:${VERDE}">$1</span>`)

/**
 * A estampa de fundo: ícones de lavanderia em traço fino e claro, repetidos.
 * Desenhados aqui, em SVG: camiseta, gota, cabide, máquina de lavar, bolhas.
 */
function estampa() {
  const t = `fill='none' stroke='${ESTAMPA}' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'`
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260' viewBox='0 0 260 260'>
    <g ${t}>
      <path d='M22 40 l16 -12 h18 c2 8 18 8 20 0 h18 l16 12 -10 14 -10 -6 v44 h-58 v-44 l-10 6 z'/>
      <path d='M188 26 c10 14 16 22 16 30 a16 16 0 0 1 -32 0 c0 -8 6 -16 16 -30 z'/>
      <path d='M150 120 a8 8 0 1 1 10 8 v6 l52 26 h-114 l52 -26'/>
      <rect x='26' y='146' width='62' height='72' rx='8'/><circle cx='57' cy='188' r='20'/><circle cx='57' cy='188' r='10'/><path d='M36 160 h12 M70 160 h6'/>
      <circle cx='200' cy='214' r='12'/><circle cx='222' cy='196' r='7'/><circle cx='176' cy='236' r='6'/>
      <path d='M110 214 l6 -14 6 14 14 6 -14 6 -6 14 -6 -14 -14 -6 z'/>
    </g></svg>`
  return `<div style="position:absolute;inset:0;background-image:url(&quot;data:image/svg+xml;utf8,${encodeURIComponent(svg)}&quot;);background-size:260px 260px;opacity:.9"></div>`
}

/** As manchas marinho saindo pelos cantos e os arcos finos. */
function manchas(lado: 'normal' | 'invertido' = 'normal') {
  const blob = (estilo: string) =>
    `<div style="position:absolute;background:${MARINHO};border-radius:58% 42% 50% 50% / 46% 54% 46% 54%;${estilo}"></div>`
  const arco = (estilo: string) =>
    `<div style="position:absolute;border:3px solid ${MARINHO};border-radius:50%;${estilo}"></div>`
  return lado === 'normal'
    ? `${blob('width:330px;height:560px;left:-170px;top:-90px;transform:rotate(-14deg)')}
       ${blob('width:470px;height:420px;right:-170px;bottom:-130px;transform:rotate(-24deg)')}
       ${arco('width:420px;height:420px;right:-250px;top:90px')}
       ${arco('width:320px;height:320px;left:-250px;top:760px')}`
    : `${blob('width:360px;height:520px;right:-190px;top:-120px;transform:rotate(18deg)')}
       ${blob('width:420px;height:380px;left:-180px;bottom:-150px;transform:rotate(20deg)')}
       ${arco('width:380px;height:380px;left:-230px;top:120px')}`
}

/**
 * O logo da empresa no alto. Sem logo: num post de verdade, o nome da empresa
 * em texto; na prévia do modelo, um espaço reservado.
 */
function logo(assets: TemplateAssets, top = 70) {
  const conteudo = assets.logoUrl
    ? `<img src="${escapar(assets.logoUrl)}" alt="" style="max-height:170px;max-width:340px;object-fit:contain">`
    : assets.marca
      ? `<span style="${baloo};font-size:54px;font-weight:800;letter-spacing:-.01em;color:${VERDE}">${escapar(assets.marca)}</span>`
      : `<div style="display:grid;place-items:center;width:200px;height:150px;border:3px dashed ${VERDE};border-radius:28px;${baloo};font-size:26px;font-weight:700;color:${VERDE}">seu logo</div>`
  return `<div style="position:absolute;top:${top}px;left:0;right:0;display:flex;justify-content:center">${conteudo}</div>`
}

const etiqueta = (texto: string) =>
  `<span style="display:inline-block;padding:6px 26px 4px;border-radius:12px;background:${MARINHO};${baloo};font-size:36px;font-weight:700;color:#fff;line-height:1.2">${escapar(texto)}</span>`

/** A coluna de texto: começa um pouco à esquerda do centro, como no original. */
const coluna = (top: number, conteudo: string) =>
  `<div style="position:absolute;top:${top}px;left:160px;right:150px">${conteudo}</div>`

const avisoArraste = (ligado: boolean | undefined) =>
  ligado === false
    ? ''
    : `<div style="position:absolute;left:160px;bottom:64px">${arraste({ fundo: VERDE, cor: '#fff' })}</div>`

export function renderLave(s: LaveSlide, assets: TemplateAssets): string {
  switch (s.kind) {
    case 'capa':
      return pagina(
        `${estampa()}${manchas()}${logo(assets)}
        ${coluna(
          s.emoji ? 330 : 400,
          `${s.emoji ? `<div style="font-size:120px;line-height:1;margin-bottom:34px">${escapar(s.emoji)}</div>` : ''}
          ${s.etiqueta ? etiqueta(s.etiqueta) : ''}
          <h1 style="${baloo};margin-top:22px;font-size:${s.tamanho ?? 156}px;font-weight:800;line-height:.92;letter-spacing:-.02em;color:${MARINHO}">${escapar(s.linha1)}</h1>
          <h1 style="${baloo};font-size:${s.tamanho ?? 156}px;font-weight:800;line-height:.98;letter-spacing:-.02em;color:${VERDE}">${escapar(s.linha2)}</h1>
          ${s.subtitulo ? `<p style="${baloo};margin-top:26px;font-size:46px;font-weight:700;line-height:1.15;color:${MARINHO}">${escapar(s.subtitulo)}</p>` : ''}
          ${s.apoio ? `<p style="${baloo};margin-top:14px;font-size:34px;font-weight:600;line-height:1.2;color:${MARINHO}">${escapar(s.apoio)}</p>` : ''}`,
        )}
        ${s.arraste === false ? '' : arrasteSuave({ tema: 'claro', bottom: 40 })}`,
        '#FFFFFF',
        FONTE,
      )

    case 'texto':
      return pagina(
        `${estampa()}${manchas('invertido')}${logo(assets, 60)}
        ${coluna(
          330,
          `${s.etiqueta ? etiqueta(s.etiqueta) : ''}
          <h2 style="${baloo};margin-top:22px;font-size:104px;font-weight:800;line-height:.98;letter-spacing:-.02em;color:${MARINHO}">${verde(s.titulo)}</h2>
          ${s.paragrafos
            .map(
              (p) =>
                `<p style="${baloo};margin-top:32px;font-size:44px;font-weight:600;line-height:1.25;color:${MARINHO};text-wrap:pretty">${verde(p)}</p>`,
            )
            .join('')}`,
        )}
        ${avisoArraste(s.arraste)}`,
        '#FFFFFF',
        FONTE,
      )

    case 'lista':
      return pagina(
        `${estampa()}${manchas()}${logo(assets, 60)}
        ${coluna(
          320,
          `${s.etiqueta ? etiqueta(s.etiqueta) : ''}
          <h2 style="${baloo};margin-top:22px;font-size:92px;font-weight:800;line-height:.98;letter-spacing:-.02em;color:${MARINHO}">${verde(s.titulo)}</h2>
          <ul style="list-style:none;margin-top:40px;display:flex;flex-direction:column;gap:22px">
            ${s.itens
              .map(
                (
                  item,
                ) => `<li style="display:flex;align-items:center;gap:22px;${baloo};font-size:46px;font-weight:700;line-height:1.15;color:${MARINHO}">
                  <span style="display:grid;place-items:center;flex-shrink:0;width:58px;height:58px;border-radius:50%;background:${VERDE}">
                    <svg width="30" height="30" viewBox="0 0 24 24"><path d="M5 12.5 10 17 19 7" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </span>${escapar(item)}</li>`,
              )
              .join('')}
          </ul>`,
        )}
        ${avisoArraste(s.arraste)}`,
        '#FFFFFF',
        FONTE,
      )

    case 'chamada':
      return pagina(
        `${estampa()}${manchas('invertido')}${logo(assets)}
        ${coluna(
          430,
          `<h2 style="${baloo};font-size:140px;font-weight:800;line-height:.92;letter-spacing:-.02em;color:${MARINHO}">${escapar(s.linha1)}</h2>
          <h2 style="${baloo};font-size:140px;font-weight:800;line-height:.98;letter-spacing:-.02em;color:${VERDE}">${escapar(s.linha2)}</h2>
          <p style="${baloo};margin-top:28px;font-size:46px;font-weight:700;line-height:1.2;color:${MARINHO}">${verde(s.texto)}</p>
          <span style="display:inline-block;margin-top:44px;padding:20px 44px 16px;border-radius:999px;background:${VERDE};${baloo};font-size:40px;font-weight:800;color:#fff">${escapar(s.botao)}</span>`,
        )}`,
        '#FFFFFF',
        FONTE,
      )
  }
}
