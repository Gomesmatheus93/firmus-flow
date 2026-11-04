import type { ContentType } from '@firmus/shared'
import type { TemplateAssets } from './base'
import { renderBrutalist, type BrutalistSlide } from './styles/brutalist'
import { renderEditorial, type EditorialSlide } from './styles/editorial'
import { renderKit, type KitSlide } from './styles/kit'
import { renderPaper, type PaperSlide } from './styles/paper'

export { HEIGHT, WIDTH, type TemplateAssets } from './base'
export { renderBrutalist, renderEditorial, renderKit, renderPaper }
export type { BrutalistSlide, EditorialSlide, KitSlide, PaperSlide }

/**
 * Os modelos que existem. A chave é o que fica gravado no banco
 * (`company_templates`), então trocar uma é migration, não renomeação.
 */
export const TEMPLATE_KEYS = ['kit-carrossel', 'editorial', 'papel-etiqueta', 'brutalista'] as const

export type TemplateKey = (typeof TEMPLATE_KEYS)[number]

export const isTemplateKey = (valor: string): valor is TemplateKey =>
  (TEMPLATE_KEYS as readonly string[]).includes(valor)

/** Um slide da prévia: o nome do tipo e o HTML pronto. */
export type TemplatePreviewSlide = { label: string; html: string }

export type Template = {
  key: TemplateKey
  name: string
  description: string
  /** Em que formatos o modelo se encaixa. */
  formats: ContentType[]
  /** A prévia com texto de exemplo, um item por tipo de slide do modelo. */
  preview: (assets: TemplateAssets) => TemplatePreviewSlide[]
}

/**
 * Monta a prévia de um modelo a partir dos slides de exemplo.
 *
 * Os textos de exemplo são da Firmus, escritos para mostrar o modelo em uso;
 * nenhuma frase vem das referências que inspiraram os modelos.
 */
function previa<S extends { kind: string }>(
  exemplo: { label: string; slide: S }[],
  render: (slide: S, assets: TemplateAssets) => string,
) {
  return (assets: TemplateAssets) =>
    exemplo.map(({ label, slide }) => ({ label, html: render(slide, assets) }))
}

