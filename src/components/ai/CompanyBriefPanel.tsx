// ---------------------------------------------------------------------------
// CompanyBriefPanel — research a company for an upcoming interview.
//
// The company can be picked from an existing application (which also fills the
// role, so the research is weighted toward the right team) or typed freely for
// a company not yet in the CRM.
//
// The briefing arrives as two halves fetched in parallel — profile and
// interview intel — because a deployed function gets about 60 seconds and one
// grounded call for the whole thing does not fit. Either half can come back
// alone; the panel renders what arrived and names what did not.
// ---------------------------------------------------------------------------
import { useState, useMemo } from 'react'
import { Building2, Sparkles, Save, Globe, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useMockStore } from '@/hooks/useMockStore'
import { useCandidate } from '@/hooks/useCandidate'
import { useToastActions } from '@/hooks/useToast'
import { useI18n } from '@/hooks/useI18n'
import { applicationsService } from '@/services/applicationsService'
import { companiesService } from '@/services/companiesService'
import { aiService, type AIRun, type CompanyBrief } from '@/services/aiService'
import { AIFailureNotice } from './AIFailureNotice'
import {
  Section, Prose, BulletList, ChipRow, CopyButton, SourceList,
  PanelEmpty, PanelLoading, ToolIntro,
} from './ResultBlocks'
import type { GroundingSource } from '@/services/aiClientService'

type RunState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done';  data: CompanyBrief; sources?: GroundingSource[] }
  | { status: 'error'; run: Extract<AIRun<never>, { ok: false }> }

function toPlainText(brief: CompanyBrief, company: string): string {
  const { profile: p, interview: i } = brief
  const block = (title: string, lines?: string[]) =>
    lines && lines.length ? `## ${title}\n${lines.map(l => `• ${l}`).join('\n')}\n` : ''

  return [
    `# ${company}`,
    p?.headline ?? '',
    '',
    p ? `## What they do\n${p.whatTheyDo}\n` : '',
    block('Products', p?.products),
    p?.businessModel ? `## Business model\n${p.businessModel}\n` : '',
    p?.customers     ? `## Customers\n${p.customers}\n` : '',
    p?.scale         ? `## Scale\n${p.scale}\n` : '',
    p?.recentNews?.length
      ? `## Recent news\n${p.recentNews
          .map(n => `• ${n.date} — ${n.item}${n.whyItMatters ? ` (${n.whyItMatters})` : ''}`)
          .join('\n')}\n`
      : '',
    block('Competitors', p?.competitors),
    block('Interview process', i?.interviewProcess),
    block('Talking points', i?.talkingPoints),
    block('Questions to ask', i?.questionsToAsk),
    block('Why you fit', i?.whyYouFit),
    block('Culture', i?.culture),
    block('Watch-outs', i?.watchOuts),
    p?.localPresence ? `## Local presence\n${p.localPresence}\n` : '',
    block('Tech stack', p?.techStack),
  ].filter(Boolean).join('\n')
}

