import { useState, useMemo } from 'react'
import type { Task } from '@/types'
import { CheckSquare, Search, Plus, Check, Trash2, Edit2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ListItemSkeleton } from '@/components/ui/Skeleton'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TaskForm } from '@/components/forms/TaskForm'
import { useMockStore } from '@/hooks/useMockStore'
import { useTaskMutations } from '@/hooks/useTaskMutations'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useI18n } from '@/hooks/useI18n'
import { tasksService } from '@/services/tasksService'
import { formatDate, isOverdue } from '@/utils/date'
import { priorityScore } from '@/utils/priority'
import { matchesSearch } from '@/utils/search'
import { cn } from '@/lib/cn'
import { QK } from '@/lib/query-keys'
import type { TaskFormValues } from '@/lib/schemas/taskSchema'
import type { TaskCategory, TaskStatus, Priority } from '@/lib/enums'

const CATEGORY_COLORS: Record<string, string> = {
  Preparation: 'bg-violet-100 text-violet-700',
  'Follow-up': 'bg-primary-100 text-primary-700',
  Application: 'bg-success-100 text-success-700',
  Assignment: 'bg-warning-100 text-warning-700',
  Research: 'bg-slate-100 text-slate-600',
  Admin: 'bg-slate-100 text-slate-600',
}

export function TasksPage() {
  const { t } = useI18n()
  const { data: tasks, loading } = useMockStore(() => tasksService.list(), [], { key: QK.tasks.all() })
  const { create, update, complete, remove } = useTaskMutations()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<TaskCategory | ''>('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'active' | ''>('active')
  const [priority, setPriority] = useState<Priority | ''>('')
  const [addOpen, setAddOpen] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [deleteTask, setDeleteTask] = useState<Task | null>(null)
  const debouncedSearch = useDebouncedValue(search)

  // Options inside component so they re-render on locale change
  const CATEGORY_OPTIONS = [
    { label: t('pages.tasks.allCategories'), value: '' },
    { label: 'Preparation', value: 'Preparation' },
    { label: 'Follow-up',   value: 'Follow-up' },
    { label: 'Application', value: 'Application' },
    { label: 'Assignment',  value: 'Assignment' },
    { label: 'Research',    value: 'Research' },
    { label: 'Admin',       value: 'Admin' },
  ]

  const STATUS_OPTIONS = [
    { label: t('pages.tasks.activeTasks'), value: 'active' },
    { label: t('pages.tasks.allTasks'),   value: '' },
    { label: t('pages.tasks.done'),       value: 'Done' },
  ]

  const PRIORITY_OPTIONS = [
    { label: t('pages.tasks.allPriorities'), value: '' },
    { label: 'Critical', value: 'Critical' },
    { label: 'High',     value: 'High' },
    { label: 'Medium',   value: 'Medium' },
    { label: 'Low',      value: 'Low' },
  ]

  const filtered = useMemo(() => {
    if (!tasks) return []
    return tasks
      .filter(t => {
        if (category && t.category !== category) return false
        if (statusFilter === 'active' && (t.status === 'Done' || t.status === 'Cancelled')) return false
        if (statusFilter && statusFilter !== 'active' && t.status !== statusFilter) return false
        if (priority && t.priority !== priority) return false
        if (!matchesSearch(t as unknown as Record<string, unknown>, debouncedSearch, ['title', 'companyName', 'category'])) return false
        return true
      })
      .sort((a, b) => priorityScore(b) - priorityScore(a))
  }, [tasks, category, statusFilter, priority, debouncedSearch])

  const overdue = filtered.filter(t => t.status !== 'Done' && t.dueAt && isOverdue(t.dueAt))
  const active  = filtered.filter(t => t.status !== 'Done' && !(t.dueAt && isOverdue(t.dueAt)))
  const done    = filtered.filter(t => t.status === 'Done')

  const handleCreate = async (values: TaskFormValues) => {
    await create.mutateAsync({
      title:       values.title,
      category:    values.category,
      priority:    values.priority,
      status:      values.status,
      description: values.description || undefined,
      dueAt:       values.dueAt ? new Date(values.dueAt).toISOString() : undefined,
      applicationId: values.applicationId || undefined,
      companyName:   values.companyName || undefined,
    })
    setAddOpen(false)
  }

  const handleEdit = async (values: TaskFormValues) => {
    if (!editTask) return
    await update.mutateAsync({
      id: editTask.id,
      data: {
        title:       values.title,
        category:    values.category,
        priority:    values.priority,
        status:      values.status,
        description: values.description || undefined,
        dueAt:       values.dueAt ? new Date(values.dueAt).toISOString() : undefined,
      },
    })
    setEditTask(null)
  }

  const handleComplete = (taskId: string) => {
    void complete.mutateAsync(taskId)
  }

  const handleDelete = async () => {
    if (!deleteTask) return
    await remove.mutateAsync(deleteTask.id)
    setDeleteTask(null)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title={t('pages.tasks.title')}
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" />
            {t('pages.tasks.newTask')}
          </Button>
        }
      />

      {/* Quick add bar */}
      <div className="flex items-center gap-2 mb-5 p-3 bg-white rounded-xl border border-slate-200 shadow-card">
        <Plus className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          placeholder={t('pages.tasks.newTask') + '…'}
          className="flex-1 text-sm text-slate-600 placeholder:text-slate-400 outline-none bg-transparent"
          onFocus={() => setAddOpen(true)}
          readOnly
        />
        <Button size="sm" variant="primary" onClick={() => setAddOpen(true)}>{t('common.add')}</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex-1 min-w-48">
          <Input
            placeholder={t('pages.tasks.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon={<Search className="w-3.5 h-3.5" />}
            className="force-ltr"
          />
        </div>
        <Select options={CATEGORY_OPTIONS} value={category} onChange={e => setCategory(e.target.value as TaskCategory | '')} className="w-36" />
        <Select options={STATUS_OPTIONS} value={statusFilter} onChange={e => setStatusFilter(e.target.value as TaskStatus | 'active' | '')} className="w-32" />
        <Select options={PRIORITY_OPTIONS} value={priority} onChange={e => setPriority(e.target.value as Priority | '')} className="w-32" />
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => <ListItemSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title={t('pages.tasks.noTasks')}
          description={t('pages.tasks.noTasksSub')}
          action={{ label: t('pages.tasks.newTask'), onClick: () => setAddOpen(true) }}
        />
      ) : (
        <div className="space-y-4">
          {overdue.length > 0 && (
            <TaskGroup title={t('pages.tasks.groupOverdue')} tasks={overdue} isOverdue
              onComplete={handleComplete} onEdit={setEditTask} onDelete={setDeleteTask} />
          )}
          {active.length > 0 && (
            <TaskGroup title={t('pages.tasks.groupUpcoming')} tasks={active}
              onComplete={handleComplete} onEdit={setEditTask} onDelete={setDeleteTask} />
          )}
          {done.length > 0 && (
            <TaskGroup title={t('pages.tasks.groupDone')} tasks={done}
              onComplete={handleComplete} onEdit={setEditTask} onDelete={setDeleteTask} />
          )}
        </div>
      )}

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={t('pages.tasks.newTask')}>
        <TaskForm
          onSubmit={handleCreate}
          onCancel={() => setAddOpen(false)}
          loading={create.isPending}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editTask} onClose={() => setEditTask(null)} title={t('common.edit')}>
        {editTask && (
          <TaskForm
            initial={editTask}
            onSubmit={handleEdit}
            onCancel={() => setEditTask(null)}
            loading={update.isPending}
          />
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTask}
        onClose={() => setDeleteTask(null)}
        onConfirm={handleDelete}
        title={t('common.delete') + '?'}
        description={`"${deleteTask?.title}" will be permanently removed.`}
        confirmLabel={t('common.delete')}
        loading={remove.isPending}
      />
    </div>
  )
}

