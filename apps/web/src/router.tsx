import { createBrowserRouter, Navigate } from 'react-router'
import {
  GuestOnly,
  RequireCompany,
  RequireOnboarding,
  RequireOperator,
  RequireUser,
} from '@/components/guards'
import { AppShell } from '@/components/layout/app-shell'
import { AdminPage } from '@/pages/admin'
import { AdminOverviewPage } from '@/pages/admin-overview'
import { AdminPlansPage } from '@/pages/admin-plans'
import { AnalyticsPage } from '@/pages/analytics'
import { ApprovalsPage } from '@/pages/approvals'
import { AuditPage } from '@/pages/audit'
import { AcceptInvitePage } from '@/pages/auth/accept-invite'
import { SignInPage } from '@/pages/auth/sign-in'
import { SignUpPage } from '@/pages/auth/sign-up'
import { BrandPage } from '@/pages/brand'
import { CommentAutomationPage } from '@/pages/comment-automation'
import { ConversationsPage } from '@/pages/conversations'
import { CreateCompanyPage } from '@/pages/create-company'
import { CreationPage } from '@/pages/creation'
import { DashboardPage } from '@/pages/dashboard'
import { FeedPage } from '@/pages/feed'
import { LeadsPage } from '@/pages/leads'
import { NotFoundPage } from '@/pages/not-found'
import { OnboardingPage } from '@/pages/onboarding'
import { PlanPage } from '@/pages/plan'
import { SchedulerPage } from '@/pages/scheduler'
import { SettingsPage } from '@/pages/settings'
import { TeamPage } from '@/pages/team'
import { TrendsPage } from '@/pages/trends'

export const router = createBrowserRouter([
  // O link de convite é público: quem recebe ainda pode não ter conta.
  { path: '/convite/:token', element: <AcceptInvitePage /> },

  {
    element: <GuestOnly />,
    children: [
      { path: '/entrar', element: <SignInPage /> },
      { path: '/criar-conta', element: <SignUpPage /> },
    ],
  },

  // Exige login, mas ainda não exige empresa.
  {
    element: <RequireUser />,
    children: [{ path: '/criar-empresa', element: <CreateCompanyPage /> }],
  },

  // Área da equipe da Firmus: exige o papel de operador, não uma empresa.
  {
    element: <RequireOperator />,
    children: [
      {
        path: '/',
        element: <AppShell />,
        children: [
          { path: 'admin', element: <AdminOverviewPage /> },
          { path: 'admin/empresas', element: <AdminPage /> },
          { path: 'admin/planos', element: <AdminPlansPage /> },
        ],
      },
    ],
  },

  // Exige login e empresa.
  {
    element: <RequireCompany />,
    children: [
      // O onboarding ocupa a tela inteira, fora da casca da plataforma.
      { path: '/onboarding', element: <OnboardingPage /> },

      // O resto roda na casca. O chefe com o Cérebro incompleto vai antes
      // para o onboarding.
      {
        element: <RequireOnboarding />,
        children: [
          {
            path: '/',
            element: <AppShell />,
            children: [
              { index: true, element: <Navigate to="/painel" replace /> },
              { path: 'painel', element: <DashboardPage /> },
              { path: 'marca', element: <BrandPage /> },
              // O onboarding substituiu a tela antiga; o endereço continua valendo.
              { path: 'marca/montar', element: <Navigate to="/onboarding" replace /> },
              { path: 'auditoria', element: <AuditPage /> },
              { path: 'planejamento', element: <PlanPage /> },
              { path: 'criar/:tipo', element: <CreationPage /> },
              { path: 'criacao', element: <Navigate to="/criar/carrossel" replace /> },
              { path: 'aprovacoes', element: <ApprovalsPage /> },
              { path: 'tendencias', element: <TrendsPage /> },
              { path: 'analytics', element: <AnalyticsPage /> },
              { path: 'programador', element: <SchedulerPage /> },
              { path: 'feed', element: <FeedPage /> },
              { path: 'comentarios', element: <CommentAutomationPage /> },
              { path: 'conversas', element: <ConversationsPage /> },
              { path: 'leads', element: <LeadsPage /> },
              { path: 'equipe', element: <TeamPage /> },
              { path: 'configuracoes', element: <SettingsPage /> },
            ],
          },
        ],
      },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
])
