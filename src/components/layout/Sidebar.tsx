import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Briefcase, KanbanSquare, Building2, CheckSquare,
  Calendar, Users, FileText, BookOpen, Sparkles, Settings, X,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { ROUTES } from '@/lib/constants'

interface NavItem {
  label: string
  to: string
  icon: React.ElementType
  badge?: string
}

const NAV_GROUPS: { label?: string; items: NavItem[] }[] = [
  {
    items: [
      { label: 'Dashboard', to: ROUTES.dashboard, icon: LayoutDashboard },
    ],
  },
  {
    label: 'Pipeline',
    items: [
      { label: 'Applications', to: ROUTES.applications, icon: Briefcase },
      { label: 'Board', to: ROUTES.applicationBoard, icon: KanbanSquare },
      { label: 'Companies', to: ROUTES.companies, icon: Building2 },
    ],
  },
  {
    label: 'Work',
    items: [
      { label: 'Tasks', to: ROUTES.tasks, icon: CheckSquare },
      { label: 'Calendar', to: ROUTES.calendar, icon: Calendar },
      { label: 'Contacts', to: ROUTES.contacts, icon: Users },
      { label: 'Documents', to: ROUTES.documents, icon: FileText },
    ],
  },
  {
    label: 'Prep & AI',
    items: [
      { label: 'Interview Prep', to: ROUTES.prep, icon: BookOpen },
      { label: 'AI Tools', to: ROUTES.ai, icon: Sparkles },
    ],
  },
]

interface SidebarProps {
  onClose?: () => void
  mobile?: boolean
}

export function Sidebar({ onClose, mobile }: SidebarProps) {
  const location = useLocation()

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-white border-r border-slate-200',
        mobile ? 'w-full' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
            <ChevronRight className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-bold text-slate-900 tracking-tight">InterviewFlow</span>
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
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
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

      {/* Bottom */}
      <div className="p-3 border-t border-slate-100 shrink-0">
        <NavLink
          to={ROUTES.settings}
          onClick={onClose}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
            )
          }
        >
          <Settings className="w-4 h-4 text-slate-400" />
          Settings
        </NavLink>
        <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700 shrink-0">
            AH
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-800 truncate">Amir Haddad</p>
            <p className="text-2xs text-slate-400 truncate">3rd year · BGU</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
