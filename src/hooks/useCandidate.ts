// ---------------------------------------------------------------------------
// InterviewFlow — useCandidate.ts
// Assembles the "who is this candidate" block that every AI tool sends.
//
// Each panel used to build this itself, and each built it differently: one sent
// a free-text box the user had to retype every session, another sent nothing at
// all. That is why the tools produced generic output — they were not being told
// who they were writing for. The profile and the active CV are already in the
// app; this reads them once and hands every tool the same picture.
// ---------------------------------------------------------------------------

import { useMemo } from 'react'
import { useMockStore } from '@/hooks/useMockStore'
import { useProfile } from '@/hooks/useProfile'
import { documentsService } from '@/services/documentsService'
import { QK } from '@/lib/query-keys'
import type { CandidatePayload } from '@/services/aiClientService'
import type { CVVersion } from '@/types'

export interface UseCandidateResult {
  candidate: CandidatePayload | undefined
  /** The CV the payload was built from, so panels can name it in the UI. */
  activeCV:  CVVersion | null
  cvVersions: CVVersion[]
  /** False when there is neither a profile nor a CV worth sending. */
  hasContext: boolean
  loading:   boolean
}

function buildBackground(
  profile: ReturnType<typeof useProfile>['profile'],
  cv: CVVersion | null,
): string {
  const lines: string[] = []

  if (profile) {
    const study = [profile.degree, profile.university].filter(Boolean).join(', ')
    if (study)            lines.push(`Studies: ${study}${profile.year ? ` (year ${profile.year})` : ''}`)
    if (profile.unit)     lines.push(`Military service: ${profile.unit}`)
    if (profile.location) lines.push(`Location: ${profile.location}`)
    if (profile.bio)      lines.push(`About: ${profile.bio}`)
    if (profile.defaultPitch) lines.push(`Personal pitch: ${profile.defaultPitch}`)
    if (profile.languages?.length) lines.push(`Languages: ${profile.languages.join(', ')}`)
  }

  // The CV's own text is the richest thing available — it is what makes a STAR
  // story traceable to a real project rather than a plausible invention.
  if (cv?.notes?.trim()) lines.push(`CV detail:\n${cv.notes.trim()}`)

  return lines.join('\n')
}

/**
 * @param preferredCvId Pin a specific CV version (e.g. the one attached to an
 *                      application). Falls back to the active CV, then newest.
 */
export function useCandidate(preferredCvId?: string): UseCandidateResult {
  const { profile, loading: profileLoading } = useProfile()
  const { data: cvVersions, loading: cvLoading } = useMockStore(
    () => documentsService.listCVVersions(),
    [],
    { key: QK.cvVersions.all() },
  )

  const activeCV = useMemo(() => {
    const list = cvVersions ?? []
    if (list.length === 0) return null
    return (
      (preferredCvId ? list.find(c => c.id === preferredCvId) : undefined) ??
      list.find(c => c.isActive) ??
      list[0]
    )
  }, [cvVersions, preferredCvId])

  const candidate = useMemo<CandidatePayload | undefined>(() => {
    const background = buildBackground(profile, activeCV)
    const hasAnything = Boolean(profile || activeCV || background)
    if (!hasAnything) return undefined

    return {
      name:     profile?.preferredName ?? profile?.displayName ?? profile?.name ?? undefined,
      headline: profile?.targetRoles?.length
        ? `Targeting ${profile.targetRoles.join(' / ')}`
        : undefined,
      background:  background || undefined,
      skills:      profile?.skills?.length ? profile.skills : undefined,
      targetRoles: profile?.targetRoles?.length ? profile.targetRoles : undefined,
      cv: activeCV
        ? {
            emphasis:            activeCV.emphasis ?? '',
            skillsHighlighted:   activeCV.skillsHighlighted ?? [],
            projectsHighlighted: activeCV.projectsHighlighted ?? [],
          }
        : null,
    }
  }, [profile, activeCV])

  return {
    candidate,
    activeCV,
    cvVersions: cvVersions ?? [],
    hasContext: Boolean(activeCV || profile?.bio || profile?.skills?.length),
    loading:    profileLoading || cvLoading,
  }
}
