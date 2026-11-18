/**
 * Cena — foto de cena ocupando o post, título enorme por cima.
 *
 * A foto de fundo é metade do post: um objeto em destaque, luz de cinema. Por
 * cima, uma frase fina, o título condensado em branco com a segunda linha em
 * ciano, uma palavra escrita à mão cruzando o título e os detalhes de
 * ferramenta de design (régua, caixa de seleção, cursor com etiqueta) que
 * conversam com o que a Firmus vende.
 *
 * A foto vem de quem cria o post (`foto`). Sem foto, entra uma cena gráfica
 * da Firmus, para o modelo nunca sair vazio.
 *
 * O véu escuro em cima da foto é degradê, ao contrário do resto da marca: é o
 * que deixa o título legível sobre qualquer imagem. A exceção vale só para o
 * post, não para a interface da plataforma.
 */
import {
  arraste,
  arrasteSuave,
  cor,
  escapar,
  marcar,
  pagina,
  simbolo,
  type TemplateAssets,
} from '../base'

export type SceneSlide =
  | {
      kind: 'capa'
      /** A frase fina de cima, dentro da caixa de seleção. */
      antes: string
      linha1: string
      linha2: string
      /** Palavra escrita à mão cruzando o título. */
      manuscrito?: string
      /** O que vai na etiqueta do cursor. Padrão: "firmus". */
      cursor?: string
      /** Contador da série, como 69 de 365. */
      serie?: { atual: number; total: number }
      tamanho1?: number
      tamanho2?: number
      foto?: string | null
      arraste?: boolean
    }
  | {
      kind: 'texto'
      numero: string
      titulo: string
      paragrafos: string[]
      foto?: string | null
      arraste?: boolean
    }
  | {
      kind: 'lista'
      numero: string
      titulo: string
      itens: string[]
      foto?: string | null
      arraste?: boolean
    }
  | {
      kind: 'chamada'
      linha1: string
      linha2: string
      texto: string
      /** O que aparece na caixa de chat de baixo. */
      pergunta: string
      /** Tamanho do título. Padrão: 180. */
      tamanho?: number
      foto?: string | null
    }

const FONTE = 'https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap'
const manuscrita = "font-family:'Caveat',cursive;font-weight:700"

/** A foto, ou a cena gráfica da Firmus. E o véu que deixa o texto legível. */
function fundo(foto: string | null | undefined, assets: TemplateAssets) {
  const imagem = foto
    ? `<img src="${escapar(foto)}" alt="" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">`
    : `<div style="position:absolute;inset:0;background:${cor.noite}">
         <div style="position:absolute;width:760px;height:760px;left:50%;top:58%;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,rgba(28,140,255,.55),rgba(28,140,255,0) 68%)"></div>
         ${[
           [120, 980, 140, 0.18],
           [880, 1080, 190, 0.14],
           [170, 330, 90, 0.12],
           [900, 260, 120, 0.1],
         ]
           .map(
             ([x, y, r, o]) =>
               `<div style="position:absolute;left:${x}px;top:${y}px;width:${r}px;height:${r}px;border-radius:50%;background:${cor.ciano};opacity:${o};filter:blur(28px)"></div>`,
           )
           .join('')}
         <div style="position:absolute;left:50%;top:60%;transform:translate(-50%,-50%) rotate(-8deg)">
           ${simbolo(assets, { altura: 560, estilo: 'filter:drop-shadow(0 40px 60px rgba(0,0,0,.5)) drop-shadow(0 0 70px rgba(34,195,230,.45))' })}
         </div>
       </div>`
  return `${imagem}
    <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,11,24,.82) 0%,rgba(5,11,24,.35) 38%,rgba(5,11,24,.15) 60%,rgba(5,11,24,.7) 100%)"></div>`
}

/** Régua vertical, com números de 50 em 50, nos dois lados. */
function reguas() {
  const regua = (lado: 'left' | 'right') => {
    const marcas = Array.from({ length: 21 }, (_, i) => {
      const y = i * 50
      const longa = i % 2 === 0
      const x1 = lado === 'left' ? 0 : longa ? 4 : 14
      const x2 = lado === 'left' ? (longa ? 26 : 16) : 30
      const numero = longa
        ? `<text x="${lado === 'left' ? 32 : -2}" y="${y + 4}" font-size="11" fill="rgba(255,255,255,.55)" text-anchor="${lado === 'left' ? 'start' : 'end'}" font-family="ui-monospace,monospace">${i * 50}</text>`
        : ''
      return `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="rgba(255,255,255,.45)" stroke-width="2"/>${numero}`
    }).join('')
    return `<svg width="64" height="1004" viewBox="${lado === 'left' ? '0' : '-34'} -2 64 1004" style="position:absolute;top:150px;${lado}:34px" xmlns="http://www.w3.org/2000/svg">${marcas}</svg>`
  }
  return regua('left') + regua('right')
}

