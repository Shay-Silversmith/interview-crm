import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Sparkles, Building2, FileSearch, Brain, MessageSquarePlus, User } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/cn'
import type { AIToolType } from '@/lib/enums'
import { JDParserPanel }  from '@/components/ai/JDParserPanel'
import { PrepPackPanel }  from '@/components/ai/PrepPackPanel'
import { FollowUpPanel }  from '@/components/ai/FollowUpPanel'

// IDs of tools that are now wired to real Claude API
const LIVE_TOOLS = new Set(['jd-parser', 'prepare-me', 'followup'])

interface AITool {
  id: string
  type: AIToolType
  label: string
  description: string
  icon: React.ElementType
  color: string
  fields: { id: string; label: string; placeholder: string; multiline?: boolean }[]
}

export function AIPage() {
  const { t } = useI18n()
  const [searchParams] = useSearchParams()

  // Tool list built inside component so labels re-render on locale change
  const AI_TOOLS: AITool[] = [
    {
      id: 'company-summary',
      type: 'Company Summary',
      label: t('pages.ai.tools.companySummary.label'),
      description: t('pages.ai.tools.companySummary.desc'),
      icon: Building2,
      color: 'bg-primary-50 border-primary-200 text-primary-700',
      fields: [
        { id: 'companyName', label: 'Company Name', placeholder: 'e.g. Amazon' },
        { id: 'targetRole', label: 'Target Role', placeholder: 'e.g. Data Engineer Intern' },
      ],
    },
    {
      id: 'jd-parser',
      type: 'JD Parser',
      label: t('pages.ai.tools.jdParser.label'),
      description: t('pages.ai.tools.jdParser.desc'),
      icon: FileSearch,
      color: 'bg-violet-50 border-violet-200 text-violet-700',
      fields: [],
    },
    {
      id: 'prepare-me',
      type: 'Prepare Me',
      label: t('pages.ai.tools.prepPack.label'),
      description: t('pages.ai.tools.prepPack.desc'),
      icon: Brain,
      color: 'bg-warning-50 border-warning-200 text-warning-700',
      fields: [],
    },
    {
      id: 'interview-summary',
      type: 'Interview Summary',
      label: t('pages.ai.tools.interviewSummary.label'),
      description: t('pages.ai.tools.interviewSummary.desc'),
      icon: Sparkles,
      color: 'bg-success-50 border-success-200 text-success-700',
      fields: [
        { id: 'company', label: 'Company', placeholder: 'e.g. Wix' },
        { id: 'interviewType', label: 'Interview Type', placeholder: 'e.g. HR Screen' },
        { id: 'notes', label: 'Your Notes', placeholder: 'What happened? What did they ask? How did it go?', multiline: true },
      ],
    },
    {
      id: 'followup',
      type: 'Follow-up Message',
      label: t('pages.ai.tools.followUp.label'),
      description: t('pages.ai.tools.followUp.desc'),
      icon: MessageSquarePlus,
      color: 'bg-slate-50 border-slate-200 text-slate-700',
      fields: [],
    },
    {
      id: 'personalized',
      type: 'Personalized Answer',
      label: t('pages.ai.tools.personalizedAnswer.label'),
      description: t('pages.ai.tools.personalizedAnswer.desc'),
      icon: User,
      color: 'bg-danger-50 border-danger-200 text-danger-700',
      fields: [
        { id: 'question', label: 'Interview Question', placeholder: 'e.g. Tell me about a time you delivered results under pressure' },
        { id: 'company', label: 'Company', placeholder: 'e.g. Amazon' },
        { id: 'context', label: 'Additional Context', placeholder: 'Any specific focus area or LP to highlight…', multiline: true },
      ],
    },
  ]

  const initialToolId = searchParams.get('tool') ?? 'jd-parser'
  const [activeTool, setActiveTool] = useState<string>(
    AI_TOOLS.find(tool => tool.id === initialToolId)?.id ?? 'jd-parser'
  )
  const tool        = AI_TOOLS.find(tool => tool.id === activeTool) ?? AI_TOOLS[0]
  const isLive      = LIVE_TOOLS.has(activeTool)

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title={t('pages.ai.title')}
        description={t('pages.ai.subtitle')}
      />

      <div className="flex gap-4">
        {/* Tool selector - left rail */}
        <div className="w-56 shrink-0 hidden md:block">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-2 sticky top-4">
            {AI_TOOLS.map(item => {
              const live = LIVE_TOOLS.has(item.id)
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTool(item.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm transition-colors',
                    activeTool === item.id
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 font-medium'
                  )}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="truncate flex-1">{item.label}</span>
                  <span className={cn(
                    'text-2xs font-bold border px-1.5 py-0.5 rounded-full shrink-0',
                    live
                      ? 'text-success-600 bg-success-50 border-success-200'
                      : 'text-slate-400 bg-slate-50 border-slate-200'
                  )}>
                    {live ? 'Live' : t('pages.ai.soon')}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Mobile tool selector */}
        <div className="md:hidden w-full mb-4">
          <div className="grid grid-cols-2 gap-2">
            {AI_TOOLS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTool(item.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all',
                  activeTool === item.id
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-slate-600 border-slate-200'
                )}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
                {!LIVE_TOOLS.has(item.id) && (
                  <span className="text-2xs text-slate-400">· {t('pages.ai.soon')}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main panel */}
        <div className="flex-1 min-w-0">
          {/* Live tool panels */}
          {activeTool === 'jd-parser'  && <JDParserPanel />}
          {activeTool === 'prepare-me' && <PrepPackPanel />}
          {activeTool === 'followup'   && <FollowUpPanel />}

          {/* Tools that are not built yet. Showing a stored example here would
              look like a working feature, so say what it is instead. */}
          {!isLive && (
            <Card className="flex flex-col items-center justify-center text-center min-h-80 px-6">
              <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center border mb-4', tool.color)}>
                <tool.icon className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-800">{tool.label}</h2>
              <p className="text-sm text-slate-500 mt-1.5 max-w-md">{tool.description}</p>
              <span className="mt-4 text-2xs font-bold uppercase tracking-wide text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                {t('pages.ai.notBuiltYet')}
              </span>
              <p className="text-xs text-slate-400 mt-4 max-w-sm">{t('pages.ai.notBuiltYetHint')}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
