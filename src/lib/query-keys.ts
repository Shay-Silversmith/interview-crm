// ---------------------------------------------------------------------------
// InterviewFlow — query-keys.ts
// Named React Query key factories for cache invalidation.
// Use these in useMockStore(..., [], { key: QK.tasks.list() }) and mutations.
// ---------------------------------------------------------------------------

export const QK = {
  profile:        { all: () => ['profile'] as const },
  dashboard:      { all: () => ['dashboard'] as const },
  applications:   { all: () => ['applications'] as const,  detail: (id: string) => ['applications', id] as const },
  companies:      { all: () => ['companies'] as const,     detail: (id: string) => ['companies', id] as const },
  tasks:          { all: () => ['tasks'] as const,         byApp: (id: string) => ['tasks', 'app', id] as const },
  contacts:       { all: () => ['contacts'] as const,      byApp: (id: string) => ['contacts', 'app', id] as const, byCompany: (id: string) => ['contacts', 'company', id] as const },
  calendar:       { all: () => ['calendar'] as const },
  cvVersions:     { all: () => ['cvVersions'] as const },
  documents:      { all: () => ['documents'] as const,     byApp: (id: string) => ['documents', 'app', id] as const },
  prep:           { all: () => ['prep'] as const },
  ai:             { all: () => ['ai'] as const,            byApp: (id: string) => ['ai', 'app', id] as const },
}
