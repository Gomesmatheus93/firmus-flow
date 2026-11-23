/**
 * Os 12 modelos da Lave Seque feitos a partir das artes que ela enviou. Cada
 * arte virou um modelo independente: o carrossel inteiro sai naquele layout,
 * e o mesmo modelo serve ao feed (carrossel e post) e ao story (9:16).
 *
 * Os textos de exemplo são da própria lavanderia, só para mostrar o modelo.
 */
import type { ContentType } from '@firmus/shared'
import { HEIGHT, STORY_HEIGHT, type TemplateAssets } from './base'
import { renderLaveFoto, type LaveFotoSlide } from './styles/lave-foto'

export const LAVE_KEYS = [
  'lave-pilulas',
  'lave-bloco',
  'lave-cartao',
  'lave-duas-fotos',
  'lave-foto-caixa',
  'lave-titulo-gigante',
  'lave-pergunta',
  'lave-caixa-central',
  'lave-promo',
  'lave-oferta',
  'lave-onda',
  'lave-faixas',
] as const

export type LaveKey = (typeof LAVE_KEYS)[number]

type Modelo = {
  name: string
  description: string
  /** Capa, um slide do meio e a chamada final, no mesmo layout. */
  exemplo: [LaveFotoSlide, LaveFotoSlide, LaveFotoSlide]
}

