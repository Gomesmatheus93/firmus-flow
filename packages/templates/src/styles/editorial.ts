/**
 * Editorial gigante.
 *
 * Uma palavra enorme e condensada ocupa a largura do post; a figura entra na
 * frente dela, cobrindo parte das letras. Por cima, uma palavra fina em
 * itálico. Nos cantos, marcas técnicas: quadradinhos, régua e rótulos
 * pequenos — o lado "tech" da Firmus.
 *
 * A sequência do carrossel mantém o fundo, as marcas e a régua da capa, e
 * troca a palavra gigante por título em tamanho de leitura.
 */
import {
  arraste,
  arrasteSuave,
  cor,
  escapar,
  espacoFoto,
  marcar,
  pagina,
  simbolo,
  textura,
  type TemplateAssets,
} from '../base'

export type EditorialSlide =
  | {
      kind: 'capa'
      sobre: string
      titulo: string
      tamanho?: number
      topoTitulo?: number
      esquerda?: [string, string]
      direita?: [string, string]
      foto?: string | null
      /** "Arraste para o lado". Padrão: ligado. Desligue em post único. */
      arraste?: boolean
    }
  | {
      kind: 'texto'
      numero: string
      rotulo: string
      titulo: string
      paragrafos: string[]
      arraste?: boolean
    }
  | {
      kind: 'lista'
      numero: string
      rotulo: string
      titulo: string
      itens: { titulo: string; texto?: string }[]
      arraste?: boolean
    }
  | { kind: 'chamada'; sobre: string; titulo: string; texto: string; botao: string }

const FUNDO = '#DCE6F2'

const marcaTecnica = `
  <div style="position:absolute;top:72px;left:72px">
    <div style="display:flex;gap:10px">
      ${[0, 1, 2]
        .map(
          () =>
            `<svg width="42" height="42" viewBox="0 0 42 42"><rect x="2" y="2" width="38" height="38" fill="none" stroke="${cor.noite}" stroke-width="3"/><path d="M2 2 L40 40 M40 2 L2 40" stroke="${cor.noite}" stroke-width="2"/></svg>`,
        )
        .join('')}
      <div class="mono" style="margin-left:12px;font-size:13px;line-height:1.35;color:${cor.noite}">Firmos Tech<br>Sites · Sistemas · IA<br>Mossoró · RN</div>
    </div>
    <div style="margin-top:12px;width:146px;height:14px;border:3px solid ${cor.noite}"></div>
  </div>`

/** Régua vertical com marcas, num dos lados. */
const regua = (lado: 'left' | 'right', { bottom = 150, altura = 420 } = {}) => `
  <svg width="40" height="${altura}" viewBox="0 0 40 ${altura}" style="position:absolute;bottom:${bottom}px;${lado}:72px" xmlns="http://www.w3.org/2000/svg">
    <line x1="${lado === 'right' ? 38 : 2}" y1="0" x2="${lado === 'right' ? 38 : 2}" y2="${altura}" stroke="${cor.noite}" stroke-width="3"/>
    ${Array.from({ length: Math.floor(altura / 20) + 1 }, (_, i) => {
      const tamanho = i % 5 === 0 ? 34 : 16
      const x1 = lado === 'right' ? 38 - tamanho : 2
      return `<line x1="${x1}" y1="${i * 20}" x2="${x1 + tamanho}" y2="${i * 20}" stroke="${cor.noite}" stroke-width="3"/>`
    }).join('')}
  </svg>`

const rotuloDuplo = (linhas: [string, string] | undefined) =>
  linhas ? `${escapar(linhas[0])}<br>${escapar(linhas[1])}` : ''

const avisoEditorial = arraste({
  forma: 'caixa',
  fundo: cor.gelo,
  cor: cor.noite,
  borda: cor.noite,
  sombra: cor.noite,
})

/** Topo e rodapé dos slides de dentro: marca, número e o aviso de arraste. */
const moldura = (assets: TemplateAssets, numero: string, rotulo: string, ligado = true) => `
  ${marcaTecnica}
  <div style="position:absolute;top:66px;right:72px">${simbolo(assets, { altura: 78 })}</div>
  <div class="mono" style="position:absolute;top:220px;left:72px;display:flex;align-items:baseline;gap:22px;color:${cor.noite}">
    <span style="font-size:30px;color:${cor.azul}">${escapar(numero)}</span>
    <span style="font-size:22px">${escapar(rotulo)}</span>
  </div>
  <div class="mono" style="position:absolute;bottom:56px;left:72px;right:72px;display:flex;justify-content:space-between;align-items:center;border-top:3px solid ${cor.noite};padding-top:22px;font-size:20px;color:${cor.noite}">
    <span>Firmos Tech · Mossoró RN</span>${ligado ? avisoEditorial : ''}
  </div>`

