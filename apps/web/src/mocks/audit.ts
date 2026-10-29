export const auditScore = {
  overall: 7.4,
  updatedAt: '28/10/2026',
  areas: [
    { label: 'Perfil e bio', score: 8.2 },
    { label: 'Constância de posts', score: 6.1 },
    { label: 'Qualidade visual', score: 8.8 },
    { label: 'Tempo de resposta', score: 5.4 },
  ],
}

export const auditStrengths = [
  'Identidade visual consistente: as últimas 18 publicações seguem a mesma paleta.',
  'Bio clara, com cidade e chamada para o WhatsApp.',
  'Boa taxa de salvamentos nos carrosséis educativos.',
]

export const auditIssues = [
  {
    id: 'i1',
    priority: 'alta' as const,
    title: 'Respostas no direct demoram em média 9 horas',
    detail:
      'Metade das mensagens chega fora do horário comercial e fica sem resposta até o dia seguinte. É aqui que a maior parte dos clientes desiste.',
  },
  {
    id: 'i2',
    priority: 'alta' as const,
    title: 'Sem publicações entre 05/10 e 14/10',
    detail: 'Nove dias sem postar derrubaram o alcance em 34% na semana seguinte.',
  },
  {
    id: 'i3',
    priority: 'media' as const,
    title: 'Nenhuma chamada para ação nas legendas',
    detail: 'Das últimas 20 legendas, 3 pedem alguma ação do seguidor.',
  },
  {
    id: 'i4',
    priority: 'baixa' as const,
    title: 'Destaques sem capa padronizada',
    detail: 'Os seis destaques usam capas diferentes entre si.',
  },
]
