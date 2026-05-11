import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Edit2, User, Target, Wrench, Sparkles, Calendar, TrendingUp, AlertTriangle, RotateCcw, Trash2, Key, Eye, EyeOff, Check, Presentation } from 'lucide-react'
import { getStoredApiKey, setStoredApiKey } from '@/services/aiClientService'
import { getDataMode, setDataMode } from '@/data/mock-store'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useProfile } from '@/hooks/useProfile'
import { useI18n } from '@/hooks/useI18n'
import { useToastActions } from '@/hooks/useToast'
import { mockUser } from '@/data/mock-user'
import { mockStore } from '@/data/mock-store'

interface SettingsSectionProps {
  icon: React.ElementType
  title: string
  description?: string
  children: React.ReactNode
}

function SettingsSection({ icon: Icon, title, description, children }: SettingsSectionProps) {
  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
            {description && <p className="text-xs text-slate-400">{description}</p>}
          </div>
        </div>
        <Button variant="outline" size="sm" disabled>
          <Edit2 className="w-3.5 h-3.5" />
          Edit
        </Button>
      </div>
      <div className="space-y-3">{children}</div>
    </Card>
  )
}

function Field({ label, value }: { label: string; value: string | string[] }) {
  const v = Array.isArray(value) ? value.join(', ') : value
  return (
    <div>
      <p className="text-2xs font-semibold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-slate-700 leading-relaxed">{v || '—'}</p>
    </div>
  )
}

