import { useState, useMemo } from 'react'
import { Users, Search, Mail, Linkedin, AlertCircle, Plus, Edit2, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { ContactTypeBadge } from '@/components/ui/Badge'
import { Avatar, CompanyLogo } from '@/components/ui/Avatar'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableRowSkeleton } from '@/components/ui/Skeleton'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ContactForm } from '@/components/forms/ContactForm'
import { useMockStore } from '@/hooks/useMockStore'
import { useContactMutations } from '@/hooks/useContactMutations'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useI18n } from '@/hooks/useI18n'
import { contactsService } from '@/services/contactsService'
import { applicationsService } from '@/services/applicationsService'
import { companiesService } from '@/services/companiesService'
import { formatRelative, isOverdue } from '@/utils/date'
import { cn } from '@/lib/cn'
import { QK } from '@/lib/query-keys'
import type { Contact, Company } from '@/types'
import type { ContactFormValues } from '@/lib/schemas/contactSchema'

export function ContactsPage() {
  const { t } = useI18n()
  const { data: contacts, loading } = useMockStore(() => contactsService.list(), [], { key: QK.contacts.all() })
  const { data: apps } = useMockStore(() => applicationsService.list(), [], { key: QK.applications.all() })
  const { data: companies } = useMockStore(() => companiesService.list(), [], { key: QK.companies.all() })
  const { create, update, remove } = useContactMutations()
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState<string>('')
  const [sortBy, setSortBy] = useState<'recent' | 'company' | 'name'>('recent')
  const [viewContact, setViewContact] = useState<Contact | null>(null)
  const [editContact, setEditContact] = useState<Contact | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [deleteContact, setDeleteContact] = useState<Contact | null>(null)
  const debouncedSearch = useDebouncedValue(search)

  // Look up company logo by name (contacts store companyId optionally + company name)
  const companyByName = useMemo(() => {
    const m = new Map<string, Company>()
    companies?.forEach(c => m.set(c.name.toLowerCase(), c))
    return m
  }, [companies])

  const distinctCompanyNames = useMemo(() => {
    const set = new Set<string>()
    contacts?.forEach(c => { if (c.company) set.add(c.company) })
    return Array.from(set).sort()
  }, [contacts])

  const filtered = useMemo(() => {
    if (!contacts) return []
    const result = contacts.filter(c => {
      if (companyFilter && c.company !== companyFilter) return false
      if (!debouncedSearch) return true
      const q = debouncedSearch.toLowerCase()
      return c.name.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q) || c.title?.toLowerCase().includes(q)
    })
    if (sortBy === 'company') {
      return [...result].sort((a, b) => (a.company ?? '').localeCompare(b.company ?? '') || a.name.localeCompare(b.name))
    }
    if (sortBy === 'name') {
      return [...result].sort((a, b) => a.name.localeCompare(b.name))
    }
    // 'recent' — fall back to mock-store insertion order which is newest-first
    return result
  }, [contacts, debouncedSearch, companyFilter, sortBy])

  const appMap = useMemo(() => {
    const m: Record<string, string> = {}
    apps?.forEach(a => { m[a.id] = a.roleName + ' @ ' + a.companyName })
    return m
  }, [apps])

  const handleCreate = async (values: ContactFormValues) => {
    await create.mutateAsync({
      name:          values.name,
      type:          values.type,
      company:       values.company || undefined,
      title:         values.title || undefined,
      email:         values.email || undefined,
      linkedinUrl:   values.linkedinUrl || undefined,
      notes:         values.notes || undefined,
      followUpDueAt: values.followUpDueAt ? new Date(values.followUpDueAt).toISOString() : undefined,
      applicationIds: [],
    })
    setAddOpen(false)
  }

  const handleEdit = async (values: ContactFormValues) => {
    if (!editContact) return
    await update.mutateAsync({
      id: editContact.id,
      data: {
        name:          values.name,
        type:          values.type,
        company:       values.company || undefined,
        title:         values.title || undefined,
        email:         values.email || undefined,
        linkedinUrl:   values.linkedinUrl || undefined,
        notes:         values.notes || undefined,
        followUpDueAt: values.followUpDueAt ? new Date(values.followUpDueAt).toISOString() : undefined,
      },
    })
    setEditContact(null)
  }

  const handleDelete = async () => {
    if (!deleteContact) return
    await remove.mutateAsync(deleteContact.id)
    setDeleteContact(null)
    if (viewContact?.id === deleteContact.id) setViewContact(null)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader
        title={t('pages.contacts.title')}
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4" />
            {t('pages.contacts.newContact')}
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] max-w-xs">
          <Input
            placeholder={t('pages.contacts.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            leftIcon={<Search className="w-3.5 h-3.5" />}
            className="force-ltr"
          />
        </div>
        <Select
          options={[
            { label: 'All companies', value: '' },
            ...distinctCompanyNames.map(c => ({ label: c, value: c })),
          ]}
          value={companyFilter}
          onChange={e => setCompanyFilter(e.target.value)}
          className="w-44"
        />
        <Select
          options={[
            { label: 'Sort: Recent',         value: 'recent' },
            { label: 'Sort: Company A→Z',    value: 'company' },
            { label: 'Sort: Name A→Z',       value: 'name' },
          ]}
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="w-44"
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <table className="w-full"><tbody>{Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)}</tbody></table>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('pages.contacts.noContacts')}
          description={t('pages.contacts.noContactsSub')}
          action={{ label: t('pages.contacts.newContact'), onClick: () => setAddOpen(true) }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('pages.contacts.colName')}</th>
                <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('pages.contacts.colType')}</th>
                <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('pages.contacts.colRole')}</th>
                <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('pages.contacts.colLastSeen')}</th>
                <th className="text-start px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('pages.contacts.colFollowUp')}</th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(contact => {
                const needsFollowUp = contact.followUpDueAt && !isOverdue(contact.followUpDueAt)
                const overdueFollowUp = contact.followUpDueAt && isOverdue(contact.followUpDueAt)
                return (
                  <tr
                    key={contact.id}
                    onClick={() => setViewContact(contact)}
                    className="border-b border-slate-50 hover:bg-slate-50/60 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={contact.name} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">{contact.name}</p>
                          <p className="text-xs text-slate-400">{contact.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><ContactTypeBadge type={contact.type} /></td>
                    <td className="px-4 py-3">
                      {contact.company ? (
                        <div className="flex items-center gap-2">
                          <CompanyLogo
                            name={contact.company}
                            logoUrl={companyByName.get(contact.company.toLowerCase())?.logoUrl}
                            size="sm"
                          />
                          <span className="text-sm text-slate-700">{contact.company}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500 force-ltr">
                        {contact.lastInteractionAt ? formatRelative(contact.lastInteractionAt) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {overdueFollowUp ? (
                        <div className="flex items-center gap-1 text-danger-600">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">{t('pages.contacts.followUpOverdue')}</span>
                        </div>
                      ) : needsFollowUp ? (
                        <span className="text-xs text-warning-600 font-medium force-ltr">
                          {contact.followUpDueAt ? formatRelative(contact.followUpDueAt) : '—'}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => { setEditContact(contact); setViewContact(null) }}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                          aria-label="Edit contact"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteContact(contact)}
                          className="p-1 rounded hover:bg-danger-50 text-slate-400 hover:text-danger-600"
                          aria-label="Delete contact"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* View drawer */}
      <Drawer
        open={!!viewContact}
        onClose={() => setViewContact(null)}
        title={viewContact?.name}
        description={viewContact?.title}
      >
        {viewContact && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar name={viewContact.name} size="xl" />
              <div>
                <p className="font-semibold text-slate-900">{viewContact.name}</p>
                <p className="text-sm text-slate-500">{viewContact.title}</p>
                <ContactTypeBadge type={viewContact.type} />
              </div>
            </div>
            <div className="space-y-3">
              {viewContact.email && (
                <a href={`mailto:${viewContact.email}`} className="flex items-center gap-2 text-sm text-primary-600 hover:underline force-ltr">
                  <Mail className="w-4 h-4" /> {viewContact.email}
                </a>
              )}
              {viewContact.linkedinUrl && (
                <a href={viewContact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary-600 hover:underline force-ltr">
                  <Linkedin className="w-4 h-4" /> LinkedIn Profile
                </a>
              )}
            </div>
            {(viewContact.applicationIds ?? []).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{t('pages.contacts.linkedApplications')}</p>
                <ul className="space-y-1">
                  {(viewContact.applicationIds ?? []).map(id => (
                    <li key={id} className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                      {appMap[id] ?? id}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {viewContact.notes && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Notes</p>
                <p className="text-sm text-slate-600 leading-relaxed">{viewContact.notes}</p>
              </div>
            )}
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => { setEditContact(viewContact); setViewContact(null) }}>
                <Edit2 className="w-3.5 h-3.5" /> {t('common.edit')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setDeleteContact(viewContact); setViewContact(null) }} className="text-danger-600 hover:bg-danger-50">
                <Trash2 className="w-3.5 h-3.5" /> {t('common.delete')}
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Add drawer */}
      <Drawer open={addOpen} onClose={() => setAddOpen(false)} title={t('pages.contacts.newContact')}>
        <ContactForm
          onSubmit={handleCreate}
          onCancel={() => setAddOpen(false)}
          loading={create.isPending}
        />
      </Drawer>

      {/* Edit drawer */}
      <Drawer open={!!editContact} onClose={() => setEditContact(null)} title={t('common.edit')}>
        {editContact && (
          <ContactForm
            initial={editContact}
            onSubmit={handleEdit}
            onCancel={() => setEditContact(null)}
            loading={update.isPending}
          />
        )}
      </Drawer>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteContact}
        onClose={() => setDeleteContact(null)}
        onConfirm={handleDelete}
        title={t('common.delete') + '?'}
        description={`Remove "${deleteContact?.name}" from your contacts? This cannot be undone.`}
        confirmLabel={t('common.delete')}
        loading={remove.isPending}
      />
    </div>
  )
}
