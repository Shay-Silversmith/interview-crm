import { cn } from '@/lib/cn'
import type { ApplicationStage, Priority, TaskStatus, ContactType, CalendarEventType } from '@/lib/enums'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'violet' | 'slate'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-100 text-slate-600',
  slate: 'bg-slate-100 text-slate-600',
  success: 'bg-success-100 text-success-700',
  warning: 'bg-warning-100 text-warning-700',
  danger: 'bg-danger-100 text-danger-600',
  primary: 'bg-primary-100 text-primary-700',
  violet: 'bg-violet-100 text-violet-700',
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

const STAGE_VARIANTS: Record<ApplicationStage, BadgeVariant> = {
  Interested: 'slate',
  Applied: 'primary',
  'HR Screen': 'primary',
  'Home Assignment': 'warning',
  'Technical Interview': 'warning',
  'Manager Interview': 'violet',
  'Final Interview': 'violet',
  Offer: 'success',
  Rejected: 'danger',
  Accepted: 'success',
  Withdrawn: 'slate',
}

export function StageBadge({ stage }: { stage: ApplicationStage }) {
  return <Badge variant={STAGE_VARIANTS[stage]}>{stage}</Badge>
}

const PRIORITY_VARIANTS: Record<Priority, BadgeVariant> = {
  Critical: 'danger',
  High: 'warning',
  Medium: 'primary',
  Low: 'slate',
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge variant={PRIORITY_VARIANTS[priority]}>{priority}</Badge>
}

const STATUS_VARIANTS: Record<TaskStatus, BadgeVariant> = {
  Todo: 'slate',
  'In Progress': 'primary',
  Done: 'success',
  Cancelled: 'slate',
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <Badge variant={STATUS_VARIANTS[status]}>{status}</Badge>
}

const CONTACT_TYPE_VARIANTS: Record<ContactType, BadgeVariant> = {
  HR: 'success',
  Recruiter: 'primary',
  'Hiring Manager': 'violet',
  Employee: 'warning',
  Referral: 'slate',
  Other: 'default',
}

export function ContactTypeBadge({ type }: { type: ContactType }) {
  return <Badge variant={CONTACT_TYPE_VARIANTS[type]}>{type}</Badge>
}

const EVENT_TYPE_VARIANTS: Record<CalendarEventType, BadgeVariant> = {
  Interview: 'violet',
  'Assignment Deadline': 'danger',
  'Application Deadline': 'warning',
  'Follow-up Reminder': 'primary',
  'Preparation Session': 'success',
  'General Task': 'slate',
}

export function EventTypeBadge({ type }: { type: CalendarEventType }) {
  return <Badge variant={EVENT_TYPE_VARIANTS[type]}>{type}</Badge>
}
