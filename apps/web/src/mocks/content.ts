export type ContentStatus = 'rascunho' | 'aguardando' | 'aprovado' | 'ajustar'

export const statusLabel: Record<ContentStatus, string> = {
  rascunho: 'Rascunho',
  aguardando: 'Aguardando aprovação',
  aprovado: 'Aprovado',
  ajustar: 'Pedido de ajuste',
}

export const plannedPosts = [
  {
    id: 'p1',
    day: 3,
    format: 'Carrossel',
    theme: 'Rotina de skincare para pele oleosa',
    goal: 'Educar',
  },
  { id: 'p2', day: 5, format: 'Reels', theme: 'Bastidores da limpeza de pele', goal: 'Aproximar' },
  {
    id: 'p3',
    day: 8,
    format: 'Post único',
    theme: 'Depoimento da cliente Larissa',
    goal: 'Prova social',
  },
  {
    id: 'p4',
    day: 11,
    format: 'Carrossel',
    theme: 'Mitos sobre ácido hialurônico',
    goal: 'Educar',
  },
  { id: 'p5', day: 14, format: 'Reels', theme: 'Antes e depois do protocolo', goal: 'Converter' },
  { id: 'p6', day: 18, format: 'Post único', theme: 'Promoção de novembro', goal: 'Converter' },
  {
    id: 'p7',
    day: 22,
    format: 'Carrossel',
    theme: 'Como escolher o protetor solar',
    goal: 'Educar',
  },
  { id: 'p8', day: 26, format: 'Reels', theme: 'Perguntas que mais recebemos', goal: 'Aproximar' },
]

export const captions = [
  {
    id: 'c1',
    format: 'Carrossel',
    title: '5 erros no cuidado da pele oleosa',
    status: 'aguardando' as ContentStatus,
    preview:
      'Pele oleosa não precisa de menos hidratação. Precisa da hidratação certa. Separei os cinco erros que mais vejo aqui no studio...',
  },
  {
    id: 'c2',
    format: 'Reels',
    title: 'Bastidores do protocolo de limpeza',
    status: 'aprovado' as ContentStatus,
    preview:
      'Um protocolo de limpeza de pele bem feito leva 50 minutos. Te mostro cada etapa, sem corte...',
  },
  {
    id: 'c3',
    format: 'Post único',
    title: 'Depoimento da Larissa',
    status: 'ajustar' as ContentStatus,
    preview:
      'A Larissa chegou aqui com a pele sensibilizada depois de três meses usando ácido sem orientação...',
  },
  {
    id: 'c4',
    format: 'Carrossel',
    title: 'Mitos sobre ácido hialurônico',
    status: 'rascunho' as ContentStatus,
    preview: 'Ácido hialurônico não "fura" a pele e não serve só para quem passou dos 40...',
  },
]

export const designs = [
  {
    id: 'd1',
    title: '5 erros no cuidado da pele oleosa',
    slides: 6,
    template: 'Editorial',
    status: 'aguardando' as ContentStatus,
  },
  {
    id: 'd2',
    title: 'Mitos sobre ácido hialurônico',
    slides: 5,
    template: 'Bold',
    status: 'rascunho' as ContentStatus,
  },
  {
    id: 'd3',
    title: 'Promoção de novembro',
    slides: 1,
    template: 'Destaque',
    status: 'aprovado' as ContentStatus,
  },
  {
    id: 'd4',
    title: 'Como escolher o protetor solar',
    slides: 7,
    template: 'Editorial',
    status: 'rascunho' as ContentStatus,
  },
]

export const approvals = [
  {
    id: 'ap1',
    title: '5 erros no cuidado da pele oleosa',
    type: 'Carrossel · 6 slides',
    author: 'Ana Beatriz',
    sentAt: 'há 3 horas',
  },
  {
    id: 'ap2',
    title: 'Bastidores do protocolo de limpeza',
    type: 'Reels · roteiro',
    author: 'Ana Beatriz',
    sentAt: 'ontem',
  },
  {
    id: 'ap3',
    title: 'Promoção de novembro',
    type: 'Post único',
    author: 'Matheus Gomes',
    sentAt: 'há 2 dias',
  },
]