export const laveModelos: Record<LaveKey, Modelo> = {
  'lave-pilulas': {
    name: 'Pílulas marinho',
    description: 'Pergunta curta e a resposta em pílulas azul-marinho, com a foto embaixo.',
    exemplo: [
      { kind: 'pilulas', abertura: 'Que tal lavar e secar', pilulas: ['tudo de', 'uma só vez?'] },
      { kind: 'pilulas', abertura: 'Na Lave Seque você', pilulas: ['lava, seca', 'e sai leve'] },
      { kind: 'pilulas', abertura: 'Vem pra Lave Seque', pilulas: ['link', 'na bio'] },
    ],
  },
  'lave-bloco': {
    name: 'Bloco verde',
    description: 'Título num bloco verde arredondado, com selo e a foto por cima.',
    exemplo: [
      {
        kind: 'bloco',
        titulo: 'Deixa que a gente cuida das suas roupas!',
        selo: 'Roupas limpas em até 1 hora',
      },
      { kind: 'bloco', titulo: 'Máquinas grandes para edredom e cobertor', selo: 'Até 3 cestos' },
      { kind: 'bloco', titulo: 'Passa aqui e veja de perto!', selo: 'Chama no WhatsApp' },
    ],
  },
  'lave-cartao': {
    name: 'Cartão na foto',
    description: 'Foto em cima e um cartão azul-marinho com o título e uma faixa verde.',
    exemplo: [
      { kind: 'cartao', titulo: 'Mais tempo pra você!', apoio: 'Roupas impecáveis para o seu dia' },
      { kind: 'cartao', titulo: 'Lavou, secou, levou.', apoio: 'Tudo em uma só visita' },
      { kind: 'cartao', titulo: 'Te esperamos aqui!', apoio: 'Chama a gente no WhatsApp' },
    ],
  },
  'lave-duas-fotos': {
    name: 'Duas fotos',
    description: 'Cartão marinho com título e foto, frase verde ao lado e outra foto emoldurada.',
    exemplo: [
      {
        kind: 'duasFotos',
        titulo: 'Nada como roupa limpa',
        texto: 'e com aquele cheirinho de frescor!',
      },
      { kind: 'duasFotos', titulo: 'Sabão e amaciante inclusos', texto: 'é só trazer a roupa!' },
      { kind: 'duasFotos', titulo: 'Vem conhecer a gente', texto: 'o link está na bio!' },
    ],
  },
  'lave-foto-caixa': {
    name: 'Foto e caixa verde',
    description: 'Foto grande, caixa verde de texto ao lado, relógio verde e faixa marinho.',
    exemplo: [
      {
        kind: 'fotoCaixa',
        texto: 'Conte com a agilidade e a qualidade da Lave Seque',
        rodape: 'Fale com a gente e encontre a unidade mais perto de você',
      },
      {
        kind: 'fotoCaixa',
        texto: 'Lavagem e secagem em menos de 1 hora',
        rodape: 'Enquanto isso, você resolve a sua vida',
      },
      {
        kind: 'fotoCaixa',
        texto: 'Vem pra Lave Seque!',
        rodape: 'Chama a gente no WhatsApp: o link está na bio',
      },
    ],
  },
  'lave-titulo-gigante': {
    name: 'Título gigante',
    description: 'Título enorme em verde e marinho, frase curta e a foto num bloco azul-claro.',
    exemplo: [
      {
        kind: 'tituloGigante',
        linha1: 'Tudo',
        linha2: 'limpinho!',
        apoio: 'por um preço que cabe no seu bolso!',
      },
      { kind: 'tituloGigante', linha1: 'Tudo', linha2: 'sequinho!', apoio: 'em poucos minutos' },
      { kind: 'tituloGigante', linha1: 'Vem', linha2: 'lavar!', apoio: 'o link está na bio' },
    ],
  },
  'lave-pergunta': {
    name: 'Pergunta e resposta',
    description: 'Pergunta em marinho, resposta numa barra verde e a foto na metade de baixo.',
    exemplo: [
      {
        kind: 'pergunta',
        pergunta: 'Nunca usou uma lavanderia self-service?',
        resposta: 'É simples! Vem para a Lave Seque',
      },
      {
        kind: 'pergunta',
        pergunta: 'Quanto tempo leva?',
        resposta: 'Lavar e secar em menos de 1 hora',
      },
      { kind: 'pergunta', pergunta: 'Ficou com dúvida?', resposta: 'Chama a gente no WhatsApp' },
    ],
  },
  'lave-caixa-central': {
    name: 'Caixa central',
    description: 'Foto de fundo, caixa verde no centro com a frase em três tamanhos e relógios.',
    exemplo: [
      {
        kind: 'caixaCentral',
        antes: 'Você gasta',
        destaque: 'muito tempo',
        depois: 'lavando e secando roupas em casa',
        fecho: 'Chega de perder tempo nessa tarefa!',
      },
      {
        kind: 'caixaCentral',
        antes: 'Aqui leva',
        destaque: 'menos de 1h',
        depois: 'para lavar e secar tudo',
      },
      {
        kind: 'caixaCentral',
        antes: 'Ganhe',
        destaque: 'tempo livre',
        depois: 'e deixe o trabalho pesado com a gente',
        fecho: 'O link está na bio!',
      },
    ],
  },
  'lave-promo': {
    name: 'Promoção em números',
    description: 'A oferta em números grandes num painel verde e a condição no rodapé.',
    exemplo: [
      {
        kind: 'promo',
        antes: 'Promo do',
        titulo: 'Mensalista',
        ofertas: [
          { de: '10', deRotulo: 'ciclos', por: '01', porRotulo: 'ciclo grátis' },
          { de: '20', deRotulo: 'ciclos', por: '02', porRotulo: 'ciclos grátis' },
        ],
        condicao: 'Promoção válida para ciclos no mesmo mês, com registro no CPF.',
      },
      {
        kind: 'promo',
        antes: 'Combo',
        titulo: 'Lava e seca',
        ofertas: [{ de: '2', deRotulo: 'ciclos', por: '1', porRotulo: 'preço especial' }],
        condicao: 'Lavagem e secagem no mesmo dia.',
      },
      {
        kind: 'promo',
        antes: 'Aproveite a',
        titulo: 'Promoção',
        ofertas: [{ de: '2º', deRotulo: 'ciclo', por: '50%', porRotulo: 'de desconto' }],
        condicao: 'Chama a gente no WhatsApp e confira as regras.',
      },
    ],
  },
  'lave-oferta': {
    name: 'Oferta com produto',
    description: 'Título verde grande, o produto no centro e a regra numa pílula verde.',
    exemplo: [
      {
        kind: 'oferta',
        linhas: ['Seu ciclo', 'rende mais'],
        regra: 'A cada 10 ciclos no mês, ganhe 1 voucher',
        nota: 'regras na legenda',
      },
      {
        kind: 'oferta',
        linhas: ['Cliente fiel', 'ganha mais'],
        regra: 'Junte ciclos e troque por lavagens',
      },
      { kind: 'oferta', linhas: ['Vem', 'aproveitar'], regra: 'Chama a gente no WhatsApp' },
    ],
  },
  'lave-onda': {
    name: 'Foto com onda',
    description: 'Foto de ponta a ponta, logo grande, frase com contorno verde e onda azul.',
    exemplo: [
      { kind: 'onda', linha1: 'Roupa limpa sem esforço!', linha2: 'Aproveita agora!' },
      { kind: 'onda', linha1: 'Máquinas novas e cheirosas', linha2: 'Vem ver!' },
      { kind: 'onda', linha1: 'Te esperamos aqui!', linha2: 'Link na bio' },
    ],
  },
  'lave-faixas': {
    name: 'Faixas na foto',
    description: 'Foto de ponta a ponta com o título em faixas azul e verde.',
    exemplo: [
      { kind: 'faixas', faixas: ['Seu momento', 'Seu espaço'] },
      {
        kind: 'faixas',
        faixas: ['Ambiente', 'climatizado'],
        texto: 'Lave sua roupa com conforto e Wi-Fi.',
      },
      {
        kind: 'faixas',
        faixas: ['Venha', 'conhecer'],
        texto: 'A nossa lavanderia self-service está esperando por você.',
        botao: 'Chama no WhatsApp',
      },
    ],
  },
}

const ROTULOS = ['Capa', 'Slide do meio', 'Chamada final']

/**
 * A prévia de um modelo da Lave Seque: os três slides de exemplo, no tamanho
 * do formato (story em 1920 de altura). A chamada final nunca manda arrastar.
 */
export function previaLave(key: LaveKey, assets: TemplateAssets, format?: ContentType) {
  const altura = format === 'story' || format === 'reel' ? STORY_HEIGHT : HEIGHT
  return laveModelos[key].exemplo.map((slide, i) => ({
    label: ROTULOS[i]!,
    html: renderLaveFoto(i === 2 ? { ...slide, arraste: false } : slide, assets, altura),
  }))
}
