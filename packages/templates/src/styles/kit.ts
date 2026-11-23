/**
 * Kit de carrossel.
 *
 * Capa com título empilhado em duas cores, slides de texto com sublinhado de
 * destaque, um slide de diagrama, fundos que alternam e um slide final com
 * ícone. Os quatro cantos se repetem em todos os slides e amarram o carrossel.
 */
import {
  arraste,
  arrasteSuave,
  cantos,
  cor,
  escapar,
  espacoFoto,
  janela,
  marcar,
  pagina,
  textura,
  WIDTH,
  type TemplateAssets,
} from '../base'

export type KitSlide =
  | {
      kind: 'capa'
      antes: string
      linha1: string
      linha2: string
      tamanho1?: number
      tamanho2?: number
      foto?: string | null
      /** "Arraste para o lado". Padrão: ligado. Desligue em post único. */
      arraste?: boolean
    }
  | { kind: 'texto'; paragrafos: string[]; borda?: string; arraste?: boolean }
  | { kind: 'textoCor'; paragrafos: string[]; borda?: string; arraste?: boolean }
  | { kind: 'diagrama'; paragrafos: string[]; topo: string; base: string[]; arraste?: boolean }
  | { kind: 'chamada'; texto: string; hashtag?: string; foto?: string | null }

/** Rabisco e seta desenhados à mão, em SVG: o "feito por gente" do estilo. */
const rabisco = (c: string, estilo: string) => `
  <svg width="220" height="70" viewBox="0 0 220 70" style="${estilo}" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 44 C 30 10, 52 62, 78 30 S 124 54, 146 24 S 196 46, 214 18" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round"/>
  </svg>`

const seta = (c: string, estilo: string) => `
  <svg width="150" height="120" viewBox="0 0 150 120" style="${estilo}" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 20 C 60 0, 120 30, 112 92" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/>
    <path d="M88 76 L 112 98 L 134 72" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`

/**
 * Palavra gigante vazada, em escrita vertical, com uns 40% para fora do
 * slide: aparece só o pedaço que basta para ler, e o texto fica livre.
 */
function palavraNaBorda(palavra: string, lado: 'direita' | 'esquerda', c: string) {
  const posicao =
    lado === 'direita'
      ? 'right:-150px;transform:translateY(-50%)'
      : 'left:-150px;transform:translateY(-50%) rotate(180deg)'
  return `<div class="anton" style="position:absolute;top:50%;${posicao};writing-mode:vertical-rl;font-size:400px;line-height:.9;color:transparent;-webkit-text-stroke:6px ${c};white-space:nowrap">${escapar(palavra)}</div>`
}

const paragrafos = (lista: string[], estilo: string, marcas: Parameters<typeof marcar>[1]) =>
  lista
    .map(
      (p, i) =>
        `<p style="${i ? 'margin-top:56px;' : ''}${estilo};text-wrap:pretty">${marcar(p, marcas)}</p>`,
    )
    .join('')

/** Ícone de envio, o "fale com a gente", desenhado em SVG. */
const iconeEnvio = `
  <svg width="300" height="300" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 46 L 88 14 L 62 88 L 48 56 Z" fill="${cor.azul}" stroke="${cor.noite}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M48 56 L 88 14" fill="none" stroke="${cor.noite}" stroke-width="5" stroke-linecap="round"/>
  </svg>`

const etiqueta = (t: string) =>
  `<span style="display:inline-block;padding:12px 24px;border-radius:14px;background:${cor.gelo};border:4px solid ${cor.noite};box-shadow:5px 5px 0 ${cor.noite};font-size:30px;font-weight:700;color:${cor.noite};letter-spacing:.02em;text-transform:uppercase;white-space:nowrap">${escapar(t)}</span>`

/** Os cantos de baixo: o aviso de arraste no lugar do "Arrasta aí", e a hashtag. */
function rodapeKit(ligado: boolean | undefined, tema: 'escuro' | 'claro' | 'cor') {
  const corTexto = {
    escuro: 'rgba(255,255,255,.62)',
    claro: cor.ardosia,
    cor: 'rgba(255,255,255,.75)',
  }[tema]
  const aviso = {
    escuro: arraste({ fundo: cor.azul, cor: '#fff' }),
    claro: arraste({ fundo: cor.noite, cor: '#fff' }),
    cor: arraste({ fundo: '#fff', cor: cor.noite }),
  }[tema]
  return `${cantos({ corTexto, baixo: ['', '#firmostech'] })}
    ${ligado === false ? '' : `<div style="position:absolute;left:72px;bottom:52px">${aviso}</div>`}`
}

