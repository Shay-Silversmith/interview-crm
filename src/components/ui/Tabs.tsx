import { cn } from '@/lib/cn'

interface Tab {
  id: string
  label: string
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    // Eight tabs do not fit a phone. Without a scroll strip they either squash
    // to unreadable or push the whole page sideways; here the row scrolls on
    // its own and the cut-off edge shows there is more to reach.
    <div
      className={cn(
        'flex gap-1 border-b border-slate-200 overflow-x-auto scrollbar-none bleed-x',
        className,
      )}
    >
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors duration-150',
            'shrink-0 whitespace-nowrap',
            activeTab === tab.id
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={cn(
                'inline-flex items-center justify-center text-2xs rounded-full px-1.5 py-0.5 font-medium min-w-[1.25rem]',
                activeTab === tab.id
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-slate-100 text-slate-500'
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
