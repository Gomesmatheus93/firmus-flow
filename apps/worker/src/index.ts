import { env } from './env'

// A conexão com o Redis e os workers do BullMQ entram na Fase 2.1.
console.log(`[worker] Firmus Flow iniciado. Redis configurado em ${env.REDIS_URL}`)
