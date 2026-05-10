// ---------------------------------------------------------------------------
// InterviewFlow — SearchContext.tsx
// Minimal context that lets any component open / close the command palette.
// ---------------------------------------------------------------------------
import { createContext, useContext, useState, type ReactNode } from 'react'

interface SearchContextValue {
  isOpen: boolean
  open:   () => void
  close:  () => void
}

const SearchContext = createContext<SearchContextValue>({
  isOpen: false,
  open:   () => {},
  close:  () => {},
})

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <SearchContext.Provider
      value={{
        isOpen,
        open:  () => setIsOpen(true),
        close: () => setIsOpen(false),
      }}
    >
      {children}
    </SearchContext.Provider>
  )
}

export const useSearch = () => useContext(SearchContext)
