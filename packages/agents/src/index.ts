// O runtime vive em './runtime' e cada agente em './<nome>'.
// Veja o SKILLS.md dentro da pasta de cada um para saber quais skills do
// instagram-agent-skill alimentam aquele agente.
export const AGENT_NAMES = [
  'marca',
  'auditoria',
  'estrategista',
  'conteudo',
  'design',
  'atendimento',
  'tendencias',
  'comentarios',
  'referencia',
] as const

export type AgentName = (typeof AGENT_NAMES)[number]
