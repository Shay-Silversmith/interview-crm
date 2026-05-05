import { Link } from 'react-router-dom'
import { Briefcase } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { StageBadge } from '@/components/ui/Badge'
import { ScoreRing } from '@/components/ui/ScoreRing'
import { CompanyLogo } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import type { JobApplication } from '@/types'

interface Props {
  applications: JobApplication[]
}

export function TopApplicationsWidget({ applications }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Priority Applications</CardTitle>
        <Link to="/applications" className="text-xs text-primary-600 hover:underline font-medium">
          View all
        </Link>
      </CardHeader>
      {applications.length === 0 ? (
        <EmptyState icon={Briefcase} title="No active applications" description="Add your first application to get started." className="py-8" />
      ) : (
        <ul className="space-y-3">
          {applications.map(app => (
            <li key={app.id}>
              <Link
                to={`/applications/${app.id}`}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <CompanyLogo name={app.companyName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{app.roleName}</p>
                  <p className="text-xs text-slate-500">{app.companyName}</p>
                  <div className="mt-1">
                    <StageBadge stage={app.stage} />
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {app.fitScore !== undefined && (
                    <ScoreRing score={app.fitScore} label="Fit" size="sm" />
                  )}
                  {app.urgencyScore !== undefined && (
                    <ScoreRing score={app.urgencyScore} label="Urgency" size="sm" />
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
