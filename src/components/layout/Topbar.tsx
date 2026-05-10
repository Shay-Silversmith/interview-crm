import { Menu, Bell, Search } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '@/components/ui/Button'
import { BackendIndicator } from './BackendIndicator'
import { LanguageToggle } from './LanguageToggle'
import { useSearch } from '@/contexts/SearchContext'
import { useI18n } from '@/hooks/useI18n'

interface TopbarProps {
  onMenuToggle: () => void
  className?: string
}

export function Topbar({ onMenuToggle, className }: TopbarProps) {
  const { open: openSearch } = useSearch()
  const { t } = useI18n()

  return (
    <header
      className={cn(
        'h-14 flex items-center gap-3 px-4 bg-white border-b border-slate-200 shrink-0',
        className,
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

      {/* Search trigger — opens CommandPalette.
          force-ltr: search text and ⌘K badge always render left-to-right,
          even when the UI is in Hebrew/RTL mode. */}
      <div className="flex-1 hidden sm:flex max-w-xs">
        <button
          type="button"
          onClick={openSearch}
          className="force-ltr relative w-full h-8 flex items-center gap-2 ps-8 pe-3 text-sm text-slate-400 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 hover:border-slate-300 transition-colors text-start"
          aria-label="Open search (⌘K)"
        >
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <span className="flex-1 truncate">{t('topbar.searchPlaceholder')}</span>
          <kbd className="hidden md:inline-flex items-center gap-0.5 text-2xs font-mono text-slate-400 bg-white border border-slate-200 rounded px-1">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Spacer pushes right cluster to the end */}
      <div className="flex-1 md:flex-none" />

      {/* Right cluster: backend pill · language toggle · notifications */}
      <BackendIndicator />

      <LanguageToggle />

      <Button
        variant="ghost"
        size="sm"
        iconOnly
        aria-label={t('topbar.notifications')}
        className="relative"
      >
        <Bell className="w-4 h-4" />
        <span className="absolute top-1.5 end-1.5 w-1.5 h-1.5 rounded-full bg-danger-500" />
      </Button>
    </header>
  )
}