export function renderEditorial(s: EditorialSlide, assets: TemplateAssets): string {
  switch (s.kind) {
    case 'capa': {
      const topo = s.topoTitulo ?? 330
      return pagina(
        `${textura(0.3)}
        ${marcaTecnica}
        <div style="position:absolute;top:66px;right:72px">${simbolo(assets, { altura: 78 })}</div>

        <h1 class="anton" style="position:absolute;top:${topo}px;left:0;right:0;text-align:center;font-size:${s.tamanho ?? 400}px;color:${cor.azul};white-space:nowrap">${escapar(s.titulo)}</h1>
        <p style="position:absolute;top:${topo - 110}px;left:0;right:0;text-align:center;font-size:150px;font-style:italic;font-weight:300;color:#fff;letter-spacing:-.03em">${escapar(s.sobre)}</p>

        ${espacoFoto({
          foto: s.foto,
          estilo:
            'position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:820px;height:760px',
          semFoto: simbolo(assets, {
            altura: 700,
            estilo: 'margin-top:120px;filter:drop-shadow(0 30px 40px rgba(11,31,58,.28))',
          }),
        })}

        <div class="mono" style="position:absolute;top:${topo + 380}px;left:72px;font-size:24px;line-height:1.4;color:${cor.noite}">${rotuloDuplo(s.esquerda)}</div>
        <div class="mono" style="position:absolute;top:${topo + 380}px;right:72px;text-align:right;font-size:24px;line-height:1.4;color:${cor.noite}">${rotuloDuplo(s.direita)}</div>
        ${regua('right')}
        ${regua('left')}
        ${s.arraste === false ? '' : arrasteSuave({ tema: 'claro', bottom: 56 })}`,
        FUNDO,
      )
    }

    case 'texto':
      return pagina(
        `${textura(0.3)}
        ${moldura(assets, s.numero, s.rotulo, s.arraste !== false)}
        <h2 class="anton" style="position:absolute;top:300px;left:72px;right:150px;font-size:190px;color:${cor.azul}">${escapar(s.titulo)}</h2>
        <div style="position:absolute;top:620px;left:72px;right:190px">
          ${s.paragrafos
            .map(
              (p, i) =>
                `<p style="${i ? 'margin-top:44px;' : ''}font-size:52px;line-height:1.28;color:${cor.noite};text-wrap:pretty">${marcar(p, { sublinhado: cor.azul, destaque: cor.azul })}</p>`,
            )
            .join('')}
        </div>
        ${regua('right', { bottom: 170, altura: 760 })}`,
        FUNDO,
      )

    case 'lista':
      return pagina(
        `${textura(0.3)}
        ${moldura(assets, s.numero, s.rotulo, s.arraste !== false)}
        <h2 class="anton" style="position:absolute;top:300px;left:72px;right:72px;font-size:120px;color:${cor.azul};white-space:nowrap">${escapar(s.titulo)}</h2>
        <ol style="position:absolute;top:470px;left:72px;right:72px;list-style:none;border-bottom:3px solid ${cor.noite}">
          ${s.itens
            .map(
              (item, i) => `
              <li style="display:grid;grid-template-columns:110px 1fr;gap:20px;padding:30px 0;border-top:3px solid ${cor.noite}">
                <span class="mono" style="font-size:34px;color:${cor.azul};padding-top:6px">${String(i + 1).padStart(2, '0')}</span>
                <div>
                  <p style="font-size:50px;font-weight:700;color:${cor.noite};letter-spacing:-.02em">${escapar(item.titulo)}</p>
                  ${item.texto ? `<p style="margin-top:8px;font-size:32px;line-height:1.35;color:${cor.ardosia}">${escapar(item.texto)}</p>` : ''}
                </div>
              </li>`,
            )
            .join('')}
        </ol>`,
        FUNDO,
      )

    case 'chamada':
      return pagina(
        `${textura(0.3)}
        ${marcaTecnica}
        <div style="position:absolute;top:66px;right:72px">${simbolo(assets, { altura: 78 })}</div>
        <div style="position:absolute;top:250px;left:0;right:0;text-align:center">
          <p style="position:relative;z-index:1;font-size:140px;font-style:italic;font-weight:300;color:#fff;letter-spacing:-.03em;line-height:1">${escapar(s.sobre)}</p>
          <h2 class="anton" style="position:relative;margin-top:-24px;font-size:240px;color:${cor.azul};white-space:nowrap">${escapar(s.titulo)}</h2>
        </div>
        <div style="position:absolute;top:700px;left:150px;right:150px;text-align:center">
          <p style="font-size:50px;line-height:1.3;color:${cor.noite}">${marcar(s.texto, { sublinhado: cor.azul, destaque: cor.azul })}</p>
          <div class="mono" style="display:inline-flex;align-items:center;gap:20px;margin-top:56px;padding:26px 40px;border:4px solid ${cor.noite};box-shadow:10px 10px 0 ${cor.noite};background:${cor.gelo};font-size:30px;color:${cor.noite}">
            <span style="width:18px;height:18px;background:${cor.azul}"></span>${escapar(s.botao)}
          </div>
        </div>
        ${regua('right')}
        ${regua('left')}`,
        FUNDO,
      )
  }
}
