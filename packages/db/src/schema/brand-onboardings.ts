import type {
  BrandBrainDraft,
  OnboardingAnswers,
  OnboardingStatus,
  OnboardingVisual,
} from '@firmus/shared'
import { integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { companies } from './companies'

/**
 * O onboarding da marca: as respostas do chefe, guardadas como ele escreveu.
 *
 * Fica separado do Cérebro (`brand_brains`) de propósito: o Cérebro é o que o
 * agente montou e o chefe revisou; aqui é a matéria-prima. Com ela dá para
 * regerar o Cérebro depois — com um prompt melhor, por exemplo — sem perguntar
 * tudo de novo.
 *
 * Uma linha por empresa. `currentStep` guarda onde o chefe parou: fechou a
 * página, volta dali.
 */
export const brandOnboardings = pgTable('brand_onboardings', {
  companyId: uuid()
    .primaryKey()
    .references(() => companies.id, { onDelete: 'cascade' }),

  /** 1 a 4 são as perguntas, 5 é a identidade visual (opcional). */
  currentStep: integer().notNull().default(1),
  answers: jsonb().$type<OnboardingAnswers>().notNull().default({}),
  visual: jsonb().$type<OnboardingVisual>(),

  /** Texto livre de propósito: o formato é `OnboardingStatus`, de @firmus/shared. */
  status: text().$type<OnboardingStatus>().notNull().default('respondendo'),
  /** O que o agente devolveu, esperando a revisão do chefe. */
  draft: jsonb().$type<BrandBrainDraft>(),
  errorMessage: text(),

  completedAt: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
})

export type BrandOnboarding = typeof brandOnboardings.$inferSelect
export type NewBrandOnboarding = typeof brandOnboardings.$inferInsert
