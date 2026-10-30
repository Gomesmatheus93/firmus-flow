/** Datas sempre no fuso de São Paulo, como manda o CLAUDE.md. */
const TIMEZONE = 'America/Sao_Paulo'

const shortDate = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: TIMEZONE })

const dateAndTime = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: TIMEZONE,
})

const dayAndMonth = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  timeZone: TIMEZONE,
})

export const formatDate = (value: string | Date) => shortDate.format(new Date(value))
export const formatDateTime = (value: string | Date) => dateAndTime.format(new Date(value))
export const formatDayMonth = (value: string | Date) => dayAndMonth.format(new Date(value))
