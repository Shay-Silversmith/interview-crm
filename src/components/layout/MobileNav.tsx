import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Briefcase, CheckSquare, BookOpen, Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'
import { ROUTES } from '@/lib/constants'
import { useI18n } from '@/hooks/useI18n'

export function MobileNav() {
  const { t } = useI18n()

  // Defined inside component so labels re-render on locale change.
  const MOBILE_NAV = [
    { label: t('mobileNav.home'),  to: ROUTES.dashboard,    icon: LayoutDashboard, exact: true },
    { label: t('mobileNav.apps'),  to: ROUTES.applications, icon: Briefcase },
    { label: t('mobileNav.tasks'), to: ROUTES.tasks,        icon: CheckSquare },
    { label: t('mobileNav.prep'),  to: ROUTES.prep,         icon: BookOpen },
    { label: t('mobileNav.ai'),    to: ROUTES.ai,           icon: Sparkles },
  ]

  return (
    // inset-x-0 = start-0 + end-0: spans full width in both LTR and RTL.
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 md:hidden safe-area-inset-bottom">
      <ul className="flex">
        {MOBILE_NAV.map(item => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-0.5 py-2 text-2xs font-medium transition-colors',
                  isActive ? 'text-primary-600' : 'text-slate-400',
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
