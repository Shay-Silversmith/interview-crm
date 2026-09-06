// ---------------------------------------------------------------------------
// JobDescriptionEditor — the two ways a JD gets into an application: pasted, or
// read off the posting link.
//
// Both ways existed only on the new-application form, which meant an
// application saved without a JD could never get one. Shared so the drawer and
// the JD tab cannot drift on which routes they call or what "the link came back
// empty" is allowed to overwrite.
// ---------------------------------------------------------------------------

import { useState } from 'react'
import { Link2, Sparkles } from 'lucide-react'
import { TextField, TextareaField } from '@/components/forms/Field'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/hooks/useI18n'
import { useToastActions } from '@/hooks/useToast'
import { aiService } from '@/services/aiService'

interface JobDescriptionEditorProps {
  value:        string
  onChange:     (value: string) => void
  /** Posting link to read from. Editable in place when `onUrlChange` is given. */
  url:          string
  onUrlChange?: (url: string) => void
  rows?:        number
  /** Extra fields the posting stated, for callers that can store them. */
  onFilled?:    (data: { roleName?: string; location?: string }) => void
}

export function JobDescriptionEditor({
  value,
  onChange,
  url,
  onUrlChange,
  rows = 10,
  onFilled,
}: JobDescriptionEditorProps) {
  const { t, locale } = useI18n()
  const toast = useToastActions()
  const [fetching, setFetching] = useState(false)

  async function handleFetch() {
    const link = url.trim()
    if (!link) { toast.error(t('forms.autofill.needUrl')); return }

    setFetching(true)
    const res = await aiService.fillApplication({ jdUrl: link, locale: locale as 'en' | 'he' })
    setFetching(false)

    if (!res.ok) { toast.error(res.message); return }
    const d = res.data

    // Career sites that refuse automated fetching come back "successful" with
    // nothing in them. Saying so beats silently leaving the box empty.
    if (d.sourceNote) { toast.error(d.sourceNote); return }
    if (!d.jobDescription?.trim()) { toast.error(t('forms.jd.linkEmpty')); return }

    // What is already typed is a decision; the posting only fills a blank.
    if (value.trim()) {
      toast.error(t('forms.jd.alreadyHasText'))
      return
    }

    onChange(d.jobDescription)
    onFilled?.({ roleName: d.roleName ?? undefined, location: d.location ?? undefined })
    toast.success(t('forms.autofill.filled'))
  }

  return (
    <div className="space-y-3">
      {onUrlChange && (
        <TextField
          label={t('forms.fields.jobPostingUrl')}
          type="url"
          placeholder="https://…"
          value={url}
          onChange={e => onUrlChange(e.target.value)}
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleFetch}
          disabled={fetching || !url.trim()}
          loading={fetching}
        >
          <Link2 className="w-3.5 h-3.5" />
          {fetching ? t('forms.autofill.working') : t('forms.jd.fetchFromLink')}
        </Button>
        <span className="text-2xs text-slate-400 inline-flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          {t('forms.jd.fetchHint')}
        </span>
      </div>

      <TextareaField
        label={t('forms.fields.jobDescription')}
        placeholder={t('forms.jd.pastePlaceholder')}
        rows={rows}
        className="min-h-[160px] force-ltr"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}
