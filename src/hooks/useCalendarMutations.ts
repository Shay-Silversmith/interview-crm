import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { CalendarEvent } from '@/types'
import { calendarService } from '@/services/calendarService'
import { tasksService } from '@/services/tasksService'
import { useToastActions } from './useToast'
import { QK } from '@/lib/query-keys'

export function useCalendarMutations() {
  const qc    = useQueryClient()
  const toast = useToastActions()

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: QK.calendar.all() })
    void qc.invalidateQueries({ queryKey: QK.dashboard.all() })
  }

  const create = useMutation({
    mutationFn: async (data: Partial<CalendarEvent>) => {
      const event = await calendarService.create(data)

      // ── Auto-create prep task for Interview events ──────────────────────
      if (data.type === 'Interview' && data.startAt) {
        const dueAt = new Date(
          new Date(data.startAt).getTime() - 24 * 60 * 60 * 1000
        ).toISOString()
        try {
          await tasksService.create({
            title:         `Prep: ${data.title ?? 'Interview'}`,
            category:      'Preparation',
            priority:      'High',
            status:        'Todo',
            dueAt,
            applicationId: data.applicationId,
          })
          // Invalidate tasks so the auto-created task appears immediately
          void qc.invalidateQueries({ queryKey: QK.tasks.all() })
        } catch (e) {
          console.warn('Auto-create prep task failed:', e)
        }
      }

      return event
    },
    onSuccess: (_, variables) => {
      const isInterview = variables.type === 'Interview'
      toast.success(
        isInterview
          ? 'Event created · Prep task created for 1 day before'
          : 'Event created'
      )
      invalidate()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CalendarEvent> }) =>
      calendarService.update(id, data),
    onSuccess: () => { toast.success('Event updated'); invalidate() },
    onError: (e: Error) => toast.error(e.message),
  })

  const remove = useMutation({
    mutationFn: (id: string) => calendarService.delete(id),
    onSuccess: () => { toast.success('Event deleted'); invalidate() },
    onError: (e: Error) => toast.error(e.message),
  })

  return { create, update, remove }
}
