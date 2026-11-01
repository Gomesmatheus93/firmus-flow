import type { Database } from '@firmus/db'
import { agentRuns, companies, invoices, plans, subscriptions } from '@firmus/db/schema'
import { and, count, countDistinct, eq, gte, lt, sql } from 'drizzle-orm'
import { Router } from 'express'
import { usdBrlRate } from '../money/ptax'

/** Primeiro instante do mês corrente, em UTC. */
function startOfMonth(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
}

function daysAgo(days: number, now = new Date()): Date {
  const date = new Date(now)
  date.setUTCDate(date.getUTCDate() - days)
  return date
}

const toCents = (reais: number) => Math.round(reais * 100)

/**
 * Visão geral do negócio, para a conta de operador.
 *
 * Tudo agregado da plataforma inteira — é a única parte do sistema que olha
 * além de uma empresa, e por isso vive atrás de requireOperator.
 */
export function adminOverviewRoutes(db: Database): Router {
  const router = Router()

  router.get('/admin/overview', async (_req, res) => {
    const inicioDoMes = startOfMonth()
    const trintaDias = daysAgo(30)

    // ---------------------------------------------------------------- clientes
    const [totais] = await db
      .select({
        total: count(companies.id),
        novasNoMes: sql<number>`count(*) filter (where ${companies.createdAt} >= ${inicioDoMes})::int`,
      })
      .from(companies)

    // "Ativa" é empresa que produziu alguma coisa nos últimos 30 dias. Sem
    // isso, empresa abandonada contaria como cliente ativo para sempre.
    const [ativas] = await db
      .select({ total: countDistinct(agentRuns.companyId) })
      .from(agentRuns)
      .where(gte(agentRuns.createdAt, trintaDias))

    // ----------------------------------------------------------------- receita
    // MRR: só assinatura ativa conta. Plano anual entra dividido por 12, senão
    // um cliente anual inflaria o mês em que assinou.
    const [mrr] = await db
      .select({
        cents: sql<number>`coalesce(sum(
          case when ${plans.interval} = 'anual'
            then ${plans.priceCents} / 12
            else ${plans.priceCents}
          end
        ), 0)::int`,
      })
      .from(subscriptions)
      .innerJoin(plans, eq(plans.id, subscriptions.planId))
      .where(eq(subscriptions.status, 'ativa'))

    const [recebido] = await db
      .select({ cents: sql<number>`coalesce(sum(${invoices.amountCents}), 0)::int` })
      .from(invoices)
      .where(and(eq(invoices.status, 'paga'), gte(invoices.paidAt, inicioDoMes)))

    const [emAberto] = await db
      .select({ cents: sql<number>`coalesce(sum(${invoices.amountCents}), 0)::int` })
      .from(invoices)
      .where(eq(invoices.status, 'aberta'))

    // ------------------------------------------------------------ inadimplência
    // Conta empresa, não fatura: duas faturas vencidas do mesmo cliente são um
    // inadimplente, não dois.
    const [inadimplencia] = await db
      .select({
        empresas: countDistinct(invoices.companyId),
        cents: sql<number>`coalesce(sum(${invoices.amountCents}), 0)::int`,
      })
      .from(invoices)
      .where(eq(invoices.status, 'vencida'))

    // -------------------------------------------------------------- desistências
    const [cancelamentos] = await db
      .select({ total: count(subscriptions.id) })
      .from(subscriptions)
      .where(and(eq(subscriptions.status, 'cancelada'), gte(subscriptions.canceledAt, inicioDoMes)))

    // Base do churn: quem estava pagando quando o mês começou.
    const [baseInicioDoMes] = await db
      .select({ total: count(subscriptions.id) })
      .from(subscriptions)
      .where(
        and(
          lt(subscriptions.startedAt, inicioDoMes),
          sql`(${subscriptions.canceledAt} is null or ${subscriptions.canceledAt} >= ${inicioDoMes})`,
        ),
      )

    const [assinaturasAtivas] = await db
      .select({ total: count(subscriptions.id) })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'ativa'))

    // --------------------------------------------------------------- custo de IA
    // O custo em reais usa a cotação guardada em cada execução, não a de hoje:
    // o que você gastou em março continua valendo o dólar de março.
    const [custoDoMes] = await db
      .select({
        brl: sql<string>`coalesce(sum(${agentRuns.costUsd} * ${agentRuns.usdBrlRate}), 0)::text`,
        chamadas: count(agentRuns.id),
        tokens: sql<number>`coalesce(sum(${agentRuns.inputTokens} + ${agentRuns.outputTokens}), 0)::int`,
      })
      .from(agentRuns)
      .where(gte(agentRuns.createdAt, inicioDoMes))

    const maioresGastos = await db
      .select({
        companyId: agentRuns.companyId,
        companyName: companies.name,
        brl: sql<string>`sum(${agentRuns.costUsd} * ${agentRuns.usdBrlRate})::text`,
      })
      .from(agentRuns)
      .innerJoin(companies, eq(companies.id, agentRuns.companyId))
      .where(gte(agentRuns.createdAt, inicioDoMes))
      .groupBy(agentRuns.companyId, companies.name)
      .orderBy(sql`sum(${agentRuns.costUsd} * ${agentRuns.usdBrlRate}) desc`)
      .limit(5)

    const custoCents = toCents(Number(custoDoMes?.brl ?? 0))
    const recebidoCents = recebido?.cents ?? 0

    res.json({
      geradoEm: new Date().toISOString(),
      cotacaoDolar: await usdBrlRate(db),

      clientes: {
        total: totais?.total ?? 0,
        ativos: ativas?.total ?? 0,
        novosNoMes: totais?.novasNoMes ?? 0,
      },

      receita: {
        mrrCents: mrr?.cents ?? 0,
        recebidoNoMesCents: recebidoCents,
        emAbertoCents: emAberto?.cents ?? 0,
      },

      inadimplencia: {
        empresas: inadimplencia?.empresas ?? 0,
        valorCents: inadimplencia?.cents ?? 0,
      },

      desistencias: {
        noMes: cancelamentos?.total ?? 0,
        baseInicioDoMes: baseInicioDoMes?.total ?? 0,
        assinaturasAtivas: assinaturasAtivas?.total ?? 0,
      },

      custoIa: {
        noMesCents: custoCents,
        chamadas: custoDoMes?.chamadas ?? 0,
        tokens: custoDoMes?.tokens ?? 0,
        porEmpresa: maioresGastos.map((linha) => ({
          companyId: linha.companyId,
          companyName: linha.companyName,
          cents: toCents(Number(linha.brl)),
        })),
      },

      /** O número que fecha a conta: faturar bem com IA cara não é lucro. */
      margemCents: recebidoCents - custoCents,
    })
  })

  /** Planos vendidos. Configuração da Firmus, não do cliente. */
  router.get('/admin/plans', async (_req, res) => {
    const linhas = await db
      .select({
        id: plans.id,
        name: plans.name,
        description: plans.description,
        priceCents: plans.priceCents,
        interval: plans.interval,
        active: plans.active,
        assinantes: sql<number>`(
          select count(*)::int from ${subscriptions}
          where ${subscriptions.planId} = ${plans.id}
            and ${subscriptions.status} = 'ativa'
        )`,
      })
      .from(plans)
      .orderBy(plans.priceCents)

    res.json({ plans: linhas })
  })

  return router
}