function TaskGroup({
  title, tasks, isOverdue: overdue, onComplete, onEdit, onDelete,
}: {
  title: string
  tasks: Task[]
  isOverdue?: boolean
  onComplete: (id: string) => void
  onEdit: (t: Task) => void
  onDelete: (t: Task) => void
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <h2 className={cn('text-xs font-semibold uppercase tracking-wide', overdue ? 'text-danger-600' : 'text-slate-500')}>
          {title}
        </h2>
        <span className={cn('text-2xs font-bold px-1.5 py-0.5 rounded-full', overdue ? 'bg-danger-100 text-danger-700' : 'bg-slate-100 text-slate-500')}>
          {tasks.length}
        </span>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
        {tasks.map((task, i) => (
          <div key={task.id} className={cn('flex items-start gap-3 px-4 py-3.5 group', i > 0 && 'border-t border-slate-50')}>
            <button
              onClick={() => task.status !== 'Done' && onComplete(task.id)}
              className={cn(
                'mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                task.status === 'Done'
                  ? 'bg-success-500 border-success-500'
                  : 'border-slate-300 hover:border-primary-400'
              )}
              aria-label={`Mark ${task.title} as done`}
            >
              {task.status === 'Done' && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={cn('text-sm font-medium leading-snug', task.status === 'Done' ? 'line-through text-slate-400' : 'text-slate-800')}>
                {task.title}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {task.companyName && (
                  <span className="text-xs text-slate-400">{task.companyName}</span>
                )}
                {task.dueAt && (
                  <span className={cn('text-xs force-ltr', overdue && task.status !== 'Done' ? 'text-danger-500 font-medium' : 'text-slate-400')}>
                    {formatDate(task.dueAt)}
                  </span>
                )}
                <span className={cn('text-2xs font-medium px-2 py-0.5 rounded-full', CATEGORY_COLORS[task.category] ?? 'bg-slate-100 text-slate-600')}>
                  {task.category}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(task)}
                  className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                  aria-label="Edit task"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(task)}
                  className="p-1 rounded hover:bg-danger-50 text-slate-400 hover:text-danger-600"
                  aria-label="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
