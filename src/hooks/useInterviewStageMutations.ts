import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { InterviewStage } from '@/types'
import type { ApplicationStage, InterviewType } from '@/lib/enums'
import { interviewStageService } from '@/services/interviewStageService'
import { applicationsService } from '@/services/applicationsService'
import { STAGE_ORDER } from '@/lib/constants'
import { useToastActions } from './useToast'
import { QK } from '@/lib/query-keys'

// ---------------------------------------------------------------------------
// Stage auto-advancement: when an interview round is marked Passed, advance
// the application's stage to the *next* one. Never downgrade.
// ---------------------------------------------------------------------------

const TYPE_TO_STAGE: Record<InterviewType, ApplicationStage> = {
  'Phone Screen':           'HR Screen',
  'HR Interview':           'HR Screen',
  'Home Assignment Review': 'Home Assignment',
  'Technical':              'Technical Interview',
  'System Design':          'Technical Interview',
  'Behavioral':             'Manager Interview',
  'Case Study':             'Manager Interview',
  'Manager Interview':      'Manager Interview',
  'Final Round':            'Final Interview',
  'Offer Call':             'Offer',
}

/** The stage AFTER `currentRoundType` in the pipeline. */
function nextStageAfter(roundType: InterviewType): ApplicationStage | null {
  const matched = TYPE_TO_STAGE[roundType]
  if (!matched) return null
  const idx = STAGE_ORDER.indexOf(matched)
  if (idx < 0) return null
  // Stop at 'Offer' — don't advance past it automatically.
  const offerIdx = STAGE_ORDER.indexOf('Offer')
  if (idx >= offerIdx) return null
  return STAGE_ORDER[idx + 1] as ApplicationStage
}

async function autoAdvanceStage(
  applicationId: string,
  round: Pick<InterviewStage, 'type' | 'outcome'>,
): Promise<void> {
  if (round.outcome !== 'Passed') return
  const target = nextStageAfter(round.type)
  if (!target) return
  const app = await applicationsService.getById(applicationId)
  if (!app) return
  // Only advance forward — never downgrade if the user already moved past it.
  const currentIdx = STAGE_ORDER.indexOf(app.stage)
  const targetIdx  = STAGE_ORDER.indexOf(target)
  if (targetIdx <= currentIdx) return
  // Don't override terminal states the user set manually.
  if (['Rejected', 'Accepted', 'Withdrawn', 'Negotiating'].includes(app.stage)) return
  await applicationsService.update(applicationId, { stage: target })
}

export function useInterviewStageMutations(applicationId: string) {
  const qc = useQueryClient()
  const toast = useToastActions()

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: QK.applications.detail(applicationId) })
    void qc.invalidateQueries({ queryKey: QK.applications.all() })
  }

  const create = useMutation({
    mutationFn: async (data: Partial<InterviewStage>) => {
      const round = await interviewStageService.create({ ...data, applicationId })
      await autoAdvanceStage(applicationId, { type: round.type, outcome: round.outcome })
      return round
    },
    onSuccess: () => { toast.success('Interview round added'); invalidate() },
    onError: (e: Error) => toast.error(e.message),
  })

  const update = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InterviewStage> }) => {
      const round = await interviewStageService.update(id, data)
      await autoAdvanceStage(applicationId, { type: round.type, outcome: round.outcome })
      return round
    },
    onSuccess: () => { toast.success('Interview round updated'); invalidate() },
    onError: (e: Error) => toast.error(e.message),
  })

  const remove = useMutation({
    mutationFn: (id: string) => interviewStageService.delete(id),
    onSuccess: () => { toast.success('Interview round deleted'); invalidate() },
    onError: (e: Error) => toast.error(e.message),
  })

  return { create, update, remove }
}
