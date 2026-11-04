import type { ContentType } from '@firmus/shared'

/**
 * O que muda de um formato para outro na tela de criação.
 *
 * A tela é uma só para os quatro formatos; tudo que é diferente mora aqui. Um
 * formato novo é uma entrada nova nesta tabela, e não uma tela nova.
 */
export type FormatConfig = {
  /** Como a peça é chamada no botão: "Criar carrossel", "Criar roteiro". */
  noun: string
  /** O que cada parte da peça é: slide, quadro, cena. */
  unit: { one: string; many: string }
  /** Proporção da prévia: o retrato do feed é 4:5, o vertical é 9:16. */
  aspect: string
  /** O campo de tamanho do pedido, quando o formato tem um. */
  size: { label: string; options: { value: string; label: string }[]; initial: string } | null
  /** Exemplo do campo de tema, para quem não sabe por onde começar. */
  themePlaceholder: string
  description: string
}

const contagem = (de: number, ate: number, unidade: string) =>
  Array.from({ length: ate - de + 1 }, (_, i) => ({
    value: String(de + i),
    label: `${de + i} ${unidade}`,
  }))

export const formatConfig: Record<ContentType, FormatConfig> = {
  carrossel: {
    noun: 'carrossel',
    unit: { one: 'slide', many: 'slides' },
    aspect: 'aspect-[4/5]',
    size: { label: 'Slides', options: contagem(3, 10, 'slides'), initial: '7' },
    themePlaceholder: 'Ex.: os três erros mais comuns de quem contrata um site pela primeira vez',
    description:
      'Slides para o feed, com a capa que faz arrastar e o texto de cada slide. A legenda vem junto.',
  },
  post: {
    noun: 'post',
    unit: { one: 'arte', many: 'artes' },
    aspect: 'aspect-[4/5]',
    size: null,
    themePlaceholder: 'Ex.: o que muda no atendimento quando o cliente é respondido em minutos',
    description: 'Uma arte para o feed e a legenda dela.',
  },
  story: {
    noun: 'story',
    unit: { one: 'quadro', many: 'quadros' },
    aspect: 'aspect-[9/16]',
    size: { label: 'Quadros', options: contagem(3, 7, 'quadros'), initial: '5' },
    themePlaceholder: 'Ex.: bastidores de um projeto da semana, terminando com uma enquete',
    description: 'A sequência do dia em 9:16, quadro a quadro, com o que vai em cada um.',
  },
  reel: {
    noun: 'roteiro',
    unit: { one: 'cena', many: 'cenas' },
    aspect: 'aspect-[9/16]',
    size: {
      label: 'Duração',
      options: [
        { value: '15', label: '15 segundos' },
        { value: '30', label: '30 segundos' },
        { value: '60', label: '60 segundos' },
      ],
      initial: '30',
    },
    themePlaceholder: 'Ex.: um erro que o cliente comete antes de chamar a gente',
    description: 'O roteiro do reel: o gancho dos primeiros segundos, as cenas e o texto na tela.',
  },
}