/** A caixa de seleção tracejada, com um × em cada lado, em volta da frase. */
function selecao(texto: string) {
  const x = (lado: 'left' | 'right') =>
    `<span style="position:absolute;top:50%;${lado}:22px;transform:translateY(-50%);font-size:30px;line-height:1;color:rgba(255,255,255,.85)">×</span>`
  return `<div style="position:relative;display:inline-block;padding:14px 74px;border:3px dashed rgba(255,255,255,.7);border-radius:10px">
      ${x('left')}
      <span style="font-size:52px;font-weight:400;color:#fff;letter-spacing:-.01em;white-space:nowrap">${escapar(texto)}</span>
      ${x('right')}
    </div>`
}

/** Seta de cursor e a etiqueta, como no editor quando outra pessoa está junto. */
function cursor(rotulo: string) {
  return `<div style="position:absolute;display:flex;align-items:flex-start;gap:2px">
      <svg width="48" height="48" viewBox="0 0 24 24" style="filter:drop-shadow(0 4px 8px rgba(0,0,0,.4))"><path d="M4 2 L4 19 L8.5 14.5 L11.5 21.5 L14.5 20 L11.5 13.2 L18 13.2 Z" fill="${cor.ciano}" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg>
      <span style="margin-top:34px;padding:8px 20px 9px;border-radius:12px;background:${cor.ciano};font-size:30px;font-weight:800;color:${cor.noite};box-shadow:0 8px 20px rgba(0,0,0,.35)">${escapar(rotulo)}</span>
    </div>`
}

/** A pílula de baixo: @ e o nome da marca. */
const assinatura = (instagram = 'somosfirmus') => `
  <div style="position:absolute;left:0;right:0;bottom:44px;display:flex;justify-content:center">
    <span style="display:inline-flex;align-items:center;gap:16px;padding:12px 30px;border-radius:999px;border:2px solid rgba(255,255,255,.35);background:rgba(5,11,24,.45);font-size:26px;color:rgba(255,255,255,.85)">
      @${escapar(instagram)} <span style="width:2px;height:26px;background:rgba(255,255,255,.4)"></span> <b style="color:#fff">Firmus Tech</b>
    </span>
  </div>`

/** O título em duas linhas: branco e ciano, condensado, com brilho leve. */
const titulo = (l1: string, l2: string, t1: number, t2: number) => `
  <h1 class="anton" style="font-size:${t1}px;color:#fff;white-space:nowrap;text-shadow:0 0 30px rgba(255,255,255,.25),0 10px 40px rgba(0,0,0,.45)">${escapar(l1)}</h1>
  <h1 class="anton" style="margin-top:4px;font-size:${t2}px;color:${cor.ciano};white-space:nowrap;text-shadow:0 0 34px rgba(34,195,230,.45),0 10px 40px rgba(0,0,0,.45)">${escapar(l2)}</h1>`

const numeroGrande = (n: string) =>
  `<div class="anton" style="font-size:150px;line-height:.8;color:transparent;-webkit-text-stroke:3px ${cor.ciano}">${escapar(n)}</div>`

const aviso = (ligado: boolean | undefined) =>
  ligado === false
    ? ''
    : `<div style="position:absolute;left:0;right:0;bottom:128px;display:flex;justify-content:center">${arraste({ fundo: cor.ciano, cor: cor.noite })}</div>`

