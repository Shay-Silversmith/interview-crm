import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { MobileNav } from './MobileNav'
import { DemoModeBanner } from './DemoModeBanner'
import { SearchProvider } from '@/contexts/SearchContext'
import { CommandPalette } from '@/components/search/CommandPalette'
import { ShortcutsModal } from '@/components/ui/ShortcutsModal'
import { AgentChat } from '@/components/ai/AgentChat'
import { useShortcuts } from '@/hooks/useShortcuts'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/cn'

/** Inner shell — needs to be a child of SearchProvider to access useSearch */
function ShellInner() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [agentOpen, setAgentOpen] = useState(false)
  const { shortcutsOpen, setShortcutsOpen } = useShortcuts()
  const { locale } = useI18n()
  const isHe = locale === 'he'

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
        <DemoModeBanner />
        <Topbar
          onMenuToggle={() => setSidebarOpen(s => !s)}
          onOpenAgent={() => setAgentOpen(true)}
        />
        <main className={cn('flex-1 overflow-y-auto', 'pb-20 md:pb-0', 'px-4 md:px-6 py-6')}>
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />

      {/* Floating Agent button — bottom-right corner; sits above mobile bottom nav */}
      {!agentOpen && (
        <button
          type="button"
          onClick={() => setAgentOpen(true)}
          aria-label={isHe ? 'פתח עוזר חכם' : 'Open AI Agent'}
          className={cn(
            'fixed end-5 z-40 group',
            'bottom-24 md:bottom-6',  // clear of mobile bottom nav
            'flex items-center gap-2 ps-3 pe-4 h-12 rounded-full',
            'bg-primary-gradient text-white font-semibold text-sm shadow-lg',
            'hover:brightness-110 hover:shadow-xl active:brightness-95',
            'transition-all duration-200',
          )}
        >
          <span className="flex items-center justify-center w-7 h-7 rounded-full bg-surface/20">
            <Sparkles className="w-4 h-4" />
          </span>
          <span>{isHe ? 'עוזר חכם' : 'Ask AI'}</span>
          {/* tiny pulse to draw attention */}
          <span className="absolute -top-0.5 -end-0.5 w-2.5 h-2.5">
            <span className="absolute inset-0 rounded-full bg-warning-400 animate-ping opacity-75" />
            <span className="absolute inset-0 rounded-full bg-warning-400" />
          </span>
        </button>
      )}

      {/* Global overlays */}
      <CommandPalette />
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <AgentChat open={agentOpen} onClose={() => setAgentOpen(false)} />
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
