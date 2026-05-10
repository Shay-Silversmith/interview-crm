import { Edit2, User, Target, Wrench, Sparkles, Calendar, TrendingUp } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { useProfile } from '@/hooks/useProfile'
import { useI18n } from '@/hooks/useI18n'
import { mockUser } from '@/data/mock-user'

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

export function SettingsPage() {
  const { profile } = useProfile()
  const { t } = useI18n()

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

      <p className="text-xs text-center text-slate-400 mt-8">
        {t('pages.settings.editProfileSoon')}
      </p>
    </div>
  )
}
