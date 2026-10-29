export type ConversationStatus = 'ia' | 'humano' | 'resolvida'

export const conversationStatusLabel: Record<ConversationStatus, string> = {
  ia: 'IA atendendo',
  humano: 'Com a equipe',
  resolvida: 'Resolvida',
}

export const conversations = [
  {
    id: 'cv1',
    contact: 'Juliana Rocha',
    initials: 'JR',
    phone: '+55 84 99612-4410',
    status: 'humano' as ConversationStatus,
    lastMessage: 'Vocês parcelam o protocolo completo? Eu queria começar ainda esse mês.',
    when: 'há 12 min',
    unread: 2,
  },
  {
    id: 'cv2',
    contact: 'Carlos Menezes',
    initials: 'CM',
    phone: '+55 84 98870-2231',
    status: 'ia' as ConversationStatus,
    lastMessage: 'Qual o horário de vocês no sábado?',
    when: 'há 40 min',
    unread: 0,
  },
  {
    id: 'cv3',
    contact: 'Larissa Pontes',
    initials: 'LP',
    phone: '+55 84 99104-8876',
    status: 'resolvida' as ConversationStatus,
    lastMessage: 'Perfeito, agendado! Obrigada 💙',
    when: 'há 3 horas',
    unread: 0,
  },
  {
    id: 'cv4',
    contact: 'Marina Lopes',
    initials: 'ML',
    phone: '+55 84 99655-1092',
    status: 'ia' as ConversationStatus,
    lastMessage: 'Vi o carrossel sobre pele oleosa, queria marcar uma avaliação.',
    when: 'ontem',
    unread: 0,
  },
]

export const leads = [
  {
    id: 'l1',
    name: 'Juliana Rocha',
    interest: 'Protocolo completo',
    source: 'WhatsApp',
    createdAt: '28/10',
    stage: 'Quente',
  },
  {
    id: 'l2',
    name: 'Marina Lopes',
    interest: 'Avaliação de pele',
    source: 'Instagram',
    createdAt: '27/10',
    stage: 'Novo',
  },
  {
    id: 'l3',
    name: 'Carlos Menezes',
    interest: 'Limpeza de pele',
    source: 'WhatsApp',
    createdAt: '27/10',
    stage: 'Novo',
  },
  {
    id: 'l4',
    name: 'Renata Alves',
    interest: 'Microagulhamento',
    source: 'Indicação',
    createdAt: '25/10',
    stage: 'Quente',
  },
  {
    id: 'l5',
    name: 'Patrícia Nunes',
    interest: 'Peeling',
    source: 'WhatsApp',
    createdAt: '24/10',
    stage: 'Frio',
  },
]