function DataModeSection() {
  const mode = getDataMode()
  const isDemo = mode === 'demo'

  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDemo ? 'bg-warning-100' : 'bg-primary-100'}`}>
            <Presentation className={`w-4 h-4 ${isDemo ? 'text-warning-700' : 'text-primary-600'}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Data mode</h3>
            <p className="text-xs text-slate-400">Switch to a demo workspace for presentations without touching your real data</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1 text-2xs font-semibold border rounded-full px-2 py-0.5 ${isDemo ? 'bg-warning-50 border-warning-200 text-warning-800' : 'bg-success-50 border-success-200 text-success-700'}`}>
          {isDemo ? 'Demo workspace' : 'Your real data'}
        </span>
      </div>

      <div className="space-y-3">
        <div className="text-xs text-slate-500 leading-relaxed">
          {isDemo ? (
            <>
              You're currently viewing the <strong>demo workspace</strong> — seeded sample applications, contacts, and tasks.
              Your real data is safely stored and untouched. Switch back any time.
            </>
          ) : (
            <>
              You're viewing <strong>your real data</strong>. Switch to demo mode to show off the app
              (to recruiters, friends, etc.) without exposing your real applications. Your real data stays saved.
            </>
          )}
        </div>

        <div className="flex gap-2">
          {isDemo ? (
            <Button onClick={() => setDataMode('real')} size="sm">
              <Eye className="w-3.5 h-3.5" /> Switch to my real data
            </Button>
          ) : (
            <Button onClick={() => setDataMode('demo')} variant="outline" size="sm">
              <Presentation className="w-3.5 h-3.5" /> Enter demo mode
            </Button>
          )}
        </div>

        <p className="text-2xs text-slate-400">
          Each mode keeps its own data in your browser. Switching reloads the page.
        </p>
      </div>
    </Card>
  )
}

function ApiKeySection() {
  const toast = useToastActions()
  const [value, setValue] = useState(() => getStoredApiKey())
  const [reveal, setReveal] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const stored = getStoredApiKey()
  const isConnected = stored.length > 0
  const masked = isConnected ? `${stored.slice(0, 7)}…${stored.slice(-4)}` : ''
  const hasChanges = value.trim() !== stored

  const handleSave = () => {
    setStoredApiKey(value)
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 1500)
    toast.success(value.trim() ? 'API key saved to this browser' : 'API key removed')
  }

  const handleClear = () => {
    setStoredApiKey('')
    setValue('')
    toast.info('API key removed')
  }

  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
            <Key className="w-4 h-4 text-primary-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Claude API key</h3>
            <p className="text-xs text-slate-400">Connect your own Anthropic key to enable live AI features</p>
          </div>
        </div>
        {isConnected && (
          <span className="inline-flex items-center gap-1 text-2xs font-semibold text-success-700 bg-success-50 border border-success-200 px-2 py-0.5 rounded-full">
            <Check className="w-3 h-3" /> Connected
          </span>
        )}
      </div>

      <div className="space-y-3">
        {isConnected && !hasChanges && (
          <div className="text-xs text-slate-500 font-mono bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            {masked}
          </div>
        )}

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={reveal ? 'text' : 'password'}
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="sk-ant-api03-..."
              className="w-full text-sm font-mono bg-white border border-slate-200 rounded-lg px-3 py-2 pe-9 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => setReveal(r => !r)}
              className="absolute end-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={reveal ? 'Hide key' : 'Show key'}
            >
              {reveal ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Button onClick={handleSave} disabled={!hasChanges} size="sm">
            {justSaved ? <><Check className="w-3.5 h-3.5" /> Saved</> : 'Save'}
          </Button>
          {isConnected && (
            <Button onClick={handleClear} variant="outline" size="sm">
              Clear
            </Button>
          )}
        </div>

        <div className="text-xs text-slate-500 space-y-1">
          <p>
            Get a key at{' '}
            <a
              href="https://console.anthropic.com/settings/keys"
              target="_blank"
              rel="noreferrer"
              className="text-primary-600 hover:underline font-medium"
            >
              console.anthropic.com
            </a>
            . Each AI action will charge your Anthropic account directly.
          </p>
          <p className="text-slate-400">
            🔒 Stored only in this browser's localStorage. Never sent anywhere except Anthropic's API.
          </p>
        </div>
      </div>
    </Card>
  )
}

export function SettingsPage() {
  const { profile } = useProfile()
  const { t } = useI18n()
  const toast = useToastActions()
  const qc = useQueryClient()
  const [clearOpen, setClearOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  const invalidateAll = () => qc.invalidateQueries()

  const handleClearAll = () => {
    mockStore.__clearAll()
    invalidateAll()
    toast.success('All data cleared. Start fresh — add your own applications, contacts, and CVs.')
    setClearOpen(false)
  }
  const handleReset = () => {
    mockStore.__resetAll()
    invalidateAll()
    toast.info('Reset to demo data')
    setResetOpen(false)
  }

  // Live profile data takes priority; fall back to mock persona for fields
  // not yet stored in the profiles table (degree, targetRoles, etc.).
  const displayName      = profile?.name          ?? mockUser.name
  const displayBio       = profile?.bio            ?? mockUser.bio
  const displayUniversity = profile?.university   ?? mockUser.university
  const displayYear      = profile?.year           ?? mockUser.year
  const displayUnit      = profile?.unit           ?? mockUser.unit
  const displaySkills    = profile?.skills?.length ? profile.skills : mockUser.skills
  const displayPitch     = profile?.defaultPitch   ?? mockUser.defaultPitch

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title={t('pages.settings.title')} description={t('pages.settings.subtitle')} />

      {/* Profile hero */}
      <Card className="mb-5">
        <div className="flex items-center gap-4">
          <Avatar name={displayName} size="xl" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">{displayName}</h2>
            <p className="text-sm text-slate-500">{mockUser.degree} · {displayUniversity}</p>
            <p className="text-sm text-slate-500">{mockUser.location}</p>
          </div>
          <Button variant="outline" size="sm" className="ms-auto" disabled>
            <Edit2 className="w-3.5 h-3.5" /> {t('pages.settings.editProfile')}
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        <SettingsSection icon={User} title={t('pages.settings.sections.background.title')} description={t('pages.settings.sections.background.desc')}>
          <Field label="University" value={`${displayUniversity} — Year ${displayYear}`} />
          <Field label="Degree" value={mockUser.degree} />
          <Field label="Military Service" value={displayUnit ?? '—'} />
          <Field label="Languages" value={mockUser.languages} />
          <Field label="Bio" value={displayBio} />
        </SettingsSection>

        <SettingsSection icon={Target} title={t('pages.settings.sections.preferredRoles.title')} description={t('pages.settings.sections.preferredRoles.desc')}>
          <Field label="Target Roles" value={mockUser.targetRoles} />
          <Field label="Target Industries" value={mockUser.targetIndustries} />
        </SettingsSection>

        <SettingsSection icon={Wrench} title={t('pages.settings.sections.skills.title')} description={t('pages.settings.sections.skills.desc')}>
          <div className="flex flex-wrap gap-1.5">
            {displaySkills.map(s => (
              <span key={s} className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full font-medium border border-primary-100 force-ltr">
                {s}
              </span>
            ))}
          </div>
        </SettingsSection>

        <SettingsSection icon={User} title={t('pages.settings.sections.defaultPitch.title')} description={t('pages.settings.sections.defaultPitch.desc')}>
          <p className="text-sm text-slate-700 leading-relaxed">{displayPitch}</p>
        </SettingsSection>

        <DataModeSection />

        <ApiKeySection />

        <SettingsSection icon={Sparkles} title={t('pages.settings.sections.aiPreferences.title')} description={t('pages.settings.sections.aiPreferences.desc')}>
          <Field label="Preferred tone" value="Professional, direct, authentic" />
          <Field label="Language" value="English" />
          <Field label="Answer length" value="Concise (2-4 paragraphs)" />
          <Field label="LP emphasis (Amazon)" value="Dive Deep, Deliver Results, Customer Obsession" />
        </SettingsSection>

        <SettingsSection icon={Calendar} title={t('pages.settings.sections.integrations.title')} description={t('pages.settings.sections.integrations.desc')}>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { name: 'Google Calendar' },
              { name: 'Gmail' },
              { name: 'LinkedIn' },
            ].map(integration => (
              <div key={integration.name} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-sm font-medium text-slate-700">{integration.name}</span>
                <span className="text-xs text-slate-400">{t('pages.settings.notYetAvailable')}</span>
              </div>
            ))}
          </div>
        </SettingsSection>

        <SettingsSection icon={TrendingUp} title={t('pages.settings.sections.careerGoals.title')} description={t('pages.settings.sections.careerGoals.desc')}>
          <Field label="6-month goal" value="Land a student role in product, data, or project management at a top Israeli tech company" />
          <Field label="Graduation goal" value="Full-time PM or DE role at a growth-stage tech company" />
          <Field label="Areas to develop" value="Product strategy, data modeling, stakeholder management, English business writing" />
        </SettingsSection>
      </div>

      {/* Danger zone — clear / reset all stored data */}
      <div className="mt-8 rounded-2xl border border-danger-200 bg-danger-50/40 p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-danger-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-danger-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Manage data</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Wipe demo / outdated data, or reset back to the seed examples.
            </p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setClearOpen(true)}
            className="flex items-start gap-3 p-3 rounded-xl bg-white border border-danger-200 hover:border-danger-300 hover:bg-danger-50 transition-colors text-start"
          >
            <Trash2 className="w-4 h-4 text-danger-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Start fresh — clear everything</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Removes every application, contact, task, CV, document, calendar event, and AI summary. The app starts empty.
              </p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setResetOpen(true)}
            className="flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors text-start"
          >
            <RotateCcw className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Reset to demo data</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Restores the bundled example applications and contacts so you can explore the UI again.
              </p>
            </div>
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={clearOpen}
        onClose={() => setClearOpen(false)}
        onConfirm={handleClearAll}
        title="Clear all data?"
        description="This permanently removes every application, contact, task, CV, document, and calendar event from local storage. There is no undo."
        confirmLabel="Yes, clear everything"
      />

      <ConfirmDialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={handleReset}
        title="Reset to demo data?"
        description="Anything you've added will be replaced with the original sample applications, contacts, and tasks."
        confirmLabel="Reset"
      />

      <p className="text-xs text-center text-slate-400 mt-8">
        {t('pages.settings.editProfileSoon')}
      </p>
    </div>
  )
}
