import { useState } from 'react'
import { Outlet } from 'react-router'
import { Backdrop } from '@/components/backdrop'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-dvh">
      <Backdrop />

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-68 lg:block">
        <Sidebar />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-abismo/80 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="animate-in slide-in-from-left absolute inset-y-0 left-0 w-68 duration-200">
            <Sidebar onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-68">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
