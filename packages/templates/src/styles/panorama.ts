/**
 * Panorama — o carrossel como uma tira contínua.
 *
 * A peça inteira é desenhada numa tela larga (5 slides = 5400x1350) e cada
 * slide é uma janela de 1080 dessa tela. Os objetos atravessam de um slide
 * para o outro — o celular começa num e termina no seguinte —, e é isso que
 * faz quem arrasta sentir que está andando por uma cena só.
 *
 * O texto fica numa coluna: fino e claro, com poucas palavras em negrito
 * branco ou em ciano, uma frase escrita à mão, caixas de vidro e uma caixa
 * "terminal". Cores da Firmus.
 *
 * Fundo: uma ilustração larga enviada por quem cria (`fundo`, proporção do
 * carrossel inteiro). Sem ela, entra a cena desenhada aqui — celular, painel,
 * conversa e cartões da Firmus, com uma faixa de luz atravessando tudo.
 */
import { cor, escapar, pagina, simbolo, WIDTH, type TemplateAssets } from '../base'

export type PanoramaSlide =
  | {
      kind: 'capa'
      /** A frase fina de cima, dentro da moldura tracejada. */
      antes: string
      linha1: string
      linha2: string
      /** A pílula de vidro embaixo. `**trecho**` fica em negrito. */
      selo?: string
      /**
       * Personagem recortado (PNG sem fundo), na frente da segunda linha do
       * título, como o herói da capa. Sem ele, entra o símbolo da Firmus.
       */
      personagem?: string | null
      /**
       * Quanto mover o personagem para o lado, em px (positivo = direita).
       * Centralizar a imagem nem sempre centraliza o corpo: um braço aberto
       * de um lado puxa o corpo para o outro.
       */
      personagemAjuste?: number
    }
  | {
      kind: 'texto'
      /** Cada item é um parágrafo. `**trecho**` negrito branco, `*trecho*` ciano. */
      paragrafos: string[]
      /** Caixa de vidro escura com uma frase de apoio. */
      destaque?: string
      /** Caixa "terminal", em letra de máquina de escrever. */
      terminal?: string
      /** Frase escrita à mão, no fim. */
      manuscrito?: string
    }
  | {
      kind: 'chamada'
      antes: string
      linha1: string
      linha2: string
      /** A frase escrita à mão com a seta, embaixo do título. */
      manuscrito: string
    }

export type PanoramaPost = {
  slides: PanoramaSlide[]
  /** A ilustração larga do fundo, quando enviada. */
  fundo?: string | null
  instagram?: string
}

const FONTES =
  'https://fonts.googleapis.com/css2?family=Mulish:wght@300;400;800;900&family=Caveat:wght@700&family=Permanent+Marker&family=Space+Mono:wght@400;700&display=swap'

const H = 1350

/** `**trecho**` vira negrito branco; `*trecho*` vira ciano em negrito. */
function realce(texto: string) {
  return escapar(texto)
    .replace(/\*\*(.+?)\*\*/g, '<b style="font-weight:900;color:#fff">$1</b>')
    .replace(/\*(.+?)\*/g, `<b style="font-weight:900;color:${cor.ciano}">$1</b>`)
}

/** Ruído fino em SVG, para o título ter textura de impressão. */
const grao =
  "url(&quot;data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.75 0 0 0 0 0.82 0 0 0 0 0.92 0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23g)'/></svg>&quot;)"

const tituloGrande = (texto: string, tamanho: number, tom: 'branco' | 'ciano') =>
  `<div class="anton" style="font-size:${tamanho}px;line-height:.86;white-space:nowrap;background:${grao},${tom === 'branco' ? '#fff' : cor.ciano};-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 0 26px ${tom === 'branco' ? 'rgba(255,255,255,.28)' : 'rgba(34,195,230,.55)'}) drop-shadow(0 12px 30px rgba(0,0,0,.6))">${escapar(texto)}</div>`

