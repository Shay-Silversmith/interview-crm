import { AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { PriorityBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDate } from '@/utils/date'
import type { Task } from '@/types'

interface Props {
  tasks: Task[]
}

export function OverdueTasksWidget({ tasks }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Overdue Tasks</CardTitle>
        {tasks.length > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-danger-100 text-danger-700 text-xs font-bold">
            {tasks.length}
          </span>
        )}
      </CardHeader>
      {tasks.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="All caught up!"
          description="No overdue tasks. Keep the momentum going."
          className="py-8"
        />
      ) : (
        <ul className="space-y-2">
          {tasks.slice(0, 4).map(task => (
            <li key={task.id} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
              <div className="w-1.5 h-1.5 rounded-full bg-danger-400 mt-2 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 leading-snug">{task.title}</p>
                {task.companyName && (
                  <p className="text-xs text-slate-400 mt-0.5">{task.companyName}</p>
                )}
                <p className="text-xs text-danger-500 mt-0.5">
                  Due {task.dueAt ? formatDate(task.dueAt) : 'Unknown'}
                </p>
              </div>
              <PriorityBadge priority={task.priority} />
            </li>
          ))}
          {tasks.length > 4 && (
            <li className="pt-1">
              <Link to="/tasks" className="text-xs text-primary-600 hover:underline font-medium">
                +{tasks.length - 4} more overdue tasks
              </Link>
            </li>
          )}
        </ul>
      )}
    </Card>
  )
}