export function renderKit(s: KitSlide, _assets: TemplateAssets): string {
  switch (s.kind) {
    case 'capa':
      return pagina(
        `${textura(0.5)}
        ${rodapeKit(false, 'escuro')}
        ${s.arraste === false ? '' : arrasteSuave({ tema: 'escuro', bottom: 62 })}
        ${seta('rgba(255,255,255,.75)', 'position:absolute;bottom:520px;left:70px;transform:rotate(-20deg)')}
        ${rabisco(cor.ciano, 'position:absolute;top:150px;right:90px;transform:rotate(-8deg)')}
        <div style="position:absolute;top:180px;left:0;right:0;text-align:center">
          <p style="font-size:64px;font-weight:900;color:#fff;letter-spacing:-.02em;line-height:1">${marcar(s.antes)}</p>
          <h1 class="anton" style="margin-top:28px;font-size:${s.tamanho1 ?? 230}px;color:#fff;white-space:nowrap">${escapar(s.linha1)}</h1>
          <h1 class="anton" style="margin-top:6px;font-size:${s.tamanho2 ?? 230}px;color:${cor.azul};white-space:nowrap">${escapar(s.linha2)}</h1>
        </div>
        ${espacoFoto({
          foto: s.foto,
          estilo:
            'position:absolute;left:50%;bottom:190px;transform:translateX(-50%) rotate(-4deg);width:600px;height:432px;border-radius:24px',
          semFoto: janela({ largura: 600, fundo: cor.gelo, traco: cor.noite }),
        })}`,
        cor.noite,
      )

    case 'texto':
      return pagina(
        `${textura(0.35)}
        ${s.borda ? palavraNaBorda(s.borda, 'direita', cor.azul) : ''}
        ${rodapeKit(s.arraste, 'claro')}
        <div style="position:absolute;top:50%;left:110px;right:${s.borda ? 300 : 110}px;transform:translateY(-50%)">
          ${paragrafos(s.paragrafos, `font-size:58px;line-height:1.24;color:${cor.grafite};letter-spacing:-.01em`, { sublinhado: cor.ciano, destaque: cor.azul })}
        </div>`,
        cor.papel,
      )

    case 'textoCor':
      return pagina(
        `${textura(0.3)}
        ${s.borda ? palavraNaBorda(s.borda, 'esquerda', cor.noite) : ''}
        ${rodapeKit(s.arraste, 'cor')}
        <div style="position:absolute;top:50%;left:${s.borda ? 300 : 110}px;right:110px;transform:translateY(-50%)">
          ${paragrafos(s.paragrafos, 'font-size:58px;line-height:1.24;color:#fff;letter-spacing:-.01em', { sublinhado: cor.noite, destaque: cor.noite })}
        </div>`,
        cor.azul,
      )

    case 'diagrama':
      // O iceberg: o que aparece em cima da linha d'água e o que sustenta embaixo.
      return pagina(
        `${textura(0.35)}
        ${rodapeKit(s.arraste, 'claro')}
        <div style="position:absolute;top:190px;left:100px;right:100px;text-align:center">
          ${s.paragrafos
            .map(
              (p, i) =>
                `<p style="${i ? 'margin-top:36px;' : ''}font-size:48px;line-height:1.24;color:${cor.grafite}">${marcar(p)}</p>`,
            )
            .join('')}
        </div>
        <div style="position:absolute;left:80px;right:80px;bottom:160px;height:600px">
          <svg width="${WIDTH - 160}" height="600" viewBox="0 0 920 600" style="position:absolute;inset:0" xmlns="http://www.w3.org/2000/svg">
            <rect x="4" y="150" width="912" height="446" rx="34" fill="${cor.azul}" stroke="${cor.noite}" stroke-width="8"/>
            <rect x="4" y="150" width="912" height="70" fill="${cor.ciano}" opacity=".35"/>
            <path d="M300 150 L 380 70 L 430 96 L 470 40 L 540 110 L 600 150 Z" fill="${cor.gelo}" stroke="${cor.noite}" stroke-width="8" stroke-linejoin="round"/>
            <path d="M250 152 L 670 152 L 720 300 L 640 520 L 330 560 L 200 380 Z" fill="#ffffff" opacity=".22"/>
          </svg>
          <div style="position:absolute;top:0;left:0;right:0;text-align:center">${etiqueta(s.topo)}</div>
          <div style="position:absolute;top:250px;left:40px;right:40px;display:flex;flex-wrap:wrap;justify-content:center;gap:26px 22px">
            ${s.base.map(etiqueta).join('')}
          </div>
        </div>`,
        cor.papel,
      )

    case 'chamada':
      return pagina(
        `${textura(0.3)}
        ${cantos({ corTexto: 'rgba(255,255,255,.75)', baixo: ['', s.hashtag ?? '#firmostech'] })}
        <div style="position:absolute;top:270px;left:0;right:0;display:flex;justify-content:center">
          <div style="position:relative">
            <svg width="560" height="300" viewBox="0 0 560 300" style="position:absolute;top:30px;left:-80px;transform:rotate(-14deg)" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 80 C 160 40, 380 60, 540 30 M10 150 C 180 120, 400 140, 550 110 M30 220 C 200 190, 380 210, 520 190" fill="none" stroke="${cor.noite}" stroke-width="44" stroke-linecap="round" opacity=".9"/>
            </svg>
            <div style="position:relative;width:420px;height:420px;border-radius:44px;background:${cor.gelo};border:7px solid ${cor.noite};box-shadow:10px 10px 0 ${cor.noite};display:grid;place-items:center">
              ${espacoFoto({ foto: s.foto, estilo: 'width:300px;height:300px;border-radius:24px', semFoto: iconeEnvio })}
            </div>
          </div>
        </div>
        <div style="position:absolute;top:830px;left:130px;right:130px;text-align:center">
          <p style="font-size:54px;line-height:1.26;color:#fff">${marcar(s.texto, { sublinhado: cor.noite, destaque: cor.noite })}</p>
        </div>`,
        cor.azul,
      )
  }
}