/** Seta de mover, como quando um elemento está selecionado no editor. */
const cursorMover = `
  <svg width="64" height="64" viewBox="0 0 32 32" style="filter:drop-shadow(0 4px 8px rgba(0,0,0,.5))">
    <path d="M4 3 L4 20 L8.4 15.8 L11.4 22.6 L14.2 21.4 L11.2 14.6 L17 14.6 Z" fill="#0b1f3a" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>
    <g transform="translate(19 19)" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none">
      <path d="M0 -6 V6 M-6 0 H6"/><path d="M-2 -4 L0 -6 L2 -4 M-2 4 L0 6 L2 4 M-4 -2 L-6 0 L-4 2 M4 -2 L6 0 L4 2"/>
    </g>
  </svg>`

const vidro = (conteudo: string, estilo = '') =>
  `<div style="border:1.5px solid rgba(255,255,255,.28);background:rgba(255,255,255,.08);box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 18px 40px rgba(0,0,0,.35);backdrop-filter:blur(14px);${estilo}">${conteudo}</div>`

/* ---------------------------------------------------------------- a cena */

/** Celular com um painel da plataforma na tela. */
const celular = (x: number, y: number, giro: number) => `
  <div style="position:absolute;left:${x}px;top:${y}px;width:470px;height:930px;transform:rotate(${giro}deg);border-radius:70px;background:#0a0f1c;padding:16px;box-shadow:0 0 0 3px #2b3446,0 50px 90px rgba(0,0,0,.7),0 0 120px rgba(28,140,255,.35)">
    <div style="position:relative;width:100%;height:100%;border-radius:56px;overflow:hidden;background:linear-gradient(170deg,#0e2a52,#071226)">
      <div style="position:absolute;top:18px;left:50%;transform:translateX(-50%);width:130px;height:34px;border-radius:20px;background:#000"></div>
      <div style="position:absolute;top:80px;left:30px;right:30px;padding:16px 22px;border-radius:999px;border:2px solid rgba(34,195,230,.6);font:600 24px Mulish;color:#cfefff">⌕ meu Instagram, mês inteiro</div>
      ${[0, 1, 2, 3, 4, 5]
        .map(
          (i) =>
            `<div style="position:absolute;left:${30 + (i % 2) * 196}px;top:${170 + Math.floor(i / 2) * 230}px;width:180px;height:214px;border-radius:18px;background:${['#1c8cff', '#22c3e6', '#11336a', '#1c8cff', '#0b1f3a', '#22c3e6'][i]};box-shadow:0 0 30px rgba(34,195,230,.25);opacity:.95">
              <div style="margin:22px 18px 0;height:14px;border-radius:7px;background:rgba(255,255,255,.75);width:${60 + ((i * 17) % 50)}%"></div>
              <div style="margin:12px 18px 0;height:10px;border-radius:5px;background:rgba(255,255,255,.4);width:${40 + ((i * 23) % 40)}%"></div>
            </div>`,
        )
        .join('')}
      <div style="position:absolute;bottom:26px;left:26px;right:26px;height:78px;border-radius:24px;background:rgba(255,255,255,.08);display:flex;justify-content:space-around;align-items:center;font:700 18px Mulish;color:#9fc4e8"><span>PLANO</span><span style="color:#22c3e6">POSTS</span><span>WHATS</span></div>
    </div>
  </div>`

/** O painel de mensagens prontas, como uma tela de computador de lado. */
const painel = (x: number, y: number) => `
  <div style="position:absolute;left:${x}px;top:${y}px;width:760px;height:620px;transform:perspective(1400px) rotateY(-16deg);border-radius:28px;background:rgba(10,20,40,.88);border:1.5px solid rgba(255,255,255,.14);box-shadow:0 50px 100px rgba(0,0,0,.6),0 0 90px rgba(28,140,255,.25);padding:44px">
    <div style="font:900 38px Mulish;color:#fff">Clínica Sorriso</div>
    <div style="display:flex;gap:12px;margin-top:16px">${['#e6eef8', '#1c8cff', '#22c3e6'].map((c) => `<span style="width:30px;height:30px;border-radius:50%;background:${c}"></span>`).join('')}<span style="margin-left:12px;padding:4px 16px;border-radius:10px;border:1.5px solid rgba(255,255,255,.25);font:600 18px Mulish;color:#9fb3cc">odontologia</span></div>
    ${['Post da semana', 'Legenda pronta', 'Resposta no WhatsApp']
      .map(
        (t, i) => `<div style="margin-top:${i ? 26 : 40}px">
          <div style="font:800 22px Mulish;color:#dbe8f7">${t}</div>
          <div style="margin-top:10px;height:12px;border-radius:6px;background:rgba(255,255,255,.22);width:${86 - i * 9}%"></div>
          <div style="margin-top:8px;height:12px;border-radius:6px;background:rgba(255,255,255,.14);width:${64 - i * 6}%"></div>
          <span style="display:inline-block;margin-top:12px;padding:5px 16px;border-radius:9px;background:rgba(34,195,230,.18);font:700 16px Mulish;color:#22c3e6">✓ aprovado</span>
        </div>`,
      )
      .join('')}
  </div>`

