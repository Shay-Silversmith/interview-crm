import { useState, useMemo } from 'react'
import { Users, Search, Mail, Linkedin, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Input } from '@/components/ui/Input'
import { ContactTypeBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Drawer } from '@/components/ui/Drawer'
import { EmptyState } from '@/components/ui/EmptyState'
import { TableRowSkeleton } from '@/components/ui/Skeleton'
import { useMockStore } from '@/hooks/useMockStore'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { contactsService } from '@/services/contactsService'
import { applicationsService } from '@/services/applicationsService'
import { formatRelative, isOverdue } from '@/utils/date'
import { cn } from '@/lib/cn'
import type { Contact } from '@/types'

export function ContactsPage() {
  const { data: contacts, loading } = useMockStore(() => contactsService.list())
  const { data: apps } = useMockStore(() => applicationsService.list())
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Contact | null>(null)
  const debouncedSearch = useDebouncedValue(search)

  const filtered = useMemo(() => {
    if (!contacts) return []
    return contacts.filter(c => {
      if (!debouncedSearch) return true
      const q = debouncedSearch.toLowerCase()
      return c.name.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q) || c.title?.toLowerCase().includes(q)
    })
  }, [contacts, debouncedSearch])

  const appMap = useMemo(() => {
    const m: Record<string, string> = {}
    apps?.forEach(a => { m[a.id] = a.roleName + ' @ ' + a.companyName })
    return m
  }, [apps])

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Contacts" description="Everyone in your professional network" />

      <div className="mb-5">
        <Input
          placeholder="Search contacts…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          leftIcon={<Search className="w-3.5 h-3.5" />}
          className="max-w-xs"
        />
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <table className="w-full"><tbody>{Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)}</tbody></table>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No contacts found" description="Add contacts from your applications." />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Contact</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(contact => {
                const needsFollowUp = contact.followUpDueAt && !isOverdue(contact.followUpDueAt)
                const overdueFollowUp = contact.followUpDueAt && isOverdue(contact.followUpDueAt)
                return (
                  <tr
                    key={contact.id}
                    onClick={() => setSelected(contact)}
                    className="border-b border-slate-50 hover:bg-slate-50/60 cursor-pointer transition-colors"
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
                      <span className="text-sm text-slate-600">{contact.company ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-slate-500">
                        {contact.lastInteractionAt ? formatRelative(contact.lastInteractionAt) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {overdueFollowUp ? (
                        <div className="flex items-center gap-1 text-danger-600">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">Overdue</span>
                        </div>
                      ) : needsFollowUp ? (
                        <span className="text-xs text-warning-600 font-medium">
                          {contact.followUpDueAt ? formatRelative(contact.followUpDueAt) : '—'}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name}
        description={selected?.title}
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar name={selected.name} size="xl" />
              <div>
                <p className="font-semibold text-slate-900">{selected.name}</p>
                <p className="text-sm text-slate-500">{selected.title}</p>
                <ContactTypeBadge type={selected.type} />
              </div>
            </div>
            <div className="space-y-3">
              {selected.email && (
                <a href={`mailto:${selected.email}`} className="flex items-center gap-2 text-sm text-primary-600 hover:underline">
                  <Mail className="w-4 h-4" /> {selected.email}
                </a>
              )}
              {selected.linkedinUrl && (
                <a href={selected.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary-600 hover:underline">
                  <Linkedin className="w-4 h-4" /> LinkedIn Profile
                </a>
              )}
            </div>
            {selected.applicationIds.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Related Applications</p>
                <ul className="space-y-1">
                  {selected.applicationIds.map(id => (
                    <li key={id} className="text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2">
                      {appMap[id] ?? id}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {selected.notes && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Notes</p>
                <p className="text-sm text-slate-600 leading-relaxed">{selected.notes}</p>
              </div>
            )}
            {selected.lastInteractionAt && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Last Contact</p>
                <p className="text-sm text-slate-600">{formatRelative(selected.lastInteractionAt)}</p>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  )
}
