import { Link } from 'react-router-dom'
import { CardSkeleton } from '@/components/ui/Skeleton'
import { ActionStrip } from '@/components/dashboard/ActionStrip'
import { TopApplicationsWidget } from '@/components/dashboard/TopApplicationsWidget'
import { UpcomingDeadlinesWidget } from '@/components/dashboard/UpcomingDeadlinesWidget'
import { RecentActivityWidget } from '@/components/dashboard/RecentActivityWidget'
import { QuickAIWidget } from '@/components/dashboard/QuickAIWidget'
import { useMockStore } from '@/hooks/useMockStore'
import { useProfile } from '@/hooks/useProfile'
import { useI18n } from '@/hooks/useI18n'
import { dashboardService } from '@/services/dashboardService'
import { QK } from '@/lib/query-keys'
import { mockUser } from '@/data/mock-user'
import { formatDate } from '@/utils/date'

function getGreetingKey(): 'pages.dashboard.greetingMorning' | 'pages.dashboard.greetingAfternoon' | 'pages.dashboard.greetingEvening' {
  const h = new Date().getHours()
  if (h < 12) return 'pages.dashboard.greetingMorning'
  if (h < 17) return 'pages.dashboard.greetingAfternoon'
  return 'pages.dashboard.greetingEvening'
}

export function DashboardPage() {
  const { data, loading } = useMockStore(() => dashboardService.getDashboardData(), [], { key: QK.dashboard.all() })
  const { profile } = useProfile()
  const { t } = useI18n()
  const today     = formatDate(new Date(), 'EEEE, MMMM d')
  // Live profile takes priority; fall back to the mock persona, then a safe default.
  const firstName = profile?.preferredName ?? mockUser.preferredName ?? 'there'

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Greeting hero — dot grid bounded tightly to this strip only */}
      <div className="dot-grid-bg bg-white rounded-2xl border border-slate-200/80 shadow-card px-6 py-5">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1 force-ltr">{today}</p>
        <h1 className="text-2xl font-bold text-slate-900">
          {t(getGreetingKey())}, {firstName}.
        </h1>
      </div>

      {/* ── Action strip — most prominent element on the page ────────────── */}
      {(loading || data) && (
        <ActionStrip data={data!} loading={loading} />
      )}

      {/* ── Main widget grid (unchanged) ─────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <TopApplicationsWidget applications={data.topApplications} />
            </div>
            <QuickAIWidget />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <RecentActivityWidget activities={data.recentActivity} />
            </div>
            <UpcomingDeadlinesWidget events={data.upcomingDeadlines} />
          </div>
        </>
      ) : null}
    </div>
  )
}