/** A conversa de WhatsApp, em balões de vidro. */
const conversa = (x: number, y: number) => {
  const balao = (texto: string, lado: 'eu' | 'cliente', dy: number) =>
    `<div style="position:absolute;top:${dy}px;${lado === 'eu' ? 'right:0' : 'left:0'};max-width:440px;padding:22px 28px;border-radius:${lado === 'eu' ? '30px 30px 8px 30px' : '30px 30px 30px 8px'};background:${lado === 'eu' ? cor.azul : 'rgba(255,255,255,.12)'};border:1.5px solid rgba(255,255,255,.2);font:600 28px/1.35 Mulish;color:#fff;box-shadow:0 20px 50px rgba(0,0,0,.45)">${texto}</div>`
  return `<div style="position:absolute;left:${x}px;top:${y}px;width:600px;height:760px">
    ${balao('Oi! Vocês fazem site para clínica?', 'cliente', 0)}
    ${balao('Fazemos! Posso te mostrar dois exemplos agora?', 'eu', 170)}
    ${balao('Pode sim, quanto fica?', 'cliente', 360)}
    ${balao('Te mando a proposta em 1 minuto 🚀', 'eu', 520)}
  </div>`
}

/** O cartão de resultado, flutuando embaixo da conversa. */
const cartoes = (x: number, y: number) =>
  `<div style="position:absolute;left:${x}px;top:${y}px">${vidro(
    `<div style="font:800 22px Mulish;color:#9fc4e8">NOVOS CONTATOS</div>
     <div style="margin-top:4px;font:900 84px Mulish;color:#fff;line-height:1">+38</div>
     <svg width="260" height="60" viewBox="0 0 260 60"><path d="M0 52 C50 48 70 28 112 32 S190 8 260 4" fill="none" stroke="${cor.ciano}" stroke-width="6" stroke-linecap="round"/></svg>`,
    'width:330px;padding:26px 30px;border-radius:28px;transform:rotate(-5deg);background:rgba(11,31,58,.75)',
  )}</div>`

