/**
 * A base que todos os modelos dividem: tamanho, cores, fontes, textura,
 * destaques no texto e o espaço de foto.
 *
 * Tudo aqui devolve texto HTML, sem depender de navegador nem de Node: o mesmo
 * código desenha a prévia na tela de criação e, no worker, a imagem final.
 */

export const WIDTH = 1080
export const HEIGHT = 1350

export const cor = {
  azul: '#1C8CFF',
  ciano: '#22C3E6',
  noite: '#0B1F3A',
  noite2: '#102a4c',
  grafite: '#1A1D23',
  ardosia: '#5A6B82',
  gelo: '#F4F7FB',
  papel: '#E9EDF3',
} as const

/** Arquivos que o modelo usa e que moram fora dele. Quem desenha passa o endereço. */
export type TemplateAssets = {
  /** O "F" facetado da Firmus, em PNG. */
  symbolUrl: string
  /** O logo da empresa dona do modelo, quando ela enviou um. */
  logoUrl?: string | null
  /** O nome da empresa: entra em texto quando não há logo, num post de verdade. */
  marca?: string | null
}

const FONTES =
  'https://fonts.googleapis.com/css2?family=Anton&family=Inter:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,300&family=Michroma&display=swap'

export const escapar = (texto = '') =>
  String(texto)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

/**
 * Marcação do texto dos slides:
 *   *palavra*    cor de destaque
 *   **trecho**   sublinhado grosso, como marca-texto embaixo da linha
 *   quebra de linha vira <br>
 */
export function marcar(
  texto = '',
  { destaque = cor.azul, sublinhado = cor.ciano }: { destaque?: string; sublinhado?: string } = {},
) {
  return escapar(texto)
    .replace(
      /\*\*(.+?)\*\*/g,
      `<span style="font-weight:700;text-decoration:underline;text-decoration-color:${sublinhado};text-decoration-thickness:.16em;text-underline-offset:.14em;text-decoration-skip-ink:none">$1</span>`,
    )
    .replace(/\*(.+?)\*/g, `<span style="color:${destaque}">$1</span>`)
    .replaceAll('\n', '<br>')
}

/** Textura de papel: ruído fino de um filtro SVG, sem imagem de fora. */
export function textura(opacidade = 0.22) {
  const svg =
    "<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'>" +
    "<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/>" +
    "<feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .6 0'/></filter>" +
    "<rect width='100%' height='100%' filter='url(%23n)'/></svg>"
  return `<div style="position:absolute;inset:0;pointer-events:none;opacity:${opacidade};mix-blend-mode:multiply;background-image:url(&quot;data:image/svg+xml;utf8,${svg}&quot;)"></div>`
}

/** O símbolo da Firmus, grande, como elemento gráfico. */
export function simbolo(assets: TemplateAssets, { altura = 600, estilo = '' } = {}) {
  return `<img src="${escapar(assets.symbolUrl)}" alt="" style="height:${altura}px;${estilo}">`
}

/** Janela de navegador em SVG: o elemento gráfico de quem faz site. */
export function janela({
  largura = 620,
  fundo = '#ffffff',
  traco: t = cor.noite as string,
  destaque = cor.azul as string,
} = {}) {
  const altura = Math.round(largura * 0.72)
  return `<svg width="${largura}" height="${altura}" viewBox="0 0 620 446" xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="6" width="608" height="434" rx="22" fill="${fundo}" stroke="${t}" stroke-width="8"/>
    <line x1="6" y1="70" x2="614" y2="70" stroke="${t}" stroke-width="8"/>
    <circle cx="44" cy="38" r="11" fill="${destaque}"/><circle cx="80" cy="38" r="11" fill="${t}" opacity=".25"/><circle cx="116" cy="38" r="11" fill="${t}" opacity=".25"/>
    <rect x="150" y="26" width="300" height="24" rx="12" fill="${t}" opacity=".12"/>
    <rect x="48" y="110" width="330" height="34" rx="6" fill="${t}"/>
    <rect x="48" y="160" width="250" height="20" rx="6" fill="${t}" opacity=".35"/>
    <rect x="48" y="192" width="290" height="20" rx="6" fill="${t}" opacity=".35"/>
    <rect x="48" y="240" width="170" height="54" rx="12" fill="${destaque}"/>
    <rect x="410" y="110" width="162" height="184" rx="14" fill="${destaque}" opacity=".18"/>
    <rect x="48" y="330" width="160" height="70" rx="10" fill="${t}" opacity=".08"/>
    <rect x="230" y="330" width="160" height="70" rx="10" fill="${t}" opacity=".08"/>
    <rect x="412" y="330" width="160" height="70" rx="10" fill="${t}" opacity=".08"/>
  </svg>`
}

/**
 * O espaço de foto. Com `foto`, a imagem preenche o espaço; sem ela, entra o
 * elemento gráfico do modelo em `semFoto`.
 */
