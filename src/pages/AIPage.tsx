import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Sparkles, Building2, FileSearch, Brain, MessageSquarePlus, User, Copy, Check, Bookmark, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useMockStore } from '@/hooks/useMockStore'
import { aiService } from '@/services/aiService'
import { cn } from '@/lib/cn'
import type { AIToolType } from '@/lib/enums'

interface AITool {
  id: string
  type: AIToolType
  label: string
  description: string
  icon: React.ElementType
  color: string
  fields: { id: string; label: string; placeholder: string; multiline?: boolean }[]
}

const AI_TOOLS: AITool[] = [
  {
    id: 'company-summary',
    type: 'Company Summary',
    label: 'Company Summary',
    description: 'Get AI insights on a company: culture, recent news, fit assessment, and interview tips.',
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
    label: 'JD Parser',
    description: 'Paste a job description to extract must-have skills, culture signals, and interview focus areas.',
    icon: FileSearch,
    color: 'bg-violet-50 border-violet-200 text-violet-700',
    fields: [
      { id: 'jobDescription', label: 'Job Description', placeholder: 'Paste the full job description here…', multiline: true },
    ],
  },
  {
    id: 'prepare-me',
    type: 'Prepare Me',
    label: 'Prepare Me For This Interview',
    description: 'Get a personalized prep plan: likely topics, practice questions, and study schedule.',
    icon: Brain,
    color: 'bg-warning-50 border-warning-200 text-warning-700',
    fields: [
      { id: 'company', label: 'Company', placeholder: 'e.g. Amazon' },
      { id: 'role', label: 'Role', placeholder: 'e.g. Data Engineer Intern' },
      { id: 'interviewType', label: 'Interview Type', placeholder: 'e.g. Technical, HR, System Design' },
      { id: 'interviewDate', label: 'Interview Date', placeholder: 'e.g. 2026-05-08' },
    ],
  },
  {
    id: 'interview-summary',
    type: 'Interview Summary',
    label: 'Interview Summary',
    description: 'Summarize a completed interview: key moments, what worked, what to improve.',
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
    label: 'Follow-up Message',
    description: 'Draft a professional follow-up email tailored to your contact and context.',
    icon: MessageSquarePlus,
    color: 'bg-slate-50 border-slate-200 text-slate-700',
    fields: [
      { id: 'recipientName', label: 'Recipient Name', placeholder: 'e.g. Lihi Shachar' },
      { id: 'company', label: 'Company', placeholder: 'e.g. Wix' },
      { id: 'occasion', label: 'Occasion', placeholder: 'e.g. After submitting home assignment' },
      { id: 'tone', label: 'Tone', placeholder: 'e.g. Professional, warm' },
    ],
  },
  {
    id: 'personalized',
    type: 'Personalized Answer',
    label: 'Personalized Answer',
    description: 'Generate a tailored STAR answer for any interview question, grounded in your background.',
    icon: User,
    color: 'bg-danger-50 border-danger-200 text-danger-700',
    fields: [
      { id: 'question', label: 'Interview Question', placeholder: 'e.g. Tell me about a time you delivered results under pressure' },
      { id: 'company', label: 'Company', placeholder: 'e.g. Amazon' },
      { id: 'context', label: 'Additional Context', placeholder: 'Any specific focus area or LP to highlight…', multiline: true },
    ],
  },
]

function sectionLabel(key: string) {
  return key.replace(/([A-Z])/g, ' $1').trim().replace(/^./, c => c.toUpperCase())
}

function renderValue(value: string) {
  // Render **bold** as <strong>
  const parts = value.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-slate-800">{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

export function AIPage() {
  const [searchParams] = useSearchParams()
  const initialToolId = searchParams.get('tool') ?? 'company-summary'
  const [activeTool, setActiveTool] = useState<string>(
    AI_TOOLS.find(t => t.id === initialToolId)?.id ?? 'company-summary'
  )
  const [copied, setCopied] = useState(false)
  const { data: summaries } = useMockStore(() => aiService.list())

  function copyOutput(outputData: Record<string, string>) {
    const text = Object.entries(outputData)
      .map(([k, v]) => `${sectionLabel(k)}\n${v}`)
      .join('\n\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const tool = AI_TOOLS.find(t => t.id === activeTool) ?? AI_TOOLS[0]
  const mockedOutput = summaries?.find(s => s.toolType === tool.type)

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="AI Tools"
        description="Six generators to power your job search"
      />

      <div className="flex gap-4">
        {/* Tool selector - left rail */}
        <div className="w-56 shrink-0 hidden md:block">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-2 sticky top-4">
            {AI_TOOLS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTool(t.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-sm transition-colors',
                  activeTool === t.id
                    ? 'bg-primary-50 text-primary-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 font-medium'
                )}
              >
                <t.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Mobile tool selector */}
        <div className="md:hidden w-full mb-4">
          <div className="grid grid-cols-2 gap-2">
            {AI_TOOLS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTool(t.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all',
                  activeTool === t.id
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-slate-600 border-slate-200'
                )}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main panel */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Input form */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border', tool.color)}>
                <tool.icon className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-800">{tool.label}</h2>
                <p className="text-xs text-slate-500">{tool.description}</p>
              </div>
            </div>

            <div className="space-y-4">
              {tool.fields.map(field => (
                field.multiline ? (
                  <Textarea
                    key={field.id}
                    label={field.label}
                    placeholder={field.placeholder}
                    rows={5}
                  />
                ) : (
                  <Input
                    key={field.id}
                    label={field.label}
                    placeholder={field.placeholder}
                  />
                )
              ))}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <Button className="w-full" disabled>
                <Sparkles className="w-4 h-4" />
                Generate with AI
                <span className="text-xs opacity-60 ml-1">(Phase 7)</span>
              </Button>
              <p className="text-xs text-center text-slate-400 mt-2">
                Real AI generation coming in Phase 7. Mocked output shown below.
              </p>
            </div>
          </Card>

          {/* Output panel */}
          <Card className="relative flex flex-col">
            {/* Mock banner */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 mb-4 shrink-0">
              <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
              <p className="text-2xs text-amber-700 font-semibold uppercase tracking-wide">
                Mocked output · Real AI generation in Phase 7
              </p>
            </div>

            {mockedOutput ? (
              <div className="flex flex-col gap-3 flex-1">
                {Object.entries(mockedOutput.outputData).map(([key, value]) => (
                  <div key={key} className="rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-3">
                    <p className="text-2xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                      {sectionLabel(key)}
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {renderValue(value)}
                    </p>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 mt-auto shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyOutput(mockedOutput.outputData as Record<string, string>)}
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-success-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy All'}
                  </Button>
                  <Button variant="ghost" size="sm" disabled>
                    <Bookmark className="w-3.5 h-3.5" />
                    Save to Application
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 min-h-64 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5 text-slate-300" strokeWidth={1.5} />
                </div>
                <p className="text-sm font-medium text-slate-400">Output will appear here</p>
                <p className="text-xs text-slate-300 mt-1">Fill in the form and click Generate</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