export function renderScene(s: SceneSlide, assets: TemplateAssets): string {
  switch (s.kind) {
    case 'capa':
      return pagina(
        `${fundo(s.foto, assets)}
        ${reguas()}
        ${
          s.serie
            ? `<div style="position:absolute;top:56px;left:0;right:0;display:flex;justify-content:center">
                <span class="tabular" style="padding:8px 26px;border-radius:999px;border:2px solid rgba(255,255,255,.5);font-size:28px;color:#fff">#${String(s.serie.atual).padStart(3, '0')} / ${s.serie.total}</span>
              </div>`
            : ''
        }
        <div style="position:absolute;top:170px;left:0;right:0;text-align:center">
          ${selecao(s.antes)}
          <div style="position:relative;margin-top:18px">
            ${titulo(s.linha1, s.linha2, s.tamanho1 ?? 200, s.tamanho2 ?? 200)}
            ${
              s.manuscrito
                ? `<span style="position:absolute;left:50%;top:${(s.tamanho1 ?? 200) * 0.78}px;transform:translateX(-50%) rotate(-5deg);${manuscrita};font-size:84px;color:#fff;white-space:nowrap;text-shadow:0 4px 18px rgba(0,0,0,.55)">${escapar(s.manuscrito)}</span>`
                : ''
            }
          </div>
        </div>
        <div style="position:absolute;left:640px;top:${170 + 130 + (s.tamanho1 ?? 200) * 0.86 + (s.tamanho2 ?? 200) * 0.9}px">${cursor(s.cursor ?? 'firmus')}</div>
        ${assinatura()}
        ${s.arraste === false ? '' : arrasteSuave({ tema: 'escuro', bottom: 120 })}`,
        cor.noite,
        FONTE,
      )

    case 'texto':
      return pagina(
        `${fundo(s.foto, assets)}
        <div style="position:absolute;inset:0;background:rgba(5,11,24,.55)"></div>
        ${reguas()}
        <div style="position:absolute;top:200px;left:130px;right:130px">
          ${numeroGrande(s.numero)}
          <h2 class="anton" style="margin-top:34px;font-size:118px;line-height:.92;color:#fff;text-shadow:0 10px 40px rgba(0,0,0,.45)">${marcar(s.titulo, { destaque: cor.ciano })}</h2>
          ${s.paragrafos
            .map(
              (p) =>
                `<p style="margin-top:36px;font-size:44px;line-height:1.32;color:rgba(255,255,255,.9);text-wrap:pretty">${marcar(p, { sublinhado: cor.ciano, destaque: cor.ciano })}</p>`,
            )
            .join('')}
        </div>
        ${aviso(s.arraste)}
        ${assinatura()}`,
        cor.noite,
        FONTE,
      )

    case 'lista':
      return pagina(
        `${fundo(s.foto, assets)}
        <div style="position:absolute;inset:0;background:rgba(5,11,24,.6)"></div>
        ${reguas()}
        <div style="position:absolute;top:190px;left:130px;right:130px">
          ${numeroGrande(s.numero)}
          <h2 class="anton" style="margin-top:34px;font-size:104px;line-height:.92;color:#fff">${marcar(s.titulo, { destaque: cor.ciano })}</h2>
          <ul style="list-style:none;margin-top:44px;display:flex;flex-direction:column;gap:20px">
            ${s.itens
              .map(
                (
                  item,
                  i,
                ) => `<li style="display:flex;align-items:center;gap:22px;padding:18px 26px;border:2px dashed rgba(255,255,255,.45);border-radius:12px;background:rgba(5,11,24,.35)">
                  <span class="mono" style="font-size:26px;color:${cor.ciano}">${String(i + 1).padStart(2, '0')}</span>
                  <span style="font-size:42px;font-weight:700;color:#fff">${escapar(item)}</span>
                </li>`,
              )
              .join('')}
          </ul>
        </div>
        ${aviso(s.arraste)}
        ${assinatura()}`,
        cor.noite,
        FONTE,
      )

    case 'chamada':
      return pagina(
        `${fundo(s.foto, assets)}
        ${reguas()}
        <div style="position:absolute;top:220px;left:0;right:0;text-align:center">
          ${titulo(s.linha1, s.linha2, s.tamanho ?? 180, s.tamanho ?? 180)}
          <p style="margin:40px auto 0;max-width:780px;font-size:46px;line-height:1.3;color:#fff;text-shadow:0 4px 20px rgba(0,0,0,.5)">${marcar(s.texto, { sublinhado: cor.ciano, destaque: cor.ciano })}</p>
        </div>
        <div style="position:absolute;left:110px;right:110px;bottom:140px;display:flex;align-items:center;gap:22px;padding:22px 26px;border-radius:999px;border:2px solid rgba(255,255,255,.35);background:rgba(5,11,24,.6)">
          <span style="font-size:40px;line-height:1;color:rgba(255,255,255,.8)">+</span>
          <span style="flex:1;font-size:30px;color:rgba(255,255,255,.85);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapar(s.pergunta)}</span>
          <span style="display:grid;place-items:center;width:58px;height:58px;border-radius:50%;background:${cor.ciano};font-size:32px;font-weight:800;color:${cor.noite}">↑</span>
        </div>
        ${assinatura()}`,
        cor.noite,
        FONTE,
      )
  }
}
