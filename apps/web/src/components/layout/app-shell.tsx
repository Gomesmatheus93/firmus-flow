import { useState } from 'react'
import { Outlet } from 'react-router'
import { Backdrop } from '@/components/backdrop'
import { DemoBanner } from '@/components/demo-banner'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-dvh">
      <Backdrop />

      <aside className="fixed inset-y-3 left-3 z-40 hidden w-[16.5rem] lg:block">
        <Sidebar />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-noite/30 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="animate-in slide-in-from-left absolute inset-y-3 left-3 w-[16.5rem] duration-150">
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-[17.25rem]">
        <div className="mx-auto max-w-[86rem] px-4 py-4 lg:px-6 lg:py-5">
          <Topbar onMenu={() => setMenuOpen(true)} />
          <DemoBanner />
          <main className="mt-6 space-y-5">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