export const templates: Record<TemplateKey, Template> = {
  'kit-carrossel': {
    key: 'kit-carrossel',
    name: 'Kit de carrossel',
    description:
      'Capa com título empilhado, slides de texto com destaque sublinhado, diagrama e chamada final.',
    formats: ['carrossel', 'post'],
    preview: previa<KitSlide>(
      [
        {
          label: 'Capa',
          slide: {
            kind: 'capa',
            antes: 'Seu site é',
            linha1: 'vitrine',
            linha2: 'ou vendedor?',
            tamanho1: 250,
            tamanho2: 168,
          },
        },
        {
          label: 'Texto',
          slide: {
            kind: 'texto',
            borda: 'vende',
            paragrafos: [
              'Um site que vende vai **além da aparência**.',
              'O visual é só a parte que o cliente vê primeiro. Por baixo dele estão **as peças que fazem alguém comprar**.',
            ],
          },
        },
        {
          label: 'Diagrama',
          slide: {
            kind: 'diagrama',
            paragrafos: [
              'O que o cliente vê é **a ponta**.',
              'O resultado vem do que está **embaixo dela**.',
            ],
            topo: 'Visual',
            base: [
              'Rápido no celular',
              'Aparece no Google',
              'Texto que convence',
              'Botão de WhatsApp',
              'Seguro',
              'Mede as visitas',
            ],
          },
        },
        {
          label: 'Texto em cor',
          slide: {
            kind: 'textoCor',
            borda: 'cliente',
            paragrafos: [
              'Quando essas peças **trabalham juntas**, o site deixa de ser cartão de visita.',
              'E passa a **trazer cliente** enquanto você cuida do negócio.',
            ],
          },
        },
        {
          label: 'Chamada final',
          slide: {
            kind: 'chamada',
            texto:
              'Quer um site que **trabalha por você**? Chama a gente no WhatsApp: **o link está na bio**.',
          },
        },
      ],
      renderKit,
    ),
  },

  editorial: {
    key: 'editorial',
    name: 'Editorial gigante',
    description:
      'Uma palavra enorme atrás da figura, com marcas técnicas, régua e fonte de código nos slides.',
    formats: ['carrossel', 'post'],
    preview: previa<EditorialSlide>(
      [
        {
          label: 'Capa',
          slide: {
            kind: 'capa',
            sobre: 'Seu negócio',
            titulo: 'digital',
            esquerda: ['2026', 'Mossoró · RN'],
            direita: ['Sites, sistemas', 'e IA'],
          },
        },
        {
          label: 'Texto',
          slide: {
            kind: 'texto',
            numero: '02',
            rotulo: 'O ponto de partida',
            titulo: 'Presença',
            paragrafos: [
              'Ter um perfil não é estar no digital.',
              '**Estar no digital** é ser encontrado, ser entendido e ser chamado. Nessa ordem.',
            ],
          },
        },
        {
          label: 'Lista',
          slide: {
            kind: 'lista',
            numero: '03',
            rotulo: 'Ficha técnica',
            titulo: 'O básico bem feito',
            itens: [
              { titulo: 'Site rápido no celular', texto: 'É lá que o cliente abre o seu link.' },
              { titulo: 'Bio que diz o que você faz', texto: 'Em uma linha, para quem é.' },
              { titulo: 'WhatsApp que responde', texto: 'Quem chama quer resposta hoje.' },
              { titulo: 'Medir o que funciona', texto: 'Para repetir o que deu certo.' },
            ],
          },
        },
        {
          label: 'Chamada final',
          slide: {
            kind: 'chamada',
            sobre: 'Vamos',
            titulo: 'conversar',
            texto: 'A gente monta o digital do seu negócio, **do site ao WhatsApp**.',
            botao: 'Link na bio',
          },
        },
      ],
      renderEditorial,
    ),
  },

  'papel-etiqueta': {
    key: 'papel-etiqueta',
    name: 'Papel e etiqueta',
    description: 'Fundo com textura de papel e a palavra-chave numa etiqueta de borda rasgada.',
    formats: ['carrossel', 'post'],
    preview: previa<PaperSlide>(
      [
        {
          label: 'Capa',
          slide: {
            kind: 'capa',
            tags: ['sites', 'sistemas'],
            linhas: ['5 sinais de que', 'o seu site está'],
            etiqueta: 'perdendo cliente',
            subtitulo: 'E o que fazer com cada um deles.',
          },
        },
        {
          label: 'Texto',
          slide: {
            kind: 'texto',
            tags: ['sites', 'sistemas'],
            rotulo: 'Sinal 1',
            titulo: 'Demora para abrir no celular',
            paragrafos: [
              'Quem espera não fica: volta para a busca e **clica no concorrente**.',
              'O que fazer: imagens leves, menos coisa carregando e uma hospedagem que aguenta.',
            ],
          },
        },
        {
          label: 'Lista',
          slide: {
            kind: 'lista',
            tags: ['sites', 'sistemas'],
            titulo: 'Os outros quatro sinais',
            itens: [
              'Não aparece no Google',
              'Não diz como contratar',
              'WhatsApp escondido no rodapé',
              'Cara de site abandonado',
            ],
          },
        },
        {
          label: 'Chamada final',
          slide: {
            kind: 'chamada',
            tags: ['sites', 'sistemas'],
            titulo: 'Achou algum no seu?',
            etiqueta: 'Chama a gente',
            texto: 'A gente olha o seu site e diz **o que resolver primeiro**. O link está na bio.',
          },
        },
      ],
      renderPaper,
    ),
  },

  brutalista: {
    key: 'brutalista',
    name: 'Brutalista tech',
    description: 'Grade aparente, tipografia que vaza pela borda e detalhes de interface em ciano.',
    formats: ['carrossel', 'post'],
    preview: previa<BrutalistSlide>(
      [
        {
          label: 'Capa',
          slide: {
            kind: 'capa',
            gigante: 'flow',
            notas: ['Firmus Flow', 'Em construção', 'Mossoró · RN · 2026'],
            titulo: ['IA que trabalha', 'pela sua marca'],
            rodape:
              'Plataforma de IA para Instagram e WhatsApp. Aprende a sua marca e trabalha por ela.',
            numero: '01',
          },
        },
        {
          label: 'Texto',
          slide: {
            kind: 'texto',
            numero: '02',
            notas: ['Módulo', 'Cérebro da Marca'],
            titulo: ['Primeiro,', 'aprende a sua marca'],
            paragrafos: [
              'Serviços, público, diferenciais e o jeito que você fala com o cliente, **num lugar só**.',
              'Tudo que a plataforma escreve sai daqui.',
            ],
            rodape: 'Firmus Flow · plataforma de IA para Instagram e WhatsApp.',
          },
        },
        {
          label: 'Lista',
          slide: {
            kind: 'lista',
            numero: '03',
            titulo: 'O que o Flow faz',
            itens: [
              { titulo: 'Cérebro da Marca', texto: 'Guarda tudo que a sua marca é.' },
              { titulo: 'Auditoria', texto: 'Diz o que corrigir no Instagram primeiro.' },
              { titulo: 'Conteúdo', texto: 'Posts com a sua cara. Você aprova.' },
              { titulo: 'WhatsApp', texto: 'Responde e chama a equipe quando precisa.' },
            ],
            rodape: 'Firmus Flow · plataforma de IA para Instagram e WhatsApp.',
          },
        },
        {
          label: 'Chamada final',
          slide: {
            kind: 'chamada',
            gigante: 'teste',
            titulo: ['Quer testar', 'antes de todo mundo?'],
            texto: 'Manda **FLOW** no nosso WhatsApp. O link está na bio.',
            rodape: 'Firmus Flow · em construção · Mossoró RN.',
            numero: '04',
          },
        },
      ],
      renderBrutalist,
    ),
  },
}
