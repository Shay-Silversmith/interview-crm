import { Edit2, User, Target, Wrench, Sparkles, Calendar, TrendingUp } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
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
  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader title="Settings & Profile" description="Manage your background, preferences, and integrations" />

      {/* Profile hero */}
      <Card className="mb-5">
        <div className="flex items-center gap-4">
          <Avatar name={mockUser.name} size="xl" />
          <div>
            <h2 className="text-lg font-bold text-slate-900">{mockUser.name}</h2>
            <p className="text-sm text-slate-500">{mockUser.degree} · {mockUser.university}</p>
            <p className="text-sm text-slate-500">{mockUser.location}</p>
          </div>
          <Button variant="outline" size="sm" className="ml-auto" disabled>
            <Edit2 className="w-3.5 h-3.5" /> Edit Profile
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        <SettingsSection icon={User} title="My Background" description="Your academic and professional context">
          <Field label="University" value={`${mockUser.university} — Year ${mockUser.year}`} />
          <Field label="Degree" value={mockUser.degree} />
          <Field label="Military Service" value={mockUser.unit ?? '—'} />
          <Field label="Languages" value={mockUser.languages} />
          <Field label="Bio" value={mockUser.bio} />
        </SettingsSection>

        <SettingsSection icon={Target} title="Preferred Roles" description="What you're targeting this job search cycle">
          <Field label="Target Roles" value={mockUser.targetRoles} />
          <Field label="Target Industries" value={mockUser.targetIndustries} />
        </SettingsSection>

        <SettingsSection icon={Wrench} title="Skills" description="Technical and soft skills used for fit scoring and AI">
          <div className="flex flex-wrap gap-1.5">
            {mockUser.skills.map(s => (
              <span key={s} className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full font-medium border border-primary-100">
                {s}
              </span>
            ))}
          </div>
        </SettingsSection>

        <SettingsSection icon={User} title="Default Personal Pitch" description="Your default intro answer, used by AI generators">
          <p className="text-sm text-slate-700 leading-relaxed">{mockUser.defaultPitch}</p>
        </SettingsSection>

        <SettingsSection icon={Sparkles} title="AI Preferences" description="How InterviewFlow's AI should tailor its outputs">
          <Field label="Preferred tone" value="Professional, direct, authentic" />
          <Field label="Language" value="English" />
          <Field label="Answer length" value="Concise (2-4 paragraphs)" />
          <Field label="LP emphasis (Amazon)" value="Dive Deep, Deliver Results, Customer Obsession" />
        </SettingsSection>

        <SettingsSection icon={Calendar} title="Integrations" description="Connect external services">
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { name: 'Google Calendar', status: 'Coming in Phase 6' },
              { name: 'Gmail', status: 'Coming in Phase 6' },
              { name: 'LinkedIn', status: 'Coming in Phase 6' },
              { name: 'Supabase Auth', status: 'Coming in Phase 4' },
            ].map(integration => (
              <div key={integration.name} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-sm font-medium text-slate-700">{integration.name}</span>
                <span className="text-xs text-slate-400">{integration.status}</span>
              </div>
            ))}
          </div>
        </SettingsSection>

        <SettingsSection icon={TrendingUp} title="Career Goals" description="Long-term targets that inform your AI coaching">
          <Field label="6-month goal" value="Land a student role in product, data, or project management at a top Israeli tech company" />
          <Field label="Graduation goal" value="Full-time PM or DE role at a growth-stage tech company" />
          <Field label="Areas to develop" value="Product strategy, data modeling, stakeholder management, English business writing" />
        </SettingsSection>
      </div>

      <p className="text-xs text-center text-slate-400 mt-8">
        Full profile editing coming in Phase 5. All fields are read-only in Phase 1.
      </p>
    </div>
  )
}
