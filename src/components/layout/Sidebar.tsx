import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Briefcase, KanbanSquare, Building2, CheckSquare,
  Calendar, Users, FileText, BookOpen, Sparkles, Settings, X,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { ROUTES } from '@/lib/constants'
import { useI18n } from '@/hooks/useI18n'

interface SidebarProps {
  onClose?: () => void
  mobile?: boolean
}

export function Sidebar({ onClose, mobile }: SidebarProps) {
  const location = useLocation()
  const { t } = useI18n()

  // Nav groups are computed inside the component so labels update on locale change.
  const NAV_GROUPS = [
    {
      items: [
        { label: t('nav.dashboard'), to: ROUTES.dashboard, icon: LayoutDashboard },
      ],
    },
    {
      label: t('nav.groupPipeline'),
      items: [
        { label: t('nav.applications'), to: ROUTES.applications,   icon: Briefcase },
        { label: t('nav.board'),        to: ROUTES.applicationBoard, icon: KanbanSquare },
        { label: t('nav.companies'),    to: ROUTES.companies,       icon: Building2 },
      ],
    },
    {
      label: t('nav.groupWork'),
      items: [
        { label: t('nav.tasks'),     to: ROUTES.tasks,     icon: CheckSquare },
        { label: t('nav.calendar'),  to: ROUTES.calendar,  icon: Calendar },
        { label: t('nav.contacts'),  to: ROUTES.contacts,  icon: Users },
        { label: t('nav.documents'), to: ROUTES.documents, icon: FileText },
      ],
    },
    {
      label: t('nav.groupPrepAi'),
      items: [
        { label: t('nav.prep'), to: ROUTES.prep, icon: BookOpen },
        { label: t('nav.ai'),   to: ROUTES.ai,   icon: Sparkles },
      ],
    },
  ]

  return (
    <aside
      className={cn(
        // border-e = border-inline-end: right in LTR, left in RTL
        // so the dividing line always faces the main content area.
        'flex flex-col h-full bg-white border-e border-slate-200',
        mobile ? 'w-full' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
            {/* rtl:rotate-180 flips the chevron to point left in RTL */}
            <ChevronRight className="w-4 h-4 text-white rtl:rotate-180" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold text-slate-900 tracking-tight">
            InterviewFlow
          </span>
        </div>
        {mobile && onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
            {group.label && (
              <p className="px-3 py-1 text-2xs font-semibold text-slate-400 uppercase tracking-wider">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map(item => {
                const isActive =
                  item.to === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.to)
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800',
                      )}
                    >
                      <item.icon
                        className={cn('w-4 h-4 shrink-0', isActive ? 'text-primary-600' : 'text-slate-400')}
                      />
                      {item.label}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Bottom: Settings + user chip */}
      <div className="p-3 border-t border-slate-100 shrink-0">
        <NavLink
          to={ROUTES.settings}
          onClick={onClose}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800',
            )
          }
        >
          <Settings className="w-4 h-4 text-slate-400" />
          {t('nav.settings')}
        </NavLink>
        <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700 shrink-0">
            SS
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-800 truncate">Shay Silversmith</p>
            <p className="text-2xs text-slate-400 truncate">3rd year · BGU</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