export function CompanyBriefPanel() {
  const toast = useToastActions()
  const { t, locale } = useI18n()
  const { candidate } = useCandidate()
  const { data: applications } = useMockStore(() => applicationsService.list())
  const { data: companies }    = useMockStore(() => companiesService.list())

  const [selectedAppId, setSelectedAppId] = useState('')
  const [companyName,   setCompanyName]   = useState('')
  const [roleTitle,     setRoleTitle]     = useState('')
  const [extraUrl,      setExtraUrl]      = useState('')
  const [saving,        setSaving]        = useState(false)
  const [state,         setState]         = useState<RunState>({ status: 'idle' })

  const selectedApp = applications?.find(a => a.id === selectedAppId)

  const linkedCompanyId = useMemo(() => {
    if (selectedApp) return selectedApp.companyId
    const typed = companyName.trim().toLowerCase()
    if (!typed) return undefined
    return companies?.find(c => c.name.toLowerCase() === typed)?.id
  }, [selectedApp, companyName, companies])

  const handleAppSelect = (appId: string) => {
    setSelectedAppId(appId)
    const app = applications?.find(a => a.id === appId)
    if (app) {
      setCompanyName(app.companyName)
      setRoleTitle(app.roleName)
    }
  }

  const effectiveCompany = (selectedApp?.companyName ?? companyName).trim()
  const canRun = effectiveCompany.length > 1

  const handleGenerate = async () => {
    if (!canRun) return
    setState({ status: 'loading' })

    const urls: string[] = []
    if (extraUrl.trim()) urls.push(extraUrl.trim())
    const record = companies?.find(c => c.id === linkedCompanyId)
    if (record?.website)     urls.push(record.website)
    if (record?.linkedinUrl) urls.push(record.linkedinUrl)

    const res = await aiService.companyBrief({
      companyName: effectiveCompany,
      roleTitle:   roleTitle.trim() || undefined,
      urls:        urls.length ? urls.slice(0, 3) : undefined,
      candidate,
      locale:      locale as 'en' | 'he',
    })

    if (!res.ok) {
      setState({ status: 'error', run: res })
      return
    }
    setState({ status: 'done', data: res.data, sources: res.sources })
  }

  const handleSave = async () => {
    if (state.status !== 'done') return
    setSaving(true)
    try {
      await aiService.saveSummary(
        'Company Summary',
        { ...(state.data.profile ?? {}), ...(state.data.interview ?? {}) },
        {
          applicationId: selectedAppId || undefined,
          companyId:     linkedCompanyId,
          inputData:     { companyName: effectiveCompany, roleTitle },
        },
      )
      toast.success(`${t('ai.companyBrief.savedPrefix')} ${effectiveCompany}`)
    } catch {
      toast.error(t('ai.companyBrief.saveFailed'))
    }
    setSaving(false)
  }

  const profile   = state.status === 'done' ? state.data.profile   : null
  const interview = state.status === 'done' ? state.data.interview : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* ── Input ── */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center border bg-primary-50 border-primary-200 text-primary-700">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">{t('ai.companyBrief.title')}</h2>
            <p className="text-xs text-slate-500">{t('ai.companyBrief.subtitle')}</p>
          </div>
        </div>

        <div className="space-y-3">
          <ToolIntro
            what={t('ai.companyBrief.introWhat')}
            how={[
              t('ai.companyBrief.introStep1'),
              t('ai.companyBrief.introStep2'),
              t('ai.companyBrief.introStep3'),
            ]}
          />

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t('ai.companyBrief.fromApp')}
            </label>
            <select
              value={selectedAppId}
              onChange={e => handleAppSelect(e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-surface text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            >
              <option value="">{t('ai.companyBrief.fromAppPlaceholder')}</option>
              {(applications ?? []).map(app => (
                <option key={app.id} value={app.id}>
                  {app.roleName} @ {app.companyName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t('ai.companyBrief.companyLabel')}<span className="text-danger-500 ms-0.5">*</span>
            </label>
            <input
              value={companyName}
              onChange={e => { setCompanyName(e.target.value); setSelectedAppId('') }}
              placeholder="Wix, Mobileye, Deloitte…"
              className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-surface text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t('ai.companyBrief.roleLabel')}{' '}
              <span className="text-slate-400">({t('ai.jdParser.optional')})</span>
            </label>
            <input
              value={roleTitle}
              onChange={e => setRoleTitle(e.target.value)}
              placeholder="Product Owner"
              className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-surface text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {t('ai.companyBrief.urlLabel')}{' '}
              <span className="text-slate-400">({t('ai.jdParser.optional')})</span>
            </label>
            <div className="relative">
              <Globe className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                value={extraUrl}
                onChange={e => setExtraUrl(e.target.value)}
                dir="ltr"
                placeholder="https://company.com/about"
                className="w-full h-9 ps-9 pe-3 rounded-lg border border-slate-200 bg-surface text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100">
          <Button
            className="w-full"
            onClick={handleGenerate}
            loading={state.status === 'loading'}
            disabled={!canRun}
          >
            <Sparkles className="w-4 h-4" />
            {state.status === 'loading'
              ? t('ai.companyBrief.researching')
              : t('ai.companyBrief.button')}
          </Button>
        </div>
      </Card>

      {/* ── Output ── */}
      <Card className="flex flex-col">
        {state.status === 'idle' && (
          <PanelEmpty
            icon={Building2}
            title={t('ai.companyBrief.emptyTitle')}
            sub={t('ai.companyBrief.emptySub')}
          />
        )}

        {state.status === 'loading' && (
          <PanelLoading
            label={t('ai.companyBrief.loadingLabel')}
            sub={t('ai.companyBrief.loadingSub')}
          />
        )}

        {state.status === 'error' && (
          <AIFailureNotice
            reason={state.run.reason}
            message={state.run.message}
            onRetry={handleGenerate}
          />
        )}

        {state.status === 'done' && (
          <div className="flex flex-col gap-4 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p dir="auto" className="text-sm font-semibold text-slate-800 leading-snug">
                {profile?.headline ?? effectiveCompany}
              </p>
              <CopyButton
                text={toPlainText(state.data, effectiveCompany)}
                label={t('ai.copyAll')}
                className="shrink-0"
              />
            </div>

            {/* One half missing is still a usable brief — say which one. */}
            {state.data.partial && (
              <div className="flex items-start gap-2 rounded-lg border border-warning-200 bg-warning-50 px-3 py-2 text-xs text-warning-900">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                <div className="space-y-1">
                  <p>
                    {state.data.partial.half === 'profile'
                      ? t('ai.companyBrief.partialProfile')
                      : t('ai.companyBrief.partialInterview')}
                  </p>
                  <button onClick={handleGenerate} className="font-medium underline hover:no-underline">
                    {t('ai.companyBrief.retryMissing')}
                  </button>
                </div>
              </div>
            )}

            {profile?.disambiguation && (
              <div className="rounded-lg border border-warning-200 bg-warning-50 px-3 py-2 text-xs text-warning-900">
                {profile.disambiguation}
              </div>
            )}

            <div className="flex-1 overflow-auto space-y-4 pe-1">
              {profile && (
                <>
                  <Section title={t('ai.companyBrief.s.whatTheyDo')}>
                    <Prose>{profile.whatTheyDo}</Prose>
                  </Section>

                  <BulletList title={t('ai.companyBrief.s.products')} items={profile.products} />

                  {profile.businessModel && (
                    <Section title={t('ai.companyBrief.s.businessModel')}>
                      <Prose>{profile.businessModel}</Prose>
                    </Section>
                  )}
                  {profile.customers && (
                    <Section title={t('ai.companyBrief.s.customers')}>
                      <Prose>{profile.customers}</Prose>
                    </Section>
                  )}
                  {profile.scale && (
                    <Section title={t('ai.companyBrief.s.scale')}>
                      <Prose>{profile.scale}</Prose>
                    </Section>
                  )}

                  {profile.recentNews.length > 0 && (
                    <Section
                      title={t('ai.companyBrief.s.recentNews')}
                      hint={t('ai.companyBrief.s.recentNewsHint')}
                    >
                      <ul className="space-y-2">
                        {profile.recentNews.map((n, idx) => (
                          <li key={idx} className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xs font-bold text-primary-600 shrink-0">{n.date}</span>
                              <span dir="auto" className="text-sm text-slate-700 leading-relaxed">{n.item}</span>
                            </div>
                            {n.whyItMatters && (
                              <p dir="auto" className="text-2xs text-slate-500 mt-1">{n.whyItMatters}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </Section>
                  )}
                </>
              )}

              {interview && (
                <>
                  <BulletList
                    title={t('ai.companyBrief.s.interviewProcess')}
                    items={interview.interviewProcess}
                  />
                  <BulletList title={t('ai.companyBrief.s.talkingPoints')}  items={interview.talkingPoints} />
                  <BulletList title={t('ai.companyBrief.s.questionsToAsk')} items={interview.questionsToAsk} />
                  <BulletList title={t('ai.companyBrief.s.whyYouFit')}      items={interview.whyYouFit} />
                  <BulletList title={t('ai.companyBrief.s.culture')}        items={interview.culture} />
                  <BulletList title={t('ai.companyBrief.s.watchOuts')}      items={interview.watchOuts} />
                </>
              )}

              {profile && (
                <>
                  <BulletList title={t('ai.companyBrief.s.competitors')} items={profile.competitors} />
                  {profile.localPresence && (
                    <Section title={t('ai.companyBrief.s.localPresence')}>
                      <Prose>{profile.localPresence}</Prose>
                    </Section>
                  )}
                  <ChipRow title={t('ai.companyBrief.s.techStack')} items={profile.techStack} />
                </>
              )}

              <SourceList sources={state.sources} />
            </div>

            <div className="pt-3 border-t border-slate-100">
              <Button className="w-full" variant="outline" onClick={handleSave} loading={saving}>
                <Save className="w-4 h-4" />
                {t('ai.companyBrief.save')}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
