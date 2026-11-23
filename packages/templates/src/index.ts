import type { ContentType } from '@firmus/shared'
import type { TemplateAssets } from './base'
import { LAVE_KEYS, laveModelos, previaLave, type LaveKey } from './lave-modelos'
import { renderBrutalist, type BrutalistSlide } from './styles/brutalist'
import { renderEditorial, type EditorialSlide } from './styles/editorial'
import { renderKit, type KitSlide } from './styles/kit'
import { renderLave, type LaveSlide } from './styles/lave'
import { renderLaveFoto, type LaveFotoSlide } from './styles/lave-foto'
import { renderPaper, type PaperSlide } from './styles/paper'
import { renderPanorama, type PanoramaPost, type PanoramaSlide } from './styles/panorama'

export { HEIGHT, STORY_HEIGHT, WIDTH, type TemplateAssets } from './base'
export {
  renderBrutalist,
  renderEditorial,
  renderKit,
  renderLave,
  renderLaveFoto,
  renderPanorama,
  renderPaper,
}
export type {
  BrutalistSlide,
  EditorialSlide,
  KitSlide,
  LaveFotoSlide,
  LaveSlide,
  PanoramaPost,
  PanoramaSlide,
  PaperSlide,
}

/**
 * Os modelos que existem. A chave é o que fica gravado no banco
 * (`company_templates`), então trocar uma é migration, não renomeação.
 */
export const TEMPLATE_KEYS = [
  'kit-carrossel',
  'editorial',
  'papel-etiqueta',
  'brutalista',
  'lave-seque',
  'panorama',
  ...LAVE_KEYS,
] as const

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
  /**
   * A prévia com texto de exemplo. `format` diz o tamanho: no story, os
   * modelos que o aceitam desenham em 1080x1920.
   */
  preview: (assets: TemplateAssets, format?: ContentType) => TemplatePreviewSlide[]
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

/** Os 12 modelos da Lave Seque, um por arte, cada um em carrossel, post e story. */
const modelosLave = Object.fromEntries(
  LAVE_KEYS.map((key): [LaveKey, Template] => [
    key,
    {
      key,
      name: laveModelos[key].name,
      description: laveModelos[key].description,
      formats: ['carrossel', 'post', 'story'],
      preview: (assets, format) => previaLave(key, assets, format),
    },
  ]),
) as Record<LaveKey, Template>

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

  'lave-seque': {
    key: 'lave-seque',
    name: 'Lave Seque',
    description:
      'Fundo branco com estampa de lavanderia, manchas marinho nos cantos e título em marinho e verde.',
    formats: ['carrossel', 'post'],
    preview: previa<LaveSlide>(
      [
        {
          label: 'Capa',
          slide: {
            kind: 'capa',
            emoji: '🤝',
            etiqueta: '15/09 | dia do cliente',
            linha1: 'Obrigado',
            linha2: 'cliente!',
            subtitulo: 'Sua preferência é o que nos motiva a continuar.',
            apoio: 'Você é essencial para o nosso sucesso.',
          },
        },
        {
          label: 'Texto',
          slide: {
            kind: 'texto',
            etiqueta: 'dica da semana',
            titulo: 'Roupa *branquinha* por mais tempo',
            paragrafos: [
              'Separe as peças brancas das coloridas antes de lavar.',
              'E deixe o resto *com a gente*: a gente cuida de cada peça.',
            ],
          },
        },
        {
          label: 'Lista',
          slide: {
            kind: 'lista',
            etiqueta: 'nossos serviços',
            titulo: 'Aqui sua roupa *é bem cuidada*',
            itens: ['Lavagem', 'Secagem', 'Passadoria', 'Edredons e cobertores'],
          },
        },
        {
          label: 'Chamada final',
          slide: {
            kind: 'chamada',
            linha1: 'Traga sua',
            linha2: 'roupa!',
            texto: 'Chama a gente no *WhatsApp* e combine a coleta.',
            botao: 'Link na bio',
          },
        },
      ],
      renderLave,
    ),
  },

  panorama: {
    key: 'panorama',
    name: 'Panorama',
    description:
      'O carrossel como uma tira contínua: os objetos atravessam de um slide para o outro.',
    formats: ['carrossel'],
    preview: (assets) => {
      const rotulos = ['Capa', 'Texto', 'Texto', 'Texto', 'Chamada final']
      return renderPanorama(
        {
          slides: [
            {
              kind: 'capa',
              antes: 'Como ter',
              linha1: 'Instagram',
              linha2: 'no automático',
              selo: 'em menos de **10 minutos por semana**',
            },
            {
              kind: 'texto',
              paragrafos: ['Essa semana um cliente abriu a plataforma e pediu **o plano do mês**.'],
              destaque: 'Em segundos: **12 posts** com a cara da marca dele.',
              manuscrito: 'e ele só aprovou.',
            },
            {
              kind: 'texto',
              paragrafos: [
                'Cada post já veio com **legenda pronta** e a *arte no modelo dele*.',
                'Nada sai **sem o ok** de quem manda.',
              ],
            },
            {
              kind: 'texto',
              paragrafos: ['E quando o cliente chamou no WhatsApp, **a resposta já estava lá**.'],
              terminal: 'Com o Firmus Flow, você para de perder contato!',
            },
            {
              kind: 'chamada',
              antes: 'Quer ver isso funcionando **no seu Instagram**?',
              linha1: 'Chama',
              linha2: 'no Whats',
              manuscrito: 'O link está na bio!',
            },
          ],
        },
        assets,
      ).map((html, i) => ({ label: rotulos[i]!, html }))
    },
  },
  ...modelosLave,
}
