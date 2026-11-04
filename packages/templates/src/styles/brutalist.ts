/**
 * Brutalista tech.
 *
 * Grade aparente, tipografia enorme que vaza pela borda, detalhes de
 * interface (números, código de barras, blocos de texto miúdo) e uma cor de
 * destaque só: o ciano da Firmus.
 *
 * A sequência do carrossel mantém a grade e o rodapé com código de barras; o
 * número de cada slide vira o elemento gigante.
 */
import {
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

export type BrutalistSlide =
  | {
      kind: 'capa'
      gigante: string
      notas?: string[]
      titulo: string[]
      tamanho?: number
      rodape: string
      numero?: string
      foto?: string | null
      /** "Arraste para o lado". Padrão: ligado. Desligue em post único. */
      arraste?: boolean
    }
  | {
      kind: 'texto'
      numero: string
      titulo: string[]
      paragrafos: string[]
      notas?: string[]
      rodape: string
      arraste?: boolean
    }
  | {
      kind: 'lista'
      numero: string
      titulo: string
      itens: { titulo: string; texto: string }[]
      rodape: string
      arraste?: boolean
    }
  | {
      kind: 'chamada'
      gigante: string
      titulo: string[]
      texto: string
      rodape: string
      numero: string
    }

/** Código de barras decorativo. */
function codigoDeBarras(largura = 260, altura = 70) {
  const barras = [3, 1, 2, 1, 4, 1, 1, 3, 2, 1, 1, 2, 4, 1, 2, 3, 1, 1, 2, 1, 3, 2, 1, 4, 1, 2]
  let x = 0
  const rects: string[] = []
  for (const [i, b] of barras.entries()) {
    if (i % 2 === 0)
      rects.push(`<rect x="${x}" y="0" width="${b * 3}" height="${altura}" fill="#fff"/>`)
    x += b * 3 + 2
  }
  return `<svg width="${largura}" height="${altura}" viewBox="0 0 ${x} ${altura}" preserveAspectRatio="none">${rects.join('')}</svg>`
}

// Linhas de 1px a cada 90px. Linha chapada, não degradê de cor.
const grade = `<div style="position:absolute;inset:0;background-image:linear-gradient(rgba(34,195,230,.09) 1px,transparent 1px),linear-gradient(90deg,rgba(34,195,230,.09) 1px,transparent 1px);background-size:90px 90px"></div>`

/**
 * O rodapé de todos os slides: texto miúdo, código de barras e número. Nos
 * slides que não são o último, o aviso de arraste fica em cima do código, em
 * ciano, como uma leitura de interface.
 */
const rodape = (texto: string, numero: string, arraste = false) => `
  <div style="position:absolute;left:72px;right:72px;bottom:72px;display:flex;justify-content:space-between;align-items:flex-end;border-top:2px solid rgba(255,255,255,.25);padding-top:26px">
    <div class="mono" style="font-size:20px;line-height:1.5;color:rgba(255,255,255,.75);max-width:470px">${escapar(texto)}</div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:16px">
      ${
        arraste
          ? `<span class="mono" style="display:flex;align-items:center;gap:14px;font-size:24px;font-weight:700;color:${cor.ciano};white-space:nowrap">Arraste para o lado
              <svg width="46" height="22" viewBox="0 0 46 22"><path d="M2 11 H40 M30 2 L42 11 L30 20" fill="none" stroke="${cor.ciano}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>`
          : ''
      }
      <div style="display:flex;align-items:flex-end;gap:24px">
        ${codigoDeBarras()}
        <span class="anton" style="font-size:80px;color:${cor.ciano};line-height:.8">${escapar(numero)}</span>
      </div>
    </div>
  </div>`

/** Cantos de mira, como num visor: o enquadramento dos slides de texto. */
const mira = (top: number, bottom: number) => {
  const canto = (pos: string, borda: string) =>
    `<span style="position:absolute;${pos};width:56px;height:56px;${borda}"></span>`
  const linha = `4px solid ${cor.ciano}`
  return `<div style="position:absolute;top:${top}px;bottom:${bottom}px;left:56px;right:56px">
    ${canto('top:0;left:0', `border-top:${linha};border-left:${linha}`)}
    ${canto('top:0;right:0', `border-top:${linha};border-right:${linha}`)}
    ${canto('bottom:0;left:0', `border-bottom:${linha};border-left:${linha}`)}
    ${canto('bottom:0;right:0', `border-bottom:${linha};border-right:${linha}`)}
  </div>`
}

const notasMiudas = (notas: string[] = [], estilo: string) =>
  `<div class="mono" style="position:absolute;${estilo};font-size:18px;line-height:1.5;color:rgba(255,255,255,.7)">${notas.map(escapar).join('<br>')}</div>`

export function renderBrutalist(s: BrutalistSlide, assets: TemplateAssets): string {
  switch (s.kind) {
    case 'capa': {
      const circulos = ['01', '02', '03']
        .map((n, i) => {
          const ativo = i === 0
          return `<span class="mono" style="display:grid;place-items:center;width:58px;height:58px;border-radius:50%;border:3px solid ${ativo ? cor.ciano : 'rgba(255,255,255,.4)'};font-size:20px;color:${ativo ? cor.ciano : 'rgba(255,255,255,.6)'}">${n}</span>`
        })
        .join('')

      return pagina(
        `${grade}
        ${textura(0.35)}
        <div class="anton" style="position:absolute;top:-40px;left:-20px;font-size:520px;color:${cor.ciano};white-space:nowrap;opacity:.95">${escapar(s.gigante)}</div>
        ${notasMiudas(s.notas, 'top:440px;right:72px;text-align:right')}
        ${espacoFoto({
          foto: s.foto,
          filtro: 'filter:grayscale(1) contrast(1.15)',
          estilo:
            'position:absolute;top:320px;left:50%;transform:translateX(-50%);width:620px;height:620px',
          semFoto: simbolo(assets, {
            altura: 520,
            estilo: 'filter:drop-shadow(0 0 60px rgba(34,195,230,.35))',
          }),
        })}
        <svg width="760" height="760" viewBox="0 0 760 760" style="position:absolute;top:250px;left:160px" xmlns="http://www.w3.org/2000/svg">
          <circle cx="380" cy="380" r="370" fill="none" stroke="${cor.ciano}" stroke-width="3" stroke-dasharray="6 14"/>
        </svg>
        <div style="position:absolute;left:72px;top:440px;display:flex;flex-direction:column;gap:14px">${circulos}</div>
        <div style="position:absolute;left:72px;right:72px;bottom:250px">
          <h1 class="anton" style="font-size:${s.tamanho ?? 124}px;color:#fff;line-height:.9">${s.titulo.map(escapar).join('<br>')}</h1>
        </div>
        ${rodape(s.rodape, s.numero ?? '')}
        ${s.arraste === false ? '' : arrasteSuave({ tema: 'escuro', bottom: 18 })}`,
        cor.noite,
      )
    }

    case 'texto':
      return pagina(
        `${grade}
        ${textura(0.35)}
        <div class="anton" style="position:absolute;top:30px;right:-30px;font-size:560px;color:transparent;-webkit-text-stroke:5px ${cor.ciano};line-height:.8">${escapar(s.numero)}</div>
        ${mira(120, 250)}
        ${notasMiudas(s.notas, 'top:170px;left:110px')}
        <div style="position:absolute;top:400px;left:110px;right:110px">
          <h2 class="anton" style="font-size:116px;color:#fff;line-height:.9">${s.titulo.map(escapar).join('<br>')}</h2>
          <div style="margin-top:48px">
            ${s.paragrafos
              .map(
                (p, i) =>
                  `<p style="${i ? 'margin-top:30px;' : ''}font-size:42px;line-height:1.32;color:rgba(255,255,255,.88);text-wrap:pretty">${marcar(p, { sublinhado: cor.ciano, destaque: cor.ciano })}</p>`,
              )
              .join('')}
          </div>
        </div>
        ${rodape(s.rodape, s.numero, s.arraste !== false)}`,
        cor.noite,
      )

    case 'lista':
      return pagina(
        `${grade}
        ${textura(0.35)}
        <h2 class="anton" style="position:absolute;top:110px;left:72px;right:72px;font-size:130px;color:${cor.ciano};line-height:.9;white-space:nowrap">${escapar(s.titulo)}</h2>
        <div style="position:absolute;top:300px;left:72px;right:72px;display:grid;grid-template-columns:1fr 1fr;border-top:2px solid rgba(255,255,255,.3);border-left:2px solid rgba(255,255,255,.3)">
          ${s.itens
            .map(
              (item, i) => `
              <div style="min-height:340px;padding:34px 32px;border-right:2px solid rgba(255,255,255,.3);border-bottom:2px solid rgba(255,255,255,.3)">
                <span class="mono" style="font-size:24px;color:${cor.ciano}">${String(i + 1).padStart(2, '0')} /</span>
                <p class="anton" style="margin-top:24px;font-size:74px;color:#fff;line-height:.92">${escapar(item.titulo)}</p>
                <p style="margin-top:22px;font-size:30px;line-height:1.38;color:rgba(255,255,255,.75)">${escapar(item.texto)}</p>
              </div>`,
            )
            .join('')}
        </div>
        ${rodape(s.rodape, s.numero, s.arraste !== false)}`,
        cor.noite,
      )

    case 'chamada':
      return pagina(
        `${grade}
        ${textura(0.35)}
        <div style="position:absolute;top:120px;left:72px;right:72px">
          <h2 class="anton" style="font-size:140px;color:#fff;line-height:.9">${s.titulo.map(escapar).join('<br>')}</h2>
          <p style="margin-top:48px;max-width:760px;font-size:50px;line-height:1.3;color:rgba(255,255,255,.88)">${marcar(s.texto, { sublinhado: cor.ciano, destaque: cor.ciano })}</p>
        </div>
        <div style="position:absolute;top:600px;right:100px">${simbolo(assets, { altura: 170, estilo: 'filter:drop-shadow(0 0 40px rgba(34,195,230,.35))' })}</div>
        <div class="anton" style="position:absolute;bottom:236px;left:-24px;font-size:380px;color:${cor.ciano};white-space:nowrap;line-height:.8">${escapar(s.gigante)}</div>
        ${rodape(s.rodape, s.numero)}`,
        cor.noite,
      )
  }
}
