/**
 * Lave Seque Foto — o segundo modelo da lavanderia, para peças com foto.
 *
 * Feito a partir das artes que a própria Lave Seque usa: fundo cinza bem
 * claro, foto real (loja, máquinas, cesto de roupa), blocos de cantos muito
 * arredondados em verde e azul-marinho segurando o texto, títulos em pílulas,
 * números grandes na promoção, relógios azuis e bolhas de sabão.
 *
 * O mesmo desenho serve ao feed (1080x1350) e ao story (1080x1920): cada
 * slide recebe a altura `H` e distribui a sobra entre o topo, o meio e a
 * foto, em vez de só esticar. No story não existe "arraste": lá se toca.
 *
 * A foto vem de quem cria a peça (`foto`); sem ela, entra um espaço com uma
 * máquina de lavar desenhada, para a prévia mostrar onde a foto vai.
 */
import { arraste, arrasteSuave, escapar, HEIGHT, pagina, type TemplateAssets } from '../base'
import { baloo, FONTE, logo, logoMarca } from './lave'

type Foto = { foto?: string | null }
type Arraste = { arraste?: boolean }

export type LaveFotoSlide =
  | ({
      /** Pergunta curta e a resposta em pílulas marinho empilhadas. */
      kind: 'pilulas'
      abertura: string
      pilulas: string[]
    } & Foto &
      Arraste)
  | ({
      /** Bloco verde com o título e a foto sobrepondo embaixo. */
      kind: 'bloco'
      titulo: string
      /** Selo pequeno em pílula, como "Roupas limpas em até 1 hora". */
      selo?: string
    } & Foto &
      Arraste)
  | ({
      /** Foto em cima e um cartão marinho com o título por cima dela. */
      kind: 'cartao'
      titulo: string
      apoio?: string
    } & Foto &
      Arraste)
  | ({
      /** Cartão marinho com título e foto, frase verde ao lado e uma segunda foto emoldurada. */
      kind: 'duasFotos'
      titulo: string
      texto: string
      foto2?: string | null
    } & Foto &
      Arraste)
  | ({
      /** Foto grande à esquerda, caixa verde de texto à direita e faixa marinho no rodapé. */
      kind: 'fotoCaixa'
      texto: string
      rodape?: string
    } & Foto &
      Arraste)
  | ({
      /** Título enorme em duas cores, frase curta e a foto num bloco azul-claro. */
      kind: 'tituloGigante'
      linha1: string
      linha2: string
      apoio?: string
    } & Foto &
      Arraste)
  | ({
      /** Pergunta em marinho, resposta numa barra verde e a foto ocupando a metade de baixo. */
      kind: 'pergunta'
      pergunta: string
      resposta: string
    } & Foto &
      Arraste)
  | ({
      /** Foto de fundo, caixa verde no centro com a frase em três tamanhos e relógios. */
      kind: 'caixaCentral'
      antes: string
      destaque: string
      depois: string
      fecho?: string
    } & Foto &
      Arraste)
  | ({
      /** A oferta em equações grandes: "10 ciclos = 1 grátis". */
      kind: 'promo'
      antes: string
      titulo: string
      ofertas: { de: string; deRotulo: string; por: string; porRotulo: string }[]
      condicao: string
    } & Arraste)
  | ({
      /** Título verde grande no topo, o produto no centro e a regra numa pílula verde. */
      kind: 'oferta'
      linhas: [string, string]
      regra: string
      nota?: string
    } & Foto &
      Arraste)
  | ({
      /** Foto de ponta a ponta, logo grande, frase com contorno verde e onda azul embaixo. */
      kind: 'onda'
      linha1: string
      linha2?: string
    } & Foto &
      Arraste)
  | ({
      /** Foto de ponta a ponta com o título em faixas azul e verde. */
      kind: 'faixas'
      faixas: [string, string]
      texto?: string
      botao?: string
    } & Foto &
      Arraste)

const VERDE = '#21A301'
const VERDE_CLARO = '#7DB43B'
const MARINHO = '#01004C'
const MARINHO2 = '#212B4F'
const AZUL = '#0049AF'
const AZUL_VIVO = '#2F6FE4'
const AZUL_CLARO = '#5BC0F5'
const FUNDO = '#EDEDED'
const FUNDO_ESCURO = '#3a4560'

