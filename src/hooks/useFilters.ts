import { useState, useMemo } from 'react'

export interface FilterState<T extends string = string> {
  search: string
  filters: Partial<Record<T, string>>
  sortBy: string
  sortDir: 'asc' | 'desc'
}

export function useFilters<TFilter extends string = string>(
  initialSort = '',
  initialDir: 'asc' | 'desc' = 'desc'
) {
  const [state, setState] = useState<FilterState<TFilter>>({
    search: '',
    filters: {},
    sortBy: initialSort,
    sortDir: initialDir,
  })

  const setSearch = (search: string) => setState(s => ({ ...s, search }))
  const setFilter = (key: TFilter, value: string) =>
    setState(s => ({ ...s, filters: { ...s.filters, [key]: value } }))
  const clearFilter = (key: TFilter) =>
    setState(s => {
      const f = { ...s.filters }
      delete f[key]
      return { ...s, filters: f }
    })
  const setSort = (sortBy: string) =>
    setState(s => ({
      ...s,
      sortBy,
      sortDir: s.sortBy === sortBy && s.sortDir === 'desc' ? 'asc' : 'desc',
    }))
  const reset = () =>
    setState({ search: '', filters: {}, sortBy: initialSort, sortDir: initialDir })

  return useMemo(
    () => ({ ...state, setSearch, setFilter, clearFilter, setSort, reset }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state]
  )
}
