import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Briefcase, CheckSquare, BookOpen, Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'
import { ROUTES } from '@/lib/constants'

const MOBILE_NAV = [
  { label: 'Home', to: ROUTES.dashboard, icon: LayoutDashboard, exact: true },
  { label: 'Apps', to: ROUTES.applications, icon: Briefcase },
  { label: 'Tasks', to: ROUTES.tasks, icon: CheckSquare },
  { label: 'Prep', to: ROUTES.prep, icon: BookOpen },
  { label: 'AI', to: ROUTES.ai, icon: Sparkles },
]

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 md:hidden safe-area-inset-bottom">
      <ul className="flex">
        {MOBILE_NAV.map(item => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 py-2 text-2xs font-medium transition-colors',
                  isActive ? 'text-primary-600' : 'text-slate-400'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('w-5 h-5', isActive ? 'text-primary-600' : 'text-slate-400')} />
                  {item.label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
