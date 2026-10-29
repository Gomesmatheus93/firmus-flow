import { createBrowserRouter, Navigate } from 'react-router'
import { AppShell } from '@/components/layout/app-shell'
import { ApprovalsPage } from '@/pages/approvals'
import { AuditPage } from '@/pages/audit'
import { SignInPage } from '@/pages/auth/sign-in'
import { SignUpPage } from '@/pages/auth/sign-up'
import { BrandPage } from '@/pages/brand'
import { ContentPage } from '@/pages/content'
import { ConversationsPage } from '@/pages/conversations'
import { DashboardPage } from '@/pages/dashboard'
import { DesignsPage } from '@/pages/designs'
import { LeadsPage } from '@/pages/leads'
import { NotFoundPage } from '@/pages/not-found'
import { PlanPage } from '@/pages/plan'
import { SettingsPage } from '@/pages/settings'
import { TeamPage } from '@/pages/team'

export const router = createBrowserRouter([
  { path: '/entrar', element: <SignInPage /> },
  { path: '/criar-conta', element: <SignUpPage /> },
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/painel" replace /> },
      { path: 'painel', element: <DashboardPage /> },
      { path: 'marca', element: <BrandPage /> },
      { path: 'auditoria', element: <AuditPage /> },
      { path: 'planejamento', element: <PlanPage /> },
      { path: 'conteudo', element: <ContentPage /> },
      { path: 'artes', element: <DesignsPage /> },
      { path: 'aprovacoes', element: <ApprovalsPage /> },
      { path: 'conversas', element: <ConversationsPage /> },
      { path: 'leads', element: <LeadsPage /> },
      { path: 'equipe', element: <TeamPage /> },
      { path: 'configuracoes', element: <SettingsPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