/** Uma bolha de sabão: brilho no alto e borda furta-cor. */
const bolha = (x: number, y: number, r: number) =>
  `<div style="position:absolute;left:${x}px;top:${y}px;width:${r * 2}px;height:${r * 2}px;border-radius:50%;
    background:radial-gradient(circle at 32% 28%,rgba(255,255,255,.95) 0 8%,rgba(255,255,255,.15) 22%,rgba(255,255,255,0) 60%),
      radial-gradient(circle at 70% 75%,rgba(120,200,255,.35),rgba(255,160,230,.18) 45%,rgba(255,255,255,0) 70%);
    box-shadow:inset 0 0 0 2px rgba(255,255,255,.75),inset -6px -8px 18px rgba(140,120,255,.25),inset 6px 8px 14px rgba(120,255,210,.2)"></div>`

const bolhas = (lista: [number, number, number][]) =>
  lista.map(([x, y, r]) => bolha(x, y, r)).join('')

/** Relógio de parede azul, em volume, como o das artes. */
function relogio(estilo: string, tamanho: number, cor = AZUL_VIVO) {
  const marcas = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6
    const r1 = 40
    const r2 = i % 3 === 0 ? 33 : 36
    return `<line x1="${50 + r1 * Math.sin(a)}" y1="${50 - r1 * Math.cos(a)}" x2="${50 + r2 * Math.sin(a)}" y2="${50 - r2 * Math.cos(a)}" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>`
  }).join('')
  return `<div style="position:absolute;${estilo};width:${tamanho}px;height:${tamanho}px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#6ea2ff,${cor} 60%,#173f9e);box-shadow:0 24px 50px rgba(20,60,160,.35)">
    <svg viewBox="0 0 100 100" width="${tamanho}" height="${tamanho}">
      <circle cx="50" cy="50" r="44" fill="${cor}" stroke="rgba(255,255,255,.35)" stroke-width="2"/>${marcas}
      <line x1="50" y1="50" x2="50" y2="24" stroke="#fff" stroke-width="4" stroke-linecap="round"/>
      <line x1="50" y1="50" x2="66" y2="60" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>
      <circle cx="50" cy="50" r="3.6" fill="#fff"/>
    </svg></div>`
}

/** Sem foto: o espaço dela com uma máquina de lavar em traço, para mostrar onde vai. */
function semFoto(escuro: boolean, topo: number | null) {
  const c = escuro ? 'rgba(255,255,255,.55)' : '#9AA3B5'
  const t = escuro ? 150 : 200
  return `<div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:${topo === null ? 'center' : `flex-start;padding-top:${topo}px`};gap:18px;background:${escuro ? FUNDO_ESCURO : '#D9DCE3'}">
    <svg width="${t}" height="${Math.round(t * 1.15)}" viewBox="0 0 100 115" fill="none" stroke="${c}" stroke-width="4" stroke-linecap="round">
      <rect x="6" y="6" width="88" height="103" rx="10"/><path d="M6 28 H94"/><circle cx="22" cy="17" r="3"/><path d="M60 17 H82"/>
      <circle cx="50" cy="68" r="27"/><path d="M33 72 c8 -8 16 8 34 -4"/>
    </svg>
    <span style="${baloo};font-size:30px;font-weight:700;color:${c}">sua foto aqui</span></div>`
}

/**
 * A foto num espaço posicionado; sem foto, o espaço desenhado.
 * `topo`: em foto de fundo inteiro, onde o desenho fica, para não cair atrás do texto.
 */
function foto(
  url: string | null | undefined,
  estilo: string,
  { escuro = false, topo = null }: { escuro?: boolean; topo?: number | null } = {},
) {
  const dentro = url
    ? `<img src="${escapar(url)}" alt="" style="width:100%;height:100%;object-fit:cover">`
    : semFoto(escuro, topo)
  return `<div style="position:absolute;overflow:hidden;${estilo}">${dentro}</div>`
}

/**
 * O logo sobre foto: numa pílula branca, para não sumir no fundo. Logo de
 * marca costuma ser feito para fundo claro.
 */
const logoNaFoto = (assets: TemplateAssets, top: number, altura: number) =>
  `<div style="position:absolute;top:${top}px;left:0;right:0;display:flex;justify-content:center"><div style="padding:${altura * 0.12}px ${altura * 0.3}px;border-radius:999px;background:rgba(255,255,255,.94);box-shadow:0 14px 36px rgba(0,0,0,.18)">${logoMarca(assets, altura)}</div></div>`

