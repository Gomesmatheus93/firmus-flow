// O runtime dos agentes (runAgent, carregamento do Cérebro da Marca, registro de custo)
// entra na Fase 2.1. Cada agente vira uma pasta em src/<nome>/.
export const AGENT_NAMES = [
  'marca',
  'auditoria',
  'estrategista',
  'conteudo',
  'design',
  'atendimento',
] as const

export type AgentName = (typeof AGENT_NAMES)[number]
