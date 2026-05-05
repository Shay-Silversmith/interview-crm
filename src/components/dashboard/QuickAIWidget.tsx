import { Link } from 'react-router-dom'
import { Building2, FileSearch, Sparkles, MessageSquarePlus } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'

const AI_ACTIONS = [
  {
    icon: Building2,
    label: 'Company Summary',
    description: 'Get AI insights on a target company',
    color: 'bg-primary-50 text-primary-600',
    to: '/ai?tool=company-summary',
  },
  {
    icon: FileSearch,
    label: 'JD Parser',
    description: 'Extract key requirements from a JD',
    color: 'bg-violet-50 text-violet-600',
    to: '/ai?tool=jd-parser',
  },
  {
    icon: Sparkles,
    label: 'Prepare Me',
    description: 'Get a personalized interview prep plan',
    color: 'bg-warning-50 text-warning-600',
    to: '/ai?tool=prepare-me',
  },
  {
    icon: MessageSquarePlus,
    label: 'Follow-up Message',
    description: 'Draft a professional follow-up email',
    color: 'bg-success-50 text-success-600',
    to: '/ai?tool=followup',
  },
]

export function QuickAIWidget() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick AI Actions</CardTitle>
        <Link to="/ai" className="text-xs text-primary-600 hover:underline font-medium">
          All tools
        </Link>
      </CardHeader>
      <div className="grid grid-cols-2 gap-2">
        {AI_ACTIONS.map(action => (
          <Link
            key={action.label}
            to={action.to}
            className="flex flex-col gap-2 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-card-hover transition-all group"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${action.color}`}>
              <action.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 group-hover:text-primary-700 transition-colors">
                {action.label}
              </p>
              <p className="text-2xs text-slate-400 mt-0.5 leading-snug">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  )
}
