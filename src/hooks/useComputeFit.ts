// ---------------------------------------------------------------------------
// InterviewFlow — useComputeFit.ts
// Runs the role analysis and turns it into a fit score.
//
// Shared because the score is wanted in two places — while filling the form and
// later from the application itself — and a second copy of this would be a
// second place for the persist step or the CV selection to drift.
// ---------------------------------------------------------------------------

import { useState } from 'react'
import { useI18n } from '@/hooks/useI18n'
import { useCandidate } from '@/hooks/useCandidate'
import { useToastActions } from '@/hooks/useToast'
import { aiService } from '@/services/aiService'
import { applicationsService } from '@/services/applicationsService'
import { computeFit, type FitBreakdown } from '@/lib/fitScore'

export interface ComputeFitInput {
  /** Saved application to write the analysis back to. Omit for an unsaved one. */
  applicationId?: string
  /** The CV to judge against; falls back to the active one. */
  cvId?:          string
  jobDescription?: string
  jobUrl?:        string
  roleName?:      string
  companyName?:   string
}

export interface ComputeFitResult {
  fit: FitBreakdown
  /** The Role Analysis behind the score, for callers that can store it. */
  analysis: Record<string, unknown>
}

export interface UseComputeFitResult {
  run:     (input: ComputeFitInput) => Promise<ComputeFitResult | null>
  scoring: boolean
}

export function useComputeFit(cvId?: string): UseComputeFitResult {
  const { t, locale } = useI18n()
  const toast = useToastActions()
  const { candidate } = useCandidate(cvId)
  const [scoring, setScoring] = useState(false)

  const run = async (input: ComputeFitInput): Promise<ComputeFitResult | null> => {
    const jd  = (input.jobDescription ?? '').trim()
    const url = (input.jobUrl ?? '').trim()

    // Pasted text is both cheaper and more reliable than fetching, so it wins
    // when both are present.
    const hasText = jd.length > 20
    if (!hasText && !url) {
      toast.error(t('forms.fields.fitNeedsJd'))
      return null
    }

    setScoring(true)
    const res = await aiService.parseJD({
      jdText:      hasText ? jd : undefined,
      jdUrl:       hasText ? undefined : url,
      roleTitle:   input.roleName?.trim() || undefined,
      companyName: input.companyName?.trim() || undefined,
      candidate,
      locale:      locale as 'en' | 'he',
    })
    setScoring(false)

    if (!res.ok) { toast.error(res.message); return null }

    const computed = computeFit(res.data.fitAnalysis)
    if (!computed) { toast.error(t('forms.fields.fitNoRequirements')); return null }

    if (input.applicationId) {
      try {
        await applicationsService.update(input.applicationId, {
          aiRoleSummary: res.data as unknown as Record<string, unknown>,
          fitScore:      computed.score,
        })
      } catch {
        // The score is already computed and about to be shown; failing to
        // persist it is worth less than losing the result.
      }
    }

    toast.success(t('forms.fields.fitDone'))
    return { fit: computed, analysis: res.data as unknown as Record<string, unknown> }
  }

  return { run, scoring }
}
