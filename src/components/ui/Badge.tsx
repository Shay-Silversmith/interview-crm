import { cn } from '@/lib/cn'
import { useI18n } from '@/hooks/useI18n'
import type { ApplicationStage, Priority, TaskStatus, ContactType, CalendarEventType } from '@/lib/enums'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'violet' | 'slate'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  className?: string
}

// Refined palette: softer -50 background + 1px ring for visual depth.
// Each hue retains its semantic meaning; contrast remains AA-compliant
// (dark -600/-700 text on light -50 background with a -200/60 ring).
const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-50  text-slate-600   ring-1 ring-slate-200/60',
  slate:   'bg-slate-50  text-slate-600   ring-1 ring-slate-200/60',
  success: 'bg-success-50 text-success-700 ring-1 ring-success-200/60',
  warning: 'bg-warning-50 text-warning-700 ring-1 ring-warning-200/60',
  danger:  'bg-danger-50  text-danger-600  ring-1 ring-danger-200/60',
  primary: 'bg-primary-50 text-primary-700 ring-1 ring-primary-200/60',
  violet:  'bg-violet-50  text-violet-700  ring-1 ring-violet-200/60',
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

// ── Stage ──────────────────────────────────────────────────────────────────
const STAGE_VARIANTS: Record<ApplicationStage, BadgeVariant> = {
  Interested:             'slate',
  Applied:                'primary',
  'HR Screen':            'primary',
  'Home Assignment':      'warning',
  'Technical Interview':  'warning',
  'Manager Interview':    'violet',
  'Final Interview':      'violet',
  Offer:                  'success',
  Negotiating:            'success',
  Rejected:               'danger',
  Accepted:               'success',
  Withdrawn:              'slate',
}

const STAGE_KEY: Record<ApplicationStage, string> = {
  Interested:             'badges.stage.interested',
  Applied:                'badges.stage.applied',
  'HR Screen':            'badges.stage.hrScreen',
  'Home Assignment':      'badges.stage.homeAssignment',
  'Technical Interview':  'badges.stage.technicalInterview',
  'Manager Interview':    'badges.stage.managerInterview',
  'Final Interview':      'badges.stage.finalInterview',
  Offer:                  'badges.stage.offer',
  Negotiating:            'badges.stage.negotiating',
  Rejected:               'badges.stage.rejected',
  Accepted:               'badges.stage.accepted',
  Withdrawn:              'badges.stage.withdrawn',
}

export function StageBadge({ stage }: { stage: ApplicationStage }) {
  const { t } = useI18n()
  return <Badge variant={STAGE_VARIANTS[stage]}>{t(STAGE_KEY[stage])}</Badge>
}

// ── Priority ───────────────────────────────────────────────────────────────
const PRIORITY_VARIANTS: Record<Priority, BadgeVariant> = {
  Critical: 'danger',
  High:     'warning',
  Medium:   'primary',
  Low:      'slate',
}

const PRIORITY_KEY: Record<Priority, string> = {
  Critical: 'badges.priority.critical',
  High:     'badges.priority.high',
  Medium:   'badges.priority.medium',
  Low:      'badges.priority.low',
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { t } = useI18n()
  return <Badge variant={PRIORITY_VARIANTS[priority]}>{t(PRIORITY_KEY[priority])}</Badge>
}

// ── Status ─────────────────────────────────────────────────────────────────
const STATUS_VARIANTS: Record<TaskStatus, BadgeVariant> = {
  Todo:         'slate',
  'In Progress':'primary',
  Done:         'success',
  Cancelled:    'slate',
}

const STATUS_KEY: Record<TaskStatus, string> = {
  Todo:         'badges.status.todo',
  'In Progress':'badges.status.inProgress',
  Done:         'badges.status.done',
  Cancelled:    'badges.status.cancelled',
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const { t } = useI18n()
  return <Badge variant={STATUS_VARIANTS[status]}>{t(STATUS_KEY[status])}</Badge>
}

// ── Contact type ───────────────────────────────────────────────────────────
const CONTACT_TYPE_VARIANTS: Record<ContactType, BadgeVariant> = {
  HR:              'success',
  Recruiter:       'primary',
  'Hiring Manager':'violet',
  Employee:        'warning',
  Referral:        'slate',
  Other:           'default',
}

const CONTACT_TYPE_KEY: Record<ContactType, string> = {
  HR:              'badges.contactType.hr',
  Recruiter:       'badges.contactType.recruiter',
  'Hiring Manager':'badges.contactType.hiringManager',
  Employee:        'badges.contactType.employee',
  Referral:        'badges.contactType.referral',
  Other:           'badges.contactType.other',
}

export function ContactTypeBadge({ type }: { type: ContactType }) {
  const { t } = useI18n()
  return <Badge variant={CONTACT_TYPE_VARIANTS[type]}>{t(CONTACT_TYPE_KEY[type])}</Badge>
}

// ── Event type ─────────────────────────────────────────────────────────────
const EVENT_TYPE_VARIANTS: Record<CalendarEventType, BadgeVariant> = {
  Interview:             'violet',
  'Assignment Deadline': 'danger',
  'Application Deadline':'warning',
  'Follow-up Reminder':  'primary',
  'Preparation Session': 'success',
  'General Task':        'slate',
}

const EVENT_TYPE_KEY: Record<CalendarEventType, string> = {
  Interview:             'badges.eventType.interview',
  'Assignment Deadline': 'badges.eventType.assignmentDeadline',
  'Application Deadline':'badges.eventType.applicationDeadline',
  'Follow-up Reminder':  'badges.eventType.followUpReminder',
  'Preparation Session': 'badges.eventType.preparationSession',
  'General Task':        'badges.eventType.generalTask',
}

export function EventTypeBadge({ type }: { type: CalendarEventType }) {
  const { t } = useI18n()
  return <Badge variant={EVENT_TYPE_VARIANTS[type]}>{t(EVENT_TYPE_KEY[type])}</Badge>
}
