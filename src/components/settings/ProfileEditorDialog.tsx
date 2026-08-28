// ---------------------------------------------------------------------------
// InterviewFlow — ProfileEditorDialog.tsx
// The editor behind every "Edit" button on the Settings page.
//
// One dialog covers the whole profile rather than editing each card in place:
// the fields are interdependent (name feeds greetings, target roles and skills
// feed the AI prompts), so editing them together is how people actually think
// about it — and it keeps a single save path.
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { useToastActions } from '@/hooks/useToast'
import { profilesService } from '@/services/profilesService'
import { QK } from '@/lib/query-keys'
import type { UserProfile } from '@/types'

/** Comma-separated text <-> string[]. Empty entries are dropped. */
const toList = (s: string): string[] =>
  s.split(',').map(v => v.trim()).filter(Boolean)
const fromList = (a?: string[]): string => (a ?? []).join(', ')

interface Props {
  open: boolean
  onClose: () => void
  profile: UserProfile | null
}

export function ProfileEditorDialog({ open, onClose, profile }: Props) {
  const qc = useQueryClient()
  const toast = useToastActions()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    displayName: '', name: '', location: '',
    university: '', degree: '', year: '', unit: '',
    bio: '', linkedinUrl: '', githubUrl: '',
    targetRoles: '', targetIndustries: '', skills: '', languages: '',
    defaultPitch: '',
  })

  // Re-seed every time the dialog opens so a cancelled edit never leaks into
  // the next one.
  useEffect(() => {
    if (!open) return
    setError(null)
    setForm({
      displayName:      profile?.displayName ?? '',
      name:             profile?.name ?? '',
      location:         profile?.location ?? '',
      university:       profile?.university ?? '',
      degree:           profile?.degree ?? '',
      year:             profile?.year ? String(profile.year) : '',
      unit:             profile?.unit ?? '',
      bio:              profile?.bio ?? '',
      linkedinUrl:      profile?.linkedinUrl ?? '',
      githubUrl:        profile?.githubUrl ?? '',
      targetRoles:      fromList(profile?.targetRoles),
      targetIndustries: fromList(profile?.targetIndustries),
      skills:           fromList(profile?.skills),
      languages:        fromList(profile?.languages),
      defaultPitch:     profile?.defaultPitch ?? '',
    })
  }, [open, profile])

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = async () => {
    setError(null)

    const name = form.name.trim()
    if (name.length < 2) { setError('Your name needs at least 2 characters.'); return }

    const yearRaw = form.year.trim()
    const year = yearRaw === '' ? undefined : Number(yearRaw)
    if (year !== undefined && (!Number.isInteger(year) || year < 1 || year > 10)) {
      setError('Year of study should be a whole number between 1 and 10.')
      return
    }

    setSaving(true)
    try {
      await profilesService.updateProfile({
        name,
        displayName:      form.displayName.trim() || undefined,
        location:         form.location.trim(),
        university:       form.university.trim(),
        degree:           form.degree.trim(),
        ...(year !== undefined ? { year } : {}),
        unit:             form.unit.trim() || undefined,
        bio:              form.bio.trim(),
        linkedinUrl:      form.linkedinUrl.trim() || undefined,
        githubUrl:        form.githubUrl.trim() || undefined,
        targetRoles:      toList(form.targetRoles),
        targetIndustries: toList(form.targetIndustries),
        skills:           toList(form.skills),
        languages:        toList(form.languages),
        defaultPitch:     form.defaultPitch.trim() || undefined,
      })
      await qc.invalidateQueries({ queryKey: QK.profile.all() })
      toast.success('Profile updated.')
      onClose()
    } catch (err) {
      setError((err as Error).message || 'Could not save your profile.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="xl" title="Edit profile"
           description="This feeds your greeting, your CV matching, and every AI prompt.">
      <div className="max-h-[65vh] overflow-y-auto pr-1 space-y-5">

        <section className="space-y-3">
          <h4 className="text-2xs font-semibold text-slate-400 uppercase tracking-wide">Identity</h4>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Full name" value={form.name} onChange={set('name')} placeholder="Shay Silversmith" />
            <Input label="Greeting name" value={form.displayName} onChange={set('displayName')} placeholder="Shay" />
          </div>
          <Input label="Location" value={form.location} onChange={set('location')} placeholder="Tel Aviv, Israel" />
        </section>

        <section className="space-y-3">
          <h4 className="text-2xs font-semibold text-slate-400 uppercase tracking-wide">Background</h4>
          <div className="grid grid-cols-2 gap-3">
            <Input label="University" value={form.university} onChange={set('university')} />
            <Input label="Year of study" type="number" min={1} max={10} value={form.year} onChange={set('year')} />
          </div>
          <Input label="Degree" value={form.degree} onChange={set('degree')} />
          <Input label="Military service / unit" value={form.unit} onChange={set('unit')} />
          <Textarea label="Bio" rows={3} value={form.bio} onChange={set('bio')}
                    placeholder="A few lines on who you are and what you are good at." />
          <div className="grid grid-cols-2 gap-3">
            <Input label="LinkedIn URL" value={form.linkedinUrl} onChange={set('linkedinUrl')} placeholder="https://linkedin.com/in/…" />
            <Input label="GitHub URL" value={form.githubUrl} onChange={set('githubUrl')} placeholder="https://github.com/…" />
          </div>
        </section>

        <section className="space-y-3">
          <h4 className="text-2xs font-semibold text-slate-400 uppercase tracking-wide">What you are aiming at</h4>
          <Input label="Target roles" value={form.targetRoles} onChange={set('targetRoles')}
                 placeholder="Product Owner, Junior Product Manager" />
          <Input label="Target industries" value={form.targetIndustries} onChange={set('targetIndustries')}
                 placeholder="Cybersecurity, AI / ML" />
          <p className="text-2xs text-slate-400">Separate each one with a comma.</p>
        </section>

        <section className="space-y-3">
          <h4 className="text-2xs font-semibold text-slate-400 uppercase tracking-wide">Skills &amp; languages</h4>
          <Input label="Skills" value={form.skills} onChange={set('skills')} placeholder="SQL, Python, Product Discovery" />
          <Input label="Languages" value={form.languages} onChange={set('languages')} placeholder="Hebrew (Native), English (Advanced)" />
        </section>

        <section className="space-y-3">
          <h4 className="text-2xs font-semibold text-slate-400 uppercase tracking-wide">Default pitch</h4>
          <Textarea label="Tell me about yourself" rows={5} value={form.defaultPitch} onChange={set('defaultPitch')}
                    placeholder="The answer you would actually give in a first interview." />
        </section>
      </div>

      {error && (
        <p className="mt-3 text-xs text-danger-600 bg-danger-50 border border-danger-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
      </div>
    </Modal>
  )
}
