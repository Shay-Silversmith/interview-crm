import { Link } from 'react-router-dom'
import { Building2, FileSearch, Sparkles, MessageSquarePlus } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { useI18n } from '@/hooks/useI18n'

export function QuickAIWidget() {
  const { t } = useI18n()

  // Defined inside component so labels re-render on locale change.
  const AI_ACTIONS = [
    {
      icon: Building2,
      label: t('pages.ai.tools.companySummary.label'),
      description: t('pages.dashboard.companySummaryDesc'),
      color: 'bg-primary-50 text-primary-600',
      to: '/ai?tool=company-summary',
    },
    {
      icon: FileSearch,
      label: t('pages.ai.tools.jdParser.label'),
      description: t('pages.dashboard.jdParserDesc'),
      color: 'bg-violet-50 text-violet-600',
      to: '/ai?tool=jd-parser',
    },
    {
      icon: Sparkles,
      label: t('pages.ai.tools.prepPack.label'),
      description: t('pages.dashboard.prepareMeDesc'),
      color: 'bg-warning-50 text-warning-600',
      to: '/ai?tool=prepare-me',
    },
    {
      icon: MessageSquarePlus,
      label: t('pages.ai.tools.followUp.label'),
      description: t('pages.dashboard.followUpDesc'),
      color: 'bg-success-50 text-success-600',
      to: '/ai?tool=followup',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('pages.dashboard.quickAiActions')}</CardTitle>
        <Link to="/ai" className="text-xs text-primary-600 hover:underline font-medium">
          {t('pages.dashboard.allTools')}
        </Link>
      </CardHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
