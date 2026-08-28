import { useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Edit2, User, Target, Wrench, Sparkles, Calendar, TrendingUp, AlertTriangle, Trash2, Key, Eye, EyeOff, Check, Presentation, Download, Upload, Database, LogOut } from 'lucide-react'
import { getStoredApiKey, setStoredApiKey } from '@/services/aiClientService'
import { getDataMode, setDataMode, exportData, parseImportFile, importData } from '@/data/mock-store'
import type { BackupPayload } from '@/data/mock-store'
import { isSupabaseMode } from '@/lib/env'
import { useIsAdmin } from '@/lib/admin'
import { startFresh } from '@/services/dataResetService'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useProfile } from '@/hooks/useProfile'
import { ProfileEditorDialog } from '@/components/settings/ProfileEditorDialog'
import { useUser } from '@/hooks/useUser'
import { useI18n } from '@/hooks/useI18n'
import { useToastActions } from '@/hooks/useToast'
import { mockUser } from '@/data/mock-user'

interface SettingsSectionProps {
  icon: React.ElementType
  title: string
  description?: string
  /** Omit to keep the section read-only (demo mode, or mock mode with no backend). */
  onEdit?: () => void
  children: React.ReactNode
}

function SettingsSection({ icon: Icon, title, description, onEdit, children }: SettingsSectionProps) {
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

function BackupSection() {
  const toast  = useToastActions()
  const qc     = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [importOpen,    setImportOpen]    = useState(false)
  const [importWarning, setImportWarning] = useState<string | null>(null)
  const [pending,       setPending]       = useState<BackupPayload | null>(null)

  const handleExport = () => {
    try {
      exportData()
      const mode = getDataMode()
      toast.success(`Backup downloaded${mode === 'demo' ? ' (demo workspace)' : ''}`)
    } catch {
      toast.error('Export failed — could not generate backup file.')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const json = ev.target?.result
      if (typeof json !== 'string') return
      const result = parseImportFile(json)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setPending(result.payload)
      setImportWarning(
        result.payload.dataMode === 'demo'
          ? 'This backup was exported from the demo workspace. It will be imported into your real workspace.'
          : null
      )
      setImportOpen(true)
    }
    reader.onerror = () => toast.error('Could not read file.')
    reader.readAsText(file)
    e.target.value = ''
  }

  const handleImportConfirm = () => {
    if (!pending) return
    importData(pending)   // writes to real namespace then reloads page
    qc.invalidateQueries()
    setImportOpen(false)
  }

  const currentMode = getDataMode()

  return (
    <Card>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
          <Database className="w-4 h-4 text-primary-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Backup & Restore</h3>
          <p className="text-xs text-slate-400">Download your data as JSON, or restore from a previous backup</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-slate-500 leading-relaxed">
          The export includes all applications, companies, contacts, tasks, calendar events, CVs, documents, and prep notes.
          API keys are not included.
        </p>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-3.5 h-3.5" />
            Export backup
          </Button>
          <Button onClick={() => fileRef.current?.click()} variant="outline" size="sm">
            <Upload className="w-3.5 h-3.5" />
            Import backup
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="sr-only"
            onChange={handleFileChange}
          />
        </div>

        <p className="text-2xs text-slate-400">
          Export saves from the <strong>{currentMode === 'demo' ? 'demo' : 'real'} workspace</strong>.
          Import always restores into your <strong>real workspace</strong>.
        </p>
      </div>

      <ConfirmDialog
        open={importOpen}
        onClose={() => { setImportOpen(false); setPending(null) }}
        onConfirm={handleImportConfirm}
        title="Restore from backup?"
        description={`This will replace your current real workspace data with the selected backup. This cannot be undone.${importWarning ? ` Note: ${importWarning}` : ''}`}
        confirmLabel="Yes, restore"
      />
    </Card>
  )
}

export function SettingsPage() {
  const { profile } = useProfile()
  const { user, signOut } = useUser()
  const { t } = useI18n()
  const toast = useToastActions()
  const qc = useQueryClient()
  const isAdmin = useIsAdmin()
  const [editorOpen, setEditorOpen]     = useState(false)
  const [clearOpen, setClearOpen]       = useState(false)
  const [clearConfirm, setClearConfirm] = useState('')
  const [clearBusy, setClearBusy]       = useState(false)

  const dataMode      = getDataMode()
  const invalidateAll = () => qc.invalidateQueries()

  const handleStartFresh = async () => {
    if (clearConfirm.trim().toUpperCase() !== 'DELETE') return
    setClearBusy(true)
    try {
      await startFresh()
      invalidateAll()
      toast.success(dataMode === 'demo' ? 'Demo workspace cleared.' : 'All your data has been deleted.')
      setClearOpen(false)
      setClearConfirm('')
    } catch (err) {
      toast.error((err as Error).message || 'Failed to clear data.')
    } finally {
      setClearBusy(false)
    }
  }
  const handleSignOut = async () => {
    await signOut()
    toast.info('Signed out')
  }

  // In demo mode: always show the generic demo persona.
  // In real mode: prefer live profile data, fall back to auth email, then generic placeholder.
  const isDemo = dataMode === 'demo'
  // Editing writes through profilesService, which only persists in Supabase mode.
  // The demo persona is deliberately fixed, so it stays read-only too.
  const canEdit = isSupabaseMode() && !isDemo
  const openEditor = canEdit ? () => setEditorOpen(true) : undefined
  // Real (non-demo) users: prefer live profile data, fall back to empty/placeholder.
  // Never fall back to mockUser for a signed-in real user (see Prompt 4 for editor).
  const NS = '(not set)'
  const displayName       = isDemo ? mockUser.name       : (profile?.displayName ?? profile?.name ?? user?.email?.split('@')[0] ?? 'Your Profile')
  const displayBio        = isDemo ? mockUser.bio        : (profile?.bio || NS)
  const displayUniversity = isDemo ? mockUser.university : (profile?.university || NS)
  const displayYear       = isDemo ? mockUser.year       : (profile?.year || 0)
  const displayUnit       = isDemo ? mockUser.unit       : (profile?.unit ?? NS)
  const displaySkills     = isDemo ? mockUser.skills     : (profile?.skills?.length ? profile.skills : [])
  const displayPitch      = isDemo ? mockUser.defaultPitch : (profile?.defaultPitch || NS)
  const displayDegree     = isDemo ? mockUser.degree     : (profile?.degree || NS)
  const displayLocation   = isDemo ? mockUser.location   : (profile?.location || NS)

  return (
    <div className="max-w-3xl mx-auto">
      <ProfileEditorDialog open={editorOpen} onClose={() => setEditorOpen(false)} profile={profile} />
      <PageHeader title={t('pages.settings.title')} description={t('pages.settings.subtitle')} />

      {/* Profile hero */}
      <Card className="mb-5">
        <div className="flex items-center gap-4">
          <Avatar name={displayName} size="xl" />
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-900">{displayName}</h2>
            <p className="text-sm text-slate-500">{displayDegree} · {displayUniversity}</p>
            <p className="text-sm text-slate-500">{displayLocation}</p>
            {isSupabaseMode() && user?.email && (
              <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
            )}
          </div>
          <div className="ms-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={openEditor} disabled={!canEdit}>
              <Edit2 className="w-3.5 h-3.5" /> {t('pages.settings.editProfile')}
            </Button>
            {isSupabaseMode() && (
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="w-3.5 h-3.5" /> Sign out
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <SettingsSection icon={User} title={t('pages.settings.sections.background.title')} description={t('pages.settings.sections.background.desc')} onEdit={openEditor}>
          <Field label="University" value={`${displayUniversity} — Year ${displayYear}`} />
          <Field label="Degree" value={displayDegree} />
          <Field label="Military Service" value={displayUnit ?? '—'} />
          <Field label="Languages" value={isDemo ? mockUser.languages : (profile?.languages?.length ? profile.languages : [])} />
          <Field label="Bio" value={displayBio} />
        </SettingsSection>

        <SettingsSection icon={Target} title={t('pages.settings.sections.preferredRoles.title')} description={t('pages.settings.sections.preferredRoles.desc')} onEdit={openEditor}>
          <Field label="Target Roles" value={isDemo ? mockUser.targetRoles : (profile?.targetRoles?.length ? profile.targetRoles : [])} />
          <Field label="Target Industries" value={isDemo ? mockUser.targetIndustries : (profile?.targetIndustries?.length ? profile.targetIndustries : [])} />
        </SettingsSection>

        <SettingsSection icon={Wrench} title={t('pages.settings.sections.skills.title')} description={t('pages.settings.sections.skills.desc')} onEdit={openEditor}>
          <div className="flex flex-wrap gap-1.5">
            {displaySkills.map(s => (
              <span key={s} className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full font-medium border border-primary-100 force-ltr">
                {s}
              </span>
            ))}
          </div>
        </SettingsSection>

        <SettingsSection icon={User} title={t('pages.settings.sections.defaultPitch.title')} description={t('pages.settings.sections.defaultPitch.desc')} onEdit={openEditor}>
          <p className="text-sm text-slate-700 leading-relaxed">{displayPitch}</p>
        </SettingsSection>

        {isAdmin && <DataModeSection />}

        <BackupSection />

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

      {/* Manage data — Start fresh (only option). Requires typing DELETE. */}
      <div className="mt-8 rounded-2xl border border-danger-200 bg-danger-50/40 p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-danger-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-danger-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Manage data</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Permanently delete all of your data — applications, companies, contacts, tasks, calendar events,
              CVs, documents, and prep notes. Your account and profile stay. Export a backup first if needed.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => { setClearOpen(true); setClearConfirm('') }}
          className="flex items-start gap-3 p-3 w-full rounded-xl bg-white border border-danger-200 hover:border-danger-300 hover:bg-danger-50 transition-colors text-start"
        >
          <Trash2 className="w-4 h-4 text-danger-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-900">Start fresh — clear everything</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Removes every row owned by your account. You will need to type <strong>DELETE</strong> to confirm.
            </p>
          </div>
        </button>
      </div>

      {/* Typed-confirm dialog for Start fresh. */}
      {clearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Delete all your data?</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              This is permanent. Every application, company, contact, task, calendar event, CV, document,
              and prep note owned by your account will be deleted. Your account and profile stay.
            </p>
            <p className="text-sm text-slate-700">
              Type <strong className="font-mono">DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              value={clearConfirm}
              onChange={e => setClearConfirm(e.target.value)}
              placeholder="DELETE"
              autoFocus
              className="w-full h-9 px-3 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-danger-500/30 focus:border-danger-400"
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => { setClearOpen(false); setClearConfirm('') }} disabled={clearBusy}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleStartFresh}
                disabled={clearConfirm.trim().toUpperCase() !== 'DELETE' || clearBusy}
                className="bg-danger-600 hover:bg-danger-700"
              >
                {clearBusy ? 'Deleting…' : 'Yes, delete everything'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
