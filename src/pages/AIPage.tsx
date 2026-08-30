import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Building2, FileSearch, Brain, MessageSquarePlus, User, NotebookPen } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useI18n } from '@/hooks/useI18n'
import { cn } from '@/lib/cn'
import { CompanyBriefPanel }     from '@/components/ai/CompanyBriefPanel'
import { JDParserPanel }         from '@/components/ai/JDParserPanel'
import { PrepPackPanel }         from '@/components/ai/PrepPackPanel'
import { InterviewDebriefPanel } from '@/components/ai/InterviewDebriefPanel'
import { FollowUpPanel }         from '@/components/ai/FollowUpPanel'
import { StarAnswersPanel }      from '@/components/ai/StarAnswersPanel'

type ToolId =
  | 'company-summary' | 'jd-parser' | 'prepare-me'
  | 'interview-summary' | 'followup' | 'personalized'

interface AITool {
  id:      ToolId
  labelKey: string
  /** One line saying what you get out, not what the tool is called. */
  descKey: string
  icon:    React.ElementType
  accent:  string
  Panel:   () => JSX.Element
}

const AI_TOOLS: AITool[] = [
  {
    id: 'company-summary',
    labelKey: 'pages.ai.tools.companySummary.label',
    descKey:  'pages.ai.tools.companySummary.desc',
    icon: Building2,
    accent: 'text-primary-600',
    Panel: CompanyBriefPanel,
  },
  {
    id: 'jd-parser',
    labelKey: 'pages.ai.tools.jdParser.label',
    descKey:  'pages.ai.tools.jdParser.desc',
    icon: FileSearch,
    accent: 'text-violet-600',
    Panel: JDParserPanel,
  },
  {
    id: 'prepare-me',
    labelKey: 'pages.ai.tools.prepPack.label',
    descKey:  'pages.ai.tools.prepPack.desc',
    icon: Brain,
    accent: 'text-warning-600',
    Panel: PrepPackPanel,
  },
  {
    id: 'personalized',
    labelKey: 'pages.ai.tools.personalizedAnswer.label',
    descKey:  'pages.ai.tools.personalizedAnswer.desc',
    icon: User,
    accent: 'text-danger-600',
    Panel: StarAnswersPanel,
  },
  {
    id: 'interview-summary',
    labelKey: 'pages.ai.tools.interviewSummary.label',
    descKey:  'pages.ai.tools.interviewSummary.desc',
    icon: NotebookPen,
    accent: 'text-success-600',
    Panel: InterviewDebriefPanel,
  },
  {
    id: 'followup',
    labelKey: 'pages.ai.tools.followUp.label',
    descKey:  'pages.ai.tools.followUp.desc',
    icon: MessageSquarePlus,
    accent: 'text-slate-600',
    Panel: FollowUpPanel,
  },
]

export function AIPage() {
  const { t } = useI18n()
  const [searchParams, setSearchParams] = useSearchParams()

  const paramTool = searchParams.get('tool') as ToolId | null
  const [activeTool, setActiveTool] = useState<ToolId>(
    AI_TOOLS.find(x => x.id === paramTool)?.id ?? 'company-summary',
  )

  // Deep links from the dashboard and application pages set ?tool=… — honour
  // later changes to it, not just the value present on first render.
  useEffect(() => {
    if (paramTool && AI_TOOLS.some(x => x.id === paramTool)) setActiveTool(paramTool)
  }, [paramTool])

  const select = (id: ToolId) => {
    setActiveTool(id)
    setSearchParams({ tool: id }, { replace: true })
  }

  const tool = AI_TOOLS.find(x => x.id === activeTool) ?? AI_TOOLS[0]
  const Panel = tool.Panel

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title={t('pages.ai.title')} description={t('pages.ai.subtitle')} />

      <div className="flex gap-4">
        {/* Tool rail — the description sits under each name so the list itself
            explains what the six tools are for, rather than six similar labels. */}
        <div className="w-64 shrink-0 hidden lg:block">
          <div className="bg-surface rounded-2xl border border-slate-200/80 shadow-card p-2 sticky top-4">
            {AI_TOOLS.map(item => (
              <button
                key={item.id}
                onClick={() => select(item.id)}
                className={cn(
                  'w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-start transition-colors',
                  activeTool === item.id
                    ? 'bg-primary-50'
                    : 'hover:bg-slate-50',
                )}
              >
                <item.icon
                  className={cn(
                    'w-4 h-4 shrink-0 mt-0.5',
                    activeTool === item.id ? 'text-primary-600' : item.accent,
                  )}
                />
                <span className="min-w-0">
                  <span
                    className={cn(
                      'block text-sm leading-snug',
                      activeTool === item.id
                        ? 'text-primary-700 font-semibold'
                        : 'text-slate-700 font-medium',
                    )}
                  >
                    {t(item.labelKey)}
                  </span>
                  <span className="block text-2xs text-slate-400 leading-snug mt-0.5">
                    {t(item.descKey)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Compact picker for narrow screens */}
        <div className="lg:hidden w-full mb-4">
          <div className="grid grid-cols-2 gap-2">
            {AI_TOOLS.map(item => (
              <button
                key={item.id}
                onClick={() => select(item.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all text-start',
                  activeTool === item.id
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-surface text-slate-600 border-slate-200',
                )}
              >
                <item.icon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t(item.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <Panel />
        </div>
      </div>
    </div>
  )
}
