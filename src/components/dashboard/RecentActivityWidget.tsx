import {
  PlusCircle, ArrowRightCircle, CheckCircle2, CalendarDays,
  Gift, FileText, Users, StickyNote,
} from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { formatRelative } from '@/utils/date'
import { useI18n } from '@/hooks/useI18n'
import type { RecentActivity } from '@/types'
import type { ActivityType } from '@/lib/enums'

const ACTIVITY_ICONS: Record<ActivityType, { icon: React.ElementType; color: string }> = {
  application_created: { icon: PlusCircle,       color: 'text-primary-500' },
  stage_changed:       { icon: ArrowRightCircle,  color: 'text-violet-500' },
  task_completed:      { icon: CheckCircle2,      color: 'text-success-600' },
  interview_scheduled: { icon: CalendarDays,      color: 'text-warning-600' },
  offer_received:      { icon: Gift,              color: 'text-success-600' },
  note_added:          { icon: StickyNote,        color: 'text-slate-500' },
  document_added:      { icon: FileText,          color: 'text-slate-500' },
  contact_added:       { icon: Users,             color: 'text-primary-500' },
}

interface Props {
  activities: RecentActivity[]
}

export function RecentActivityWidget({ activities }: Props) {
  const { t } = useI18n()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('pages.dashboard.recentActivity')}</CardTitle>
      </CardHeader>
      <ul className="space-y-0">
        {activities.map((activity, i) => {
          const { icon: Icon, color } = ACTIVITY_ICONS[activity.type]
          return (
            <li
              key={activity.id}
              className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0"
            >
              <div className="relative flex flex-col items-center">
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
                {i < activities.length - 1 && (
                  <div className="w-px flex-1 mt-1.5 bg-slate-100 min-h-[16px]" />
                )}
              </div>
              <div className="flex-1 min-w-0 pb-0.5">
                <p className="text-xs font-semibold text-slate-700">{activity.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-snug">{activity.description}</p>
              </div>
              <span className="text-2xs text-slate-400 shrink-0 mt-0.5 force-ltr">
                {formatRelative(activity.createdAt)}
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