export function espacoFoto({
  foto,
  estilo,
  semFoto,
  filtro = '',
}: {
  foto?: string | null
  estilo: string
  semFoto: string
  filtro?: string
}) {
  if (foto) {
    return `<div style="${estilo};overflow:hidden"><img src="${escapar(foto)}" alt="" style="width:100%;height:100%;object-fit:cover;${filtro}"></div>`
  }
  return `<div style="${estilo};display:flex;align-items:center;justify-content:center">${semFoto}</div>`
}

/** O documento de um slide, com as fontes e o tamanho do feed (1080x1350). */
/** `fontes`: endereço do Google Fonts de um modelo que usa outra família. */
export function pagina(corpo: string, fundo: string = cor.gelo, fontes?: string) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<link href="${FONTES}" rel="stylesheet">${fontes ? `\n<link href="${fontes}" rel="stylesheet">` : ''}
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body { width:${WIDTH}px; height:${HEIGHT}px; }
  body { position:relative; overflow:hidden; background:${fundo}; font-family:'Inter',sans-serif; -webkit-font-smoothing:antialiased; }
  .anton { font-family:'Anton',sans-serif; font-weight:400; text-transform:uppercase; line-height:.86; letter-spacing:-.005em; }
  .mono { font-family:ui-monospace,'JetBrains Mono',monospace; letter-spacing:.08em; text-transform:uppercase; }
  h1, h2, p { text-wrap:balance; }
</style></head><body>${corpo}</body></html>`
}

/** Rótulos dos quatro cantos, que amarram os slides de um carrossel. */
export function cantos({
  cima = ['Firmus Tech', 'Siga a Firmus'],
  baixo = ['Arrasta aí →', '#firmustech'],
  corTexto = cor.ardosia as string,
  margem = 72,
}: { cima?: [string, string]; baixo?: [string, string]; corTexto?: string; margem?: number } = {}) {
  const estilo = `position:absolute;font-size:24px;font-weight:500;color:${corTexto}`
  return `
    <span style="${estilo};top:${margem}px;left:${margem}px">${escapar(cima[0])}</span>
    <span style="${estilo};top:${margem}px;right:${margem}px">${escapar(cima[1])}</span>
    <span style="${estilo};bottom:${margem}px;left:${margem}px">${escapar(baixo[0])}</span>
    <span style="${estilo};bottom:${margem}px;right:${margem}px">${escapar(baixo[1])}</span>`
}

/** Seta de "arraste": traço e ponta, na cor do texto. */
const setaArraste = (c: string) =>
  `<svg width="46" height="22" viewBox="0 0 46 22" xmlns="http://www.w3.org/2000/svg"><path d="M2 11 H40 M30 2 L42 11 L30 20" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`

/**
 * O aviso "Arraste para o lado" dos slides de carrossel.
 *
 * Vai em todo slide menos o último: é o que diz a quem chegou pela capa que
 * existe mais. Devolve o elemento sem posição; quem posiciona é o modelo.
 * - `pilula`: arredondado, para o kit
 * - `caixa`: quadrado com sombra dura, para o editorial
 */
export function arraste({
  cor: c = '#fff',
  fundo = cor.azul as string,
  forma = 'pilula',
  borda,
  sombra,
}: {
  cor?: string
  fundo?: string
  forma?: 'pilula' | 'caixa'
  borda?: string
  sombra?: string
} = {}) {
  const caixa = forma === 'caixa'
  return `<div class="${caixa ? 'mono' : ''}" style="display:inline-flex;align-items:center;gap:16px;padding:${caixa ? '18px 26px' : '16px 28px'};border-radius:${caixa ? 0 : 999}px;background:${fundo};${borda ? `border:4px solid ${borda};` : ''}${sombra ? `box-shadow:8px 8px 0 ${sombra};` : ''}font-size:${caixa ? 24 : 27}px;font-weight:${caixa ? 500 : 700};color:${c};white-space:nowrap">Arraste para o lado ${setaArraste(c)}</div>`
}

/**
 * A versão delicada do aviso, para a capa: pequena, centralizada embaixo e
 * translúcida. Na capa o que manda é o título; o aviso só sussurra que tem
 * mais. `claro` é para quando o aviso cai sobre fundo claro ou sobre a figura.
 */
export function arrasteSuave({
  tema = 'escuro',
  bottom = 60,
}: { tema?: 'escuro' | 'claro'; bottom?: number } = {}) {
  const escuro = tema === 'escuro'
  const texto = escuro ? 'rgba(255,255,255,.72)' : '#fff'
  return `<div style="position:absolute;left:0;right:0;bottom:${bottom}px;display:flex;justify-content:center;pointer-events:none">
    <span style="display:inline-flex;align-items:center;gap:12px;padding:10px 22px;border-radius:999px;background:${escuro ? 'rgba(255,255,255,.08)' : 'rgba(11,31,58,.5)'};font-size:20px;font-weight:500;letter-spacing:.06em;color:${texto};white-space:nowrap">
      arraste para o lado
      <svg width="34" height="16" viewBox="0 0 34 16" xmlns="http://www.w3.org/2000/svg"><path d="M2 8 H30 M23 2 L31 8 L23 14" fill="none" stroke="${texto}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </span>
  </div>`
}