/** A cena desenhada: o fundo de quando não há ilustração enviada. */
function cenaFirmus(largura: number, assets: TemplateAssets, comSimbolo = true) {
  const n = Math.round(largura / WIDTH)
  // Faixa de luz atravessando a peça inteira: é o fio que costura os slides.
  const pontos = Array.from({ length: n * 2 + 1 }, (_, i) => {
    const x = (i * largura) / (n * 2)
    const y = 980 + Math.sin(i * 1.15) * 220
    return `${x.toFixed(0)},${y.toFixed(0)}`
  })
  const caminho = `M${pontos[0]} ${pontos
    .slice(1)
    .map((p, i) => {
      const [x, y] = p.split(',').map(Number)
      const cx = x! - largura / (n * 4)
      return `S${cx.toFixed(0)},${(y! + (i % 2 ? 120 : -120)).toFixed(0)} ${p}`
    })
    .join(' ')}`

  const objetos = [
    // Slide 1: o símbolo grande, embaixo do título (some quando há personagem).
    comSimbolo
      ? `<div style="position:absolute;left:300px;top:690px;transform:rotate(-6deg)">${simbolo(assets, { altura: 620, estilo: 'filter:drop-shadow(0 40px 60px rgba(0,0,0,.6)) drop-shadow(0 0 90px rgba(34,195,230,.5))' })}</div>`
      : '',
    // Atravessando o 2 e o 3: o celular.
    celular(1700, 210, 12),
    // Atravessando o 3 e o 4: o painel.
    painel(2780, 390),
    // Atravessando o 4 e o 5: a conversa.
    conversa(3990, 280),
    // Slide 5: os cartões, à esquerda do texto.
    cartoes(4340, 980),
  ].slice(0, n + 1)

  return `
    <div style="position:absolute;inset:0;background:${cor.noite}"></div>
    ${Array.from({ length: n * 3 }, (_, i) => {
      const x = (i * largura) / (n * 3) + ((i * 137) % 300)
      const y = 120 + ((i * 271) % 1100)
      const r = 80 + ((i * 53) % 160)
      return `<div style="position:absolute;left:${x}px;top:${y}px;width:${r}px;height:${r}px;border-radius:50%;background:${i % 2 ? cor.azul : cor.ciano};opacity:.13;filter:blur(40px)"></div>`
    }).join('')}
    <svg width="${largura}" height="${H}" style="position:absolute;inset:0" xmlns="http://www.w3.org/2000/svg">
      <path d="${caminho}" fill="none" stroke="${cor.ciano}" stroke-width="10" opacity=".55" style="filter:blur(2px)"/>
      <path d="${caminho}" fill="none" stroke="${cor.ciano}" stroke-width="40" opacity=".12" style="filter:blur(18px)"/>
    </svg>
    ${objetos.join('')}`
}

/* ------------------------------------------------------------- a luz */

/** Feixes de luz descendo do alto, atrás do título e do personagem. */
const raios = (x0: number) => `
  <div style="position:absolute;left:${x0}px;top:-120px;width:${WIDTH}px;height:1100px;overflow:hidden;mix-blend-mode:screen;filter:blur(18px)">
    ${[
      [-28, 120, 0.22],
      [-14, 260, 0.3],
      [-4, 120, 0.2],
      [8, 300, 0.32],
      [20, 140, 0.2],
      [32, 200, 0.16],
    ]
      .map(
        ([giro, largura, alfa]) =>
          `<div style="position:absolute;left:50%;top:0;width:${largura}px;height:1300px;margin-left:-${largura! / 2}px;transform-origin:50% 0;transform:rotate(${giro}deg);background:linear-gradient(180deg,rgba(150,230,255,${alfa}),rgba(34,195,230,${alfa! * 0.5}) 45%,rgba(34,195,230,0) 85%)"></div>`,
      )
      .join('')}
  </div>`

/**
 * O acabamento de cinema de cada slide, por cima de tudo: cantos escuros
 * (vinheta), partículas de luz fora de foco na frente da cena e grão de
 * filme. Fica preso ao slide, não à tira, para todos terem o mesmo tom.
 */
function acabamento(i: number) {
  const particulas = Array.from({ length: 7 }, (_, k) => {
    const n = i * 7 + k
    // Só nas laterais: partícula em cima do texto atrapalha a leitura.
    const x = k % 2 ? 6 + ((n * 53) % 70) : WIDTH - 80 + ((n * 41) % 70)
    const y = 160 + ((n * 389) % 1080)
    const r = 10 + ((n * 37) % 34)
    const desfoque = r > 30 ? 10 : 4
    return `<div style="position:absolute;left:${x}px;top:${y}px;width:${r}px;height:${r}px;border-radius:50%;background:${k % 3 ? 'rgba(170,235,255,.55)' : 'rgba(34,195,230,.7)'};filter:blur(${desfoque}px)"></div>`
  }).join('')

  const ruido =
    "url(&quot;data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>&quot;)"

  return `
    <div style="position:absolute;inset:0;pointer-events:none">${particulas}</div>
    <div style="position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 45%,rgba(0,0,0,0) 52%,rgba(2,6,16,.42) 82%,rgba(2,6,16,.7) 100%)"></div>
    <div style="position:absolute;inset:0;pointer-events:none;opacity:.07;mix-blend-mode:overlay;background-image:${ruido}"></div>`
}

/* ------------------------------------------------------------- os slides */