const pilula = (texto: string, fundo: string, tamanho: number, extra = '') =>
  `<div style="display:inline-block;padding:${tamanho * 0.12}px ${tamanho * 0.5}px ${tamanho * 0.04}px;border-radius:999px;background:${fundo};${baloo};font-size:${tamanho}px;font-weight:800;line-height:1.1;color:#fff;${extra}">${escapar(texto)}</div>`

/** Texto branco com contorno verde grosso, como nas artes de story. */
const contornado = (tamanho: number) =>
  `${baloo};font-size:${tamanho}px;font-weight:800;line-height:1.02;color:#fff;-webkit-text-stroke:${Math.round(tamanho * 0.14)}px ${VERDE};paint-order:stroke fill`

/**
 * Desenha um slide. `H` é a altura: 1350 no feed, 1920 no story.
 * No story o aviso de arraste nunca aparece.
 */
export function renderLaveFoto(s: LaveFotoSlide, assets: TemplateAssets, H = HEIGHT): string {
  const d = H - HEIGHT
  const story = d > 0
  const comArraste = !story && s.arraste !== false

  /** Aviso de arraste verde num canto de baixo. */
  const avisoArraste = (lado: 'esquerda' | 'direita' | 'centro' = 'esquerda', bottom = 56) =>
    !comArraste
      ? ''
      : lado === 'centro'
        ? `<div style="position:absolute;left:0;right:0;bottom:${bottom}px;display:flex;justify-content:center">${arraste({ fundo: VERDE, cor: '#fff' })}</div>`
        : `<div style="position:absolute;${lado === 'esquerda' ? 'left:80px' : 'right:80px'};bottom:${bottom}px">${arraste({ fundo: VERDE, cor: '#fff' })}</div>`

  const doc = (corpo: string, fundo = FUNDO) => pagina(corpo, fundo, FONTE, H)

  switch (s.kind) {
    case 'pilulas':
      return doc(
        `${foto(s.foto, `left:0;right:0;bottom:0;height:${470 + d * 0.8}px;-webkit-mask-image:linear-gradient(to bottom,transparent,#000 35%);mask-image:linear-gradient(to bottom,transparent,#000 35%)`)}
        ${bolhas([
          [40, 90 + d * 0.2, 70],
          [880, 40 + d * 0.2, 90],
          [930, 560 + d * 0.3, 50],
          [60, 700 + d * 0.3, 36],
        ])}
        ${logo(assets, 70 + d * 0.2)}
        <div style="position:absolute;top:${330 + d * 0.3}px;left:70px;right:70px;text-align:center">
          <p style="${baloo};font-size:54px;font-weight:800;line-height:1.1;text-transform:uppercase;color:${MARINHO2}">${escapar(s.abertura)}</p>
          <div style="margin-top:26px;display:flex;flex-direction:column;align-items:center;gap:18px">
            ${s.pilulas.map((p) => pilula(p.toUpperCase(), MARINHO2, 96, 'box-shadow:0 14px 30px rgba(1,0,76,.18)')).join('')}
          </div>
        </div>
        ${comArraste ? arrasteSuave({ tema: 'claro', bottom: 44 }) : ''}`,
      )

    case 'bloco':
      return doc(
        `${bolhas([
          [860, 380 + d * 0.3, 60],
          [40, 620 + d * 0.5, 80],
          [900, 1000 + d * 0.8, 44],
        ])}
        <div style="position:absolute;left:-60px;top:-60px;width:780px;height:${820 + d * 0.4}px;border-radius:0 0 140px 0;background:${VERDE}"></div>
        <div style="position:absolute;right:70px;top:${60 + d * 0.2}px">${logoMarca(assets, 150)}</div>
        <div style="position:absolute;left:90px;top:${150 + d * 0.25}px;width:560px">
          <h1 style="${baloo};font-size:88px;font-weight:800;line-height:1;color:#fff;text-wrap:balance">${escapar(s.titulo)}</h1>
          ${s.selo ? `<div style="margin-top:34px;display:inline-block;padding:12px 30px 8px;border:4px solid #fff;border-radius:999px;${baloo};font-size:34px;font-weight:800;line-height:1.1;color:#fff">${escapar(s.selo)}</div>` : ''}
        </div>
        ${foto(s.foto, `left:190px;right:110px;top:${690 + d * 0.4}px;height:${500 + d * 0.4}px;border-radius:56px;box-shadow:0 30px 60px rgba(0,0,0,.18)`)}
        ${avisoArraste('direita')}`,
      )

    case 'cartao': {
      const topoCartao = 640 + d * 0.85
      return doc(
        `${bolhas([
          [900, 60 + d * 0.15, 70],
          [30, 1100 + d * 0.7, 60],
        ])}
        ${foto(s.foto, `left:90px;right:90px;top:${90 + d * 0.15}px;height:${720 + d * 0.7}px;border-radius:40px`)}
        <div style="position:absolute;left:90px;right:90px;top:${topoCartao}px;height:${500 + d * 0.1}px;border-radius:40px;background:${MARINHO2};box-shadow:0 30px 60px rgba(1,0,76,.25)"></div>
        <div style="position:absolute;right:130px;top:${topoCartao + 50}px">${logoMarca(assets, 110)}</div>
        <h2 style="position:absolute;left:150px;top:${topoCartao + 50}px;width:520px;${baloo};font-size:96px;font-weight:800;line-height:1;color:#fff;text-wrap:balance">${escapar(s.titulo)}</h2>
        ${s.apoio ? `<div style="position:absolute;left:330px;right:40px;top:${topoCartao + 360 + d * 0.05}px;padding:20px 40px 14px;border-radius:999px 0 0 999px;background:${VERDE_CLARO};${baloo};font-size:36px;font-weight:800;line-height:1.1;color:#fff;white-space:nowrap">${escapar(s.apoio)}</div>` : ''}
        ${avisoArraste()}`,
      )
    }

    case 'duasFotos': {
      const t = 120 + d * 0.45
      return doc(
        `<div style="position:absolute;right:-90px;top:${-60 + d * 0.2}px;width:300px;height:300px;border-radius:50%;border:34px solid ${AZUL_VIVO}"></div>
        <div style="position:absolute;right:150px;top:${-40 + d * 0.2}px;width:120px;height:120px;border-radius:50%;border:16px solid ${AZUL_VIVO}"></div>
        ${bolhas([
          [20, 830 + t, 70],
          [80, 1010 + t * 0.6, 40],
        ])}
        <div style="position:absolute;left:470px;right:90px;top:${t + 560 + d * 0.25}px;height:560px;border-radius:36px;border:8px solid ${VERDE};background:linear-gradient(90deg,${VERDE} 0 22%,#fff 22%)"></div>
        ${foto(s.foto2, `left:540px;right:110px;top:${t + 600 + d * 0.25}px;height:480px;border-radius:24px`)}
        <div style="position:absolute;left:90px;top:${t}px;width:470px;height:${800 + d * 0.25}px;border-radius:40px;background:${MARINHO};box-shadow:0 30px 60px rgba(1,0,76,.25)"></div>
        <h2 style="position:absolute;left:130px;top:${t + 40}px;width:400px;${baloo};font-size:62px;font-weight:800;line-height:1.05;color:#fff;text-wrap:balance">${escapar(s.titulo)}</h2>
        ${foto(s.foto, `left:120px;top:${t + 230}px;width:410px;height:${540 + d * 0.25}px;border-radius:28px`)}
        <div style="position:absolute;left:620px;top:${t + 40}px">${logoMarca(assets, 120)}</div>
        <p style="position:absolute;left:620px;right:70px;top:${t + 220}px;${baloo};font-size:58px;font-weight:800;line-height:1.08;color:${VERDE};text-wrap:balance">${escapar(s.texto)}</p>
        ${avisoArraste('esquerda', 50)}`,
      )
    }

    case 'fotoCaixa': {
      const t = 300 + d * 0.3
      return doc(
        `${relogio(`left:-70px;top:${-120 + d * 0.15}px`, 380, VERDE)}
        <div style="position:absolute;right:70px;top:${60 + d * 0.2}px">${logoMarca(assets, 150)}</div>
        ${foto(s.foto, `left:0;top:${t}px;width:740px;height:${880 + d * 0.6}px;border-radius:0 48px 48px 0`)}
        <div style="position:absolute;right:50px;top:${t + 120}px;width:470px;padding:40px 36px 30px;border-radius:32px;background:${VERDE};box-shadow:0 26px 50px rgba(33,163,1,.3);${baloo};font-size:50px;font-weight:800;line-height:1.08;color:#fff;text-transform:uppercase;text-align:center">${escapar(s.texto)}</div>
        ${s.rodape ? `<div style="position:absolute;left:40px;right:40px;bottom:0;padding:26px 40px ${comArraste ? 120 : 26}px;border-radius:40px 40px 0 0;background:${MARINHO};text-align:center;${baloo};font-size:34px;font-weight:700;line-height:1.2;color:#fff">${escapar(s.rodape)}</div>` : ''}
        ${avisoArraste('centro', 30)}`,
      )
    }

    case 'tituloGigante': {
      const t = 230 + d * 0.3
      return doc(
        `${bolhas([
          [60, 900 + d * 0.5, 50],
          [940, 1180 + d * 0.8, 36],
        ])}
        <div style="position:absolute;right:70px;top:${60 + d * 0.2}px">${logoMarca(assets, 140)}</div>
        <div style="position:absolute;left:40px;right:40px;top:${t}px;text-align:center">
          <h1 style="${baloo};font-size:170px;font-weight:800;line-height:.86;letter-spacing:-.02em;color:${VERDE_CLARO}">${escapar(s.linha1)}</h1>
          <h1 style="${baloo};font-size:190px;font-weight:800;line-height:.9;letter-spacing:-.03em;color:${MARINHO}">${escapar(s.linha2)}</h1>
          ${s.apoio ? `<p style="${baloo};margin-top:10px;font-size:44px;font-weight:600;line-height:1.15;color:${VERDE_CLARO}">${escapar(s.apoio)}</p>` : ''}
        </div>
        <div style="position:absolute;left:170px;right:150px;bottom:0;height:${470 + d * 0.3}px;background:${AZUL_CLARO};border-radius:36px 36px 0 0"></div>
        ${foto(s.foto, `left:220px;right:200px;top:${t + 520 + d * 0.15}px;height:${460 + d * 0.2}px;border-radius:40px;box-shadow:0 30px 60px rgba(0,0,0,.2)`)}
        ${avisoArraste('esquerda', 50)}`,
      )
    }

    case 'pergunta': {
      const t = 320 + d * 0.3
      return doc(
        `<div style="position:absolute;left:-200px;top:${-120 + d * 0.1}px;width:330px;height:${900 + d * 0.3}px;border-radius:50%;background:${MARINHO}"></div>
        ${logo(assets, 60 + d * 0.2, 150)}
        <p style="position:absolute;left:110px;right:110px;top:${t}px;text-align:center;${baloo};font-size:60px;font-weight:800;line-height:1.05;text-transform:uppercase;color:${MARINHO};text-wrap:balance">${escapar(s.pergunta)}</p>
        <div style="position:absolute;left:110px;right:110px;top:${t + 150}px;padding:20px 30px 12px;border-radius:28px;background:${VERDE};text-align:center;${baloo};font-size:46px;font-weight:800;line-height:1.08;text-transform:uppercase;color:#fff;text-wrap:balance">${escapar(s.resposta)}</div>
        ${foto(s.foto, `left:0;right:0;top:${t + 330}px;bottom:0`)}
        <div style="position:absolute;right:-260px;bottom:-220px;width:560px;height:${820 + d * 0.3}px;border-radius:50%;background:${MARINHO}"></div>
        ${avisoArraste('esquerda', 50)}`,
      )
    }

    case 'caixaCentral': {
      const t = 480 + d * 0.4
      return doc(
        `${foto(s.foto, 'inset:0', { escuro: true, topo: 260 + d * 0.2 })}
        <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(255,255,255,.15),rgba(255,255,255,0) 40%,rgba(255,255,255,.35))"></div>
        ${relogio(`left:-80px;top:${t - 260}px`, 300)}
        ${relogio(`right:-150px;top:${t + 620}px`, 480)}
        ${logoNaFoto(assets, 60 + d * 0.2, 130)}
        <div style="position:absolute;left:100px;right:100px;top:${t}px;padding:44px 30px 40px;border-radius:36px;background:${VERDE};text-align:center;box-shadow:0 30px 60px rgba(0,0,0,.25);${baloo};color:#fff;text-transform:uppercase">
          <p style="font-size:50px;font-weight:800;line-height:1.05">${escapar(s.antes)}</p>
          <p style="margin-top:6px;font-size:112px;font-weight:800;line-height:1;text-shadow:0 6px 0 rgba(0,0,0,.22)">${escapar(s.destaque)}</p>
          <p style="margin-top:12px;font-size:48px;font-weight:800;line-height:1.05">${escapar(s.depois)}</p>
        </div>
        ${s.fecho ? `<p style="position:absolute;left:130px;width:520px;top:${t + 470}px;padding:16px 26px 10px;border-radius:20px;background:rgba(255,255,255,.88);${baloo};font-size:46px;font-weight:800;line-height:1.05;text-transform:uppercase;color:${MARINHO}">${escapar(s.fecho)}</p>` : ''}
        ${avisoArraste('esquerda', 50)}`,
        FUNDO_ESCURO,
      )
    }

    case 'promo': {
      const circulo = (estilo: string, tamanho: number) =>
        `<div style="position:absolute;${estilo};width:${tamanho}px;height:${tamanho}px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#2a2f7a,${MARINHO} 70%);display:grid;place-items:center;${baloo};font-size:${tamanho * 0.5}px;font-weight:800;color:#fff;box-shadow:0 20px 40px rgba(1,0,76,.3)">%</div>`
      const t = 290 + d * 0.4
      return doc(
        `${circulo(`right:-70px;top:${120 + d * 0.25}px`, 260)}${circulo(`left:-50px;top:${520 + d * 0.35}px`, 150)}
        ${bolhas([
          [60, 140 + d * 0.2, 50],
          [920, 1000 + d * 0.6, 60],
        ])}
        ${logo(assets, 60 + d * 0.2)}
        <div style="position:absolute;top:${t}px;left:0;right:0;text-align:center">
          <p style="${baloo};font-size:56px;font-weight:800;line-height:1;color:${MARINHO}">${escapar(s.antes)}</p>
          <h1 style="${baloo};font-size:130px;font-weight:800;line-height:.95;color:#fff;-webkit-text-stroke:6px ${MARINHO};paint-order:stroke fill;text-transform:uppercase">${escapar(s.titulo)}</h1>
        </div>
        <div style="position:absolute;left:150px;right:150px;top:${t + 270}px;padding:50px 50px;border-radius:48px;background:${VERDE};display:flex;flex-direction:column;gap:40px;box-shadow:0 30px 60px rgba(33,163,1,.25)">
          ${s.ofertas
            .map(
              (
                o,
              ) => `<div style="display:flex;align-items:center;justify-content:center;gap:20px;color:#fff;${baloo}">
                <div style="text-align:center"><div style="font-size:150px;font-weight:800;line-height:.9">${escapar(o.de)}</div><div style="font-size:28px;font-weight:800;text-transform:uppercase">${escapar(o.deRotulo)}</div></div>
                <div style="font-size:120px;font-weight:800;line-height:.9;padding-bottom:30px">=</div>
                <div style="text-align:center"><div style="font-size:150px;font-weight:800;line-height:.9">${escapar(o.por)}</div><div style="font-size:28px;font-weight:800;text-transform:uppercase">${escapar(o.porRotulo)}</div></div>
              </div>`,
            )
            .join('')}
        </div>
        <div style="position:absolute;left:0;right:0;bottom:0;padding:26px 60px ${comArraste ? 130 : 26 + d * 0.15}px;background:${MARINHO};text-align:center;${baloo};font-size:32px;font-weight:700;line-height:1.2;color:#fff">${escapar(s.condicao)}</div>
        ${avisoArraste('centro', 30)}`,
      )
    }

    case 'oferta': {
      const tag = (estilo: string, tamanho: number, giro: number) =>
        `<div style="position:absolute;${estilo};width:${tamanho}px;height:${tamanho * 1.2}px;border-radius:${tamanho * 0.22}px ${tamanho * 0.22}px ${tamanho * 0.5}px ${tamanho * 0.5}px;transform:rotate(${giro}deg);background:radial-gradient(circle at 35% 30%,#6ea2ff,${AZUL_VIVO} 55%,#173f9e);display:grid;place-items:center;${baloo};font-size:${tamanho * 0.5}px;font-weight:800;color:#fff;box-shadow:0 20px 40px rgba(20,60,160,.3)">%</div>`
      const t = 190 + d * 0.25
      return doc(
        `${tag(`left:-40px;top:${560 + d * 0.4}px`, 170, -18)}${tag(`right:-30px;top:${520 + d * 0.4}px`, 150, 16)}${tag(`right:-40px;bottom:${-30 + d * 0.1}px`, 200, -10)}
        ${logo(assets, 40 + d * 0.2, 140)}
        <div style="position:absolute;left:40px;right:40px;top:${t}px;text-align:center">
          ${s.linhas.map((l) => `<h1 style="${baloo};font-size:128px;font-weight:800;line-height:.92;letter-spacing:-.01em;color:${VERDE_CLARO}">${escapar(l)}</h1>`).join('')}
        </div>
        ${foto(s.foto, `left:190px;right:190px;top:${t + 290}px;height:${560 + d * 0.6}px;border-radius:48px;box-shadow:0 30px 60px rgba(0,0,0,.18)`)}
        <div style="position:absolute;left:0;right:0;bottom:${(comArraste ? 150 : 110) + d * 0.15}px;display:flex;flex-direction:column;align-items:center;gap:14px">
          ${pilula(s.regra, VERDE_CLARO, 34)}
          ${s.nota ? `<span style="${baloo};font-size:26px;font-weight:700;color:#8C93A8">${escapar(s.nota)}</span>` : ''}
        </div>
        ${avisoArraste('centro', 40)}`,
        '#F2F3F5',
      )
    }

    case 'onda':
      return doc(
        `${foto(s.foto, 'inset:0', { escuro: true, topo: H * 0.42 })}
        <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(1,0,76,0) 50%,rgba(0,73,175,.5))"></div>
        <svg style="position:absolute;left:0;bottom:0" width="1080" height="${360 + d * 0.2}" viewBox="0 0 1080 360" preserveAspectRatio="none">
          <defs><linearGradient id="onda" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${AZUL_VIVO}"/><stop offset="1" stop-color="${AZUL}"/></linearGradient></defs>
          <path d="M0 120 C 260 40, 520 200, 780 110 S 1080 60, 1080 60 V360 H0 Z" fill="url(#onda)"/>
          <path d="M0 170 C 300 90, 560 250, 820 160 S 1080 120, 1080 120" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="6"/>
        </svg>
        ${bolhas([
          [70, H * 0.3, 40],
          [920, H * 0.45, 56],
        ])}
        ${logoNaFoto(assets, 150 + d * 0.15, 220)}
        <p style="position:absolute;left:80px;right:120px;top:${H * 0.58}px;${contornado(82)}">${escapar(s.linha1)}</p>
        ${s.linha2 ? `<p style="position:absolute;left:200px;right:80px;top:${H * 0.58 + 230}px;text-align:right;${contornado(74)}">${escapar(s.linha2)}</p>` : ''}
        ${avisoArraste('esquerda', 50)}`,
        FUNDO_ESCURO,
      )

    case 'faixas':
      return doc(
        `${foto(s.foto, 'inset:0', { escuro: true, topo: 250 + d * 0.2 })}
        <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(1,0,76,.25),rgba(1,0,76,0) 30%,rgba(1,0,76,0) 60%,rgba(1,0,76,.55))"></div>
        ${bolhas([
          [860, 200 + d * 0.2, 70],
          [60, 300 + d * 0.2, 50],
          [900, 900 + d * 0.5, 40],
        ])}
        ${logoNaFoto(assets, 60 + d * 0.2, 150)}
        <div style="position:absolute;left:0;top:${520 + d * 0.35}px;display:flex;flex-direction:column;align-items:flex-start;gap:14px">
          <div style="padding:16px 70px 8px 80px;border-radius:0 999px 999px 0;background:${AZUL};${baloo};font-size:88px;font-weight:800;line-height:1.05;color:#fff">${escapar(s.faixas[0])}</div>
          <div style="padding:16px 70px 8px 80px;border-radius:0 999px 999px 0;background:${VERDE_CLARO};${baloo};font-size:88px;font-weight:800;line-height:1.05;color:#fff">${escapar(s.faixas[1])}</div>
        </div>
        ${s.texto ? `<p style="position:absolute;left:80px;right:120px;top:${800 + d * 0.4}px;${baloo};font-size:46px;font-weight:700;line-height:1.2;color:#fff;text-shadow:0 4px 18px rgba(0,0,0,.45)">${escapar(s.texto)}</p>` : ''}
        ${s.botao ? `<div style="position:absolute;left:80px;bottom:${(comArraste ? 160 : 90) + d * 0.25}px">${pilula(s.botao, VERDE, 44)}</div>` : ''}
        ${avisoArraste()}`,
        FUNDO_ESCURO,
      )
  }
}
