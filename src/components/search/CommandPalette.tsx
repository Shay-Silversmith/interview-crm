// ---------------------------------------------------------------------------
// CommandPalette — Cmd/Ctrl+K global search using cmdk v1
// Sources: applications, companies, contacts, prepared answers
// ---------------------------------------------------------------------------
import { useEffect, useState } from 'react'
import { Command } from 'cmdk'
import { useNavigate } from 'react-router-dom'
import { Briefcase, Building2, Users, BookOpen, Clock, Search } from 'lucide-react'
import { useSearch } from '@/contexts/SearchContext'
import { getRecents, trackRecent, type RecentItem } from '@/lib/recents'
import { useMockStore } from '@/hooks/useMockStore'
import { applicationsService } from '@/services/applicationsService'
import { companiesService } from '@/services/companiesService'
import { contactsService } from '@/services/contactsService'
import { prepService } from '@/services/prepService'
import { cn } from '@/lib/cn'

const TYPE_ICON = {
  application: Briefcase,
  company:     Building2,
  contact:     Users,
  prep:        BookOpen,
}

function ItemRow({ icon: Icon, label, sub }: { icon: React.ElementType; label: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-6 h-6 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-800 truncate leading-tight">{label}</p>
        {sub && <p className="text-xs text-slate-400 truncate">{sub}</p>}
      </div>
    </div>
  )
}

export function CommandPalette() {
  const { isOpen, close } = useSearch()
  const navigate           = useNavigate()
  const [search, setSearch] = useState('')
  const [recents, setRecents] = useState<RecentItem[]>([])

  // Always-fetched (React Query caches; palette just reads the cache)
  const { data: apps }     = useMockStore(() => applicationsService.list(), [])
  const { data: companies } = useMockStore(() => companiesService.list(), [])
  const { data: contacts }  = useMockStore(() => contactsService.list(), [])
  const { data: answers }   = useMockStore(() => prepService.list(), [])

  useEffect(() => {
    if (isOpen) { setSearch(''); setRecents(getRecents()) }
  }, [isOpen])

  // Escape
  useEffect(() => {
    if (!isOpen) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [isOpen, close])

  function go(to: string, recent?: RecentItem) {
    if (recent) trackRecent(recent)
    navigate(to)
    close()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center sm:pt-[12vh] sm:px-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={close} />

      {/* Palette shell */}
      <div
        className={cn(
          'relative w-full bg-white shadow-2xl overflow-hidden',
          // Mobile: full screen
          'inset-0 absolute rounded-none',
          // ≥sm: centered card
          'sm:static sm:max-w-lg sm:rounded-2xl',
        )}
      >
        <Command shouldFilter label="Global search">
          {/* Input row */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <Command.Input
              autoFocus
              value={search}
              onValueChange={setSearch}
              placeholder="Search applications, companies, contacts…"
              className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none"
            />
            <kbd className="hidden sm:inline-flex h-5 px-1.5 text-2xs font-mono bg-slate-100 text-slate-400 rounded items-center">Esc</kbd>
          </div>

          <Command.List className="max-h-[65vh] sm:max-h-[50vh] overflow-y-auto p-1.5">
            <Command.Empty className="py-12 text-center text-sm text-slate-400">
              No results for &quot;{search}&quot;
            </Command.Empty>

            {/* Recent (empty query only) */}
            {!search && recents.length > 0 && (
              <Command.Group heading="Recent">
                {recents.map(r => {
                  const Icon = TYPE_ICON[r.type]
                  return (
                    <Command.Item key={r.id} value={`recent-${r.id} ${r.label}`} onSelect={() => go(r.to)}
                      className="flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer aria-selected:bg-slate-100">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <ItemRow icon={Icon} label={r.label} sub={r.sub} />
                    </Command.Item>
                  )
                })}
              </Command.Group>
            )}

            {/* Applications */}
            {(apps?.length ?? 0) > 0 && (
              <Command.Group heading="Applications">
                {apps!.map(a => (
                  <Command.Item key={a.id} value={`${a.roleName} ${a.companyName}`}
                    onSelect={() => go(`/applications/${a.id}`, { id: a.id, type: 'application', label: a.roleName, sub: a.companyName, to: `/applications/${a.id}` })}
                    className="flex items-center px-2 py-2 rounded-lg cursor-pointer aria-selected:bg-slate-100">
                    <ItemRow icon={Briefcase} label={a.roleName} sub={a.companyName} />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Companies */}
            {(companies?.length ?? 0) > 0 && (
              <Command.Group heading="Companies">
                {companies!.map(c => (
                  <Command.Item key={c.id} value={c.name}
                    onSelect={() => go(`/companies/${c.id}`, { id: c.id, type: 'company', label: c.name, to: `/companies/${c.id}` })}
                    className="flex items-center px-2 py-2 rounded-lg cursor-pointer aria-selected:bg-slate-100">
                    <ItemRow icon={Building2} label={c.name} sub={c.industry ?? undefined} />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Contacts */}
            {(contacts?.length ?? 0) > 0 && (
              <Command.Group heading="Contacts">
                {contacts!.map(c => (
                  <Command.Item key={c.id} value={`${c.name} ${c.company ?? ''}`}
                    onSelect={() => go(`/contacts/${c.id}`, { id: c.id, type: 'contact', label: c.name, sub: c.company, to: `/contacts/${c.id}` })}
                    className="flex items-center px-2 py-2 rounded-lg cursor-pointer aria-selected:bg-slate-100">
                    <ItemRow icon={Users} label={c.name} sub={c.company} />
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {/* Prep answers */}
            {(answers?.length ?? 0) > 0 && (
              <Command.Group heading="Prep answers">
                {answers!.map(p => (
                  <Command.Item key={p.id} value={p.question}
                    onSelect={() => go('/prep')}
                    className="flex items-center px-2 py-2 rounded-lg cursor-pointer aria-selected:bg-slate-100">
                    <ItemRow icon={BookOpen} label={p.question} sub={p.category} />
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer hint */}
          <div className="hidden sm:flex items-center gap-3 px-4 py-2 border-t border-slate-100 text-2xs text-slate-400">
            <span><kbd className="font-mono bg-slate-100 px-1 rounded">↑↓</kbd> navigate</span>
            <span><kbd className="font-mono bg-slate-100 px-1 rounded">↵</kbd> open</span>
            <span><kbd className="font-mono bg-slate-100 px-1 rounded">Esc</kbd> close</span>
          </div>
        </Command>
      </div>
    </div>
  )
}