/** A coluna de texto de um slide, na posição dele dentro da tira. */
function conteudo(s: PanoramaSlide, i: number, total: number, instagram: string) {
  const x0 = i * WIDTH
  const ultimo = i === total - 1
  const corpo = `font-family:'Mulish',sans-serif;font-weight:300;color:rgba(235,244,255,.92)`

  switch (s.kind) {
    case 'capa':
      return `
        <div style="position:absolute;left:${x0}px;top:34px;width:${WIDTH}px;display:flex;justify-content:center">
          ${vidro(`<span style="font:400 26px Mulish;color:rgba(255,255,255,.8)">@${escapar(instagram)} <span style="opacity:.5">|</span> <b style="font-weight:900;color:${cor.ciano}">Firmus Tech</b></span>`, 'padding:14px 34px;border-radius:0 0 24px 24px;border-top:0')}
        </div>
        <div style="position:absolute;left:${x0}px;top:170px;width:${WIDTH}px;text-align:center">
          <div style="display:inline-block;padding:10px 60px;border:1.5px dashed rgba(255,255,255,.55);font:400 40px Mulish;letter-spacing:.24em;color:rgba(255,255,255,.85)">${escapar(s.antes.toUpperCase())}</div>
          <div style="margin-top:16px;display:flex;flex-direction:column;align-items:center">
            ${tituloGrande(s.linha1, 230, 'branco')}
            ${tituloGrande(s.linha2, 230, 'ciano')}
          </div>
        </div>
        ${
          s.personagem
            ? `${raios(x0)}
               <div style="position:absolute;left:${x0 + 140}px;top:640px;width:800px;height:800px;border-radius:50%;background:radial-gradient(circle,rgba(34,195,230,.5),rgba(28,140,255,.14) 45%,rgba(28,140,255,0) 70%)"></div>
               <img src="${escapar(s.personagem)}" alt="" style="position:absolute;left:${x0 + WIDTH / 2 + (s.personagemAjuste ?? 0)}px;bottom:0;transform:translateX(-50%);height:740px;filter:contrast(1.12) saturate(1.12) brightness(1.03) drop-shadow(-3px -2px 0 rgba(120,225,255,.55)) drop-shadow(4px -3px 10px rgba(34,195,230,.55)) drop-shadow(0 30px 50px rgba(0,0,0,.6))">
               <div style="position:absolute;left:${x0}px;bottom:-60px;width:${WIDTH}px;height:340px;background:radial-gradient(ellipse at 50% 70%,rgba(34,195,230,.38),rgba(28,140,255,.1) 45%,rgba(11,31,58,0) 70%);filter:blur(10px)"></div>`
            : ''
        }
        <div style="position:absolute;left:${x0 + 860}px;top:330px">${cursorMover}</div>
        <div style="position:absolute;left:${x0}px;bottom:36px;width:${WIDTH}px;display:flex;justify-content:center;gap:12px;align-items:center;font:400 22px Mulish;letter-spacing:.08em;color:rgba(255,255,255,.62)">
          arraste para o lado
          <svg width="34" height="16" viewBox="0 0 34 16"><path d="M2 8 H30 M23 2 L31 8 L23 14" fill="none" stroke="rgba(255,255,255,.62)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        ${
          s.selo
            ? `<div style="position:absolute;left:${x0}px;bottom:92px;width:${WIDTH}px;display:flex;justify-content:center">
                ${vidro(`<span style="${corpo};font-size:30px;white-space:nowrap">${realce(s.selo)}</span>`, 'padding:18px 44px;border-radius:999px;background:rgba(11,31,58,.7)')}
              </div>`
            : ''
        }`

    case 'texto':
      return `
        <div style="position:absolute;left:${x0 + 96}px;top:300px;width:560px">
          ${s.paragrafos.map((p, j) => `<p style="${corpo};${j ? 'margin-top:34px;' : ''}font-size:46px;line-height:1.28">${realce(p)}</p>`).join('')}
          ${
            s.destaque
              ? vidro(
                  `<p style="${corpo};font-size:34px;line-height:1.3">${realce(s.destaque)}</p>`,
                  'margin-top:44px;padding:28px 34px;border-radius:30px;background:rgba(5,11,24,.72)',
                )
              : ''
          }
          ${
            s.terminal
              ? `<div style="margin-top:44px;display:flex;align-items:flex-end;gap:18px">
                  <span style="width:40px;height:90px;border-left:2px dotted rgba(255,255,255,.6);border-bottom:2px dotted rgba(255,255,255,.6)"></span>
                  <div style="padding:26px 30px;border-radius:24px;background:linear-gradient(135deg,${cor.ciano},${cor.azul});border:2px dashed rgba(255,255,255,.7);box-shadow:0 20px 50px rgba(28,140,255,.4);font:400 31px/1.35 'Space Mono',monospace;color:${cor.noite}">${escapar(s.terminal)}</div>
                </div>`
              : ''
          }
          ${s.manuscrito ? `<p style="margin-top:40px;font-family:'Caveat',cursive;font-weight:700;font-size:64px;line-height:1.05;color:#fff;text-shadow:0 4px 20px rgba(0,0,0,.6)">${escapar(s.manuscrito)}</p>` : ''}
        </div>
        ${ultimo ? '' : avisoDireita(x0)}`

    case 'chamada':
      return `
        <div style="position:absolute;left:${x0 + 470}px;top:200px;width:560px">
          ${vidro(
            `<p style="${corpo};font-size:38px;line-height:1.28">${realce(s.antes)}</p>
             <div style="margin-top:28px">${tituloGrande(s.linha1, 124, 'branco')}${tituloGrande(s.linha2, 124, 'ciano')}</div>`,
            'padding:40px 40px 46px;border-radius:36px;background:rgba(5,11,24,.6)',
          )}
          <svg width="120" height="110" viewBox="0 0 120 110" style="margin:22px 0 0 160px"><path d="M30 6 C 90 10, 104 54, 70 96" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/><path d="M48 80 L70 98 L88 74" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <p style="margin-top:8px;font-family:'Permanent Marker',cursive;font-size:52px;line-height:1.1;color:#fff;transform:rotate(-4deg);text-transform:uppercase">${escapar(s.manuscrito)}</p>
          <svg width="460" height="40" viewBox="0 0 460 40" style="margin-top:6px"><path d="M6 30 C 140 8, 320 6, 452 18" fill="none" stroke="${cor.ciano}" stroke-width="8" stroke-linecap="round"/></svg>
        </div>`
  }
}

