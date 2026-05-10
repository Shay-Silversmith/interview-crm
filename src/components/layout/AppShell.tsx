import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileNav } from './MobileNav'
import { SearchProvider } from '@/contexts/SearchContext'
import { CommandPalette } from '@/components/search/CommandPalette'
import { ShortcutsModal } from '@/components/ui/ShortcutsModal'
import { useShortcuts } from '@/hooks/useShortcuts'
import { cn } from '@/lib/cn'

/** Inner shell — needs to be a child of SearchProvider to access useSearch */
function ShellInner() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { shortcutsOpen, setShortcutsOpen } = useShortcuts()

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-72">
            <Sidebar mobile onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onMenuToggle={() => setSidebarOpen(s => !s)} />
        <main className={cn('flex-1 overflow-y-auto', 'pb-20 md:pb-0', 'px-4 md:px-6 py-6')}>
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />

      {/* Global overlays */}
      <CommandPalette />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  )
}

export function AppShell() {
  return (
    <SearchProvider>
      <ShellInner />
    </SearchProvider>
  )
}
