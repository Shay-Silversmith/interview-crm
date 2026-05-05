import { Menu, Bell, Search } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'

interface TopbarProps {
  onMenuToggle: () => void
  className?: string
}

export function Topbar({ onMenuToggle, className }: TopbarProps) {
  return (
    <header
      className={cn(
        'h-14 flex items-center gap-3 px-4 bg-white border-b border-slate-200 shrink-0',
        className
      )}
    >
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        onClick={onMenuToggle}
        aria-label="Toggle sidebar"
        className="md:hidden"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Search */}
      <div className="flex-1 hidden sm:flex max-w-xs">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="search"
            placeholder="Search applications, tasks…"
            className="w-full h-8 pl-8 pr-3 text-sm bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 focus:bg-white"
          />
        </div>
      </div>

      <div className="flex-1 md:flex-none" />

      <Button variant="ghost" size="sm" iconOnly aria-label="Notifications" className="relative">
        <Bell className="w-4 h-4" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-danger-500" />
      </Button>
    </header>
  )
}