/** "Arraste" discreto no canto, nos slides de dentro. */
const avisoDireita = (x0: number) => `
  <div style="position:absolute;left:${x0 + 96}px;bottom:66px;display:flex;align-items:center;gap:14px;font:400 24px Mulish;letter-spacing:.08em;color:rgba(255,255,255,.7)">
    arraste para o lado
    <svg width="40" height="18" viewBox="0 0 40 18"><path d="M2 9 H36 M28 2 L37 9 L28 16" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </div>`

/**
 * Os slides do panorama: cada um é a tira inteira, deslocada para mostrar só
 * a parte dele. Quem renderiza não precisa saber que é uma tira.
 */
export function renderPanorama(post: PanoramaPost, assets: TemplateAssets): string[] {
  const total = post.slides.length
  const largura = total * WIDTH
  const instagram = post.instagram ?? 'somosfirmus'

  const fundo = post.fundo
    ? `<img src="${escapar(post.fundo)}" alt="" style="position:absolute;inset:0;width:${largura}px;height:${H}px;object-fit:cover">
       <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(5,11,24,.55),rgba(5,11,24,.15))"></div>`
    : cenaFirmus(largura, assets, !post.slides.some((s) => s.kind === 'capa' && s.personagem))

  // A cena atravessa os slides, então vai inteira em cada um. O texto não
  // atravessa: cada slide leva só o dele.
  return post.slides.map((s, i) =>
    pagina(
      `<div style="position:absolute;top:0;left:${-i * WIDTH}px;width:${largura}px;height:${H}px">${fundo}${conteudo(s, i, total, instagram)}</div>${acabamento(i)}`,
      cor.noite,
      FONTES,
    ),
  )
}
