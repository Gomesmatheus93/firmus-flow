import { useState } from 'react'
import { Outlet } from 'react-router'
import { Backdrop } from '@/components/backdrop'
import { DemoBanner } from '@/components/demo-banner'
import { OperatorBanner } from '@/components/operator-banner'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-dvh">
      <Backdrop />

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <Sidebar />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-noite/40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="animate-in slide-in-from-left absolute inset-y-0 left-0 w-64 duration-150">
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <div className="mx-auto max-w-[86rem] px-4 py-4 lg:px-8 lg:py-5">
          <Topbar onMenu={() => setMenuOpen(true)} />
          <DemoBanner />
          <OperatorBanner />
          <main className="mt-5 space-y-5">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
