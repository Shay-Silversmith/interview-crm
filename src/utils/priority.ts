import type { Priority, ApplicationStage } from '@/lib/enums'
import type { Task } from '@/types'
import { PRIORITY_WEIGHT } from '@/lib/constants'
import { daysUntil } from './date'

export function priorityScore(task: Task): number {
  const pWeight = PRIORITY_WEIGHT[task.priority] ?? 1
  const dueScore = task.dueAt
    ? Math.max(0, 10 - daysUntil(task.dueAt))
    : 0
  const appScore = task.applicationId ? 2 : 0
  return pWeight * 10 + dueScore + appScore
}

export function stageSortOrder(stage: ApplicationStage): number {
  const order: Record<ApplicationStage, number> = {
    Interested: 0,
    Applied: 1,
    'HR Screen': 2,
    'Home Assignment': 3,
    'Technical Interview': 4,
    'Manager Interview': 5,
    'Final Interview': 6,
    Offer: 7,
    Accepted: 8,
    Rejected: 9,
    Withdrawn: 10,
  }
  return order[stage] ?? 99
}

export function urgencyLabel(score: number): string {
  if (score >= 85) return 'Critical'
  if (score >= 65) return 'High'
  if (score >= 40) return 'Medium'
  return 'Low'
}

export type PriorityColorKey = Priority

export const PRIORITY_COLORS: Record<Priority, { bg: string; text: string; border: string }> = {
  Critical: { bg: 'bg-danger-100', text: 'text-danger-700', border: 'border-danger-200' },
  High: { bg: 'bg-warning-100', text: 'text-warning-700', border: 'border-warning-200' },
  Medium: { bg: 'bg-primary-100', text: 'text-primary-700', border: 'border-primary-200' },
  Low: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
}
