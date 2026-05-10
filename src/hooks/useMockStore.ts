// ---------------------------------------------------------------------------
// InterviewFlow — useMockStore.ts
// Thin wrapper around React Query's useQuery.
// Provides the same { data, loading, error, refetch } API consumed by pages.
//
// Pass opts.key to opt in to named query keys for cache invalidation.
// Omit opts.key to use the auto-derived key (backward-compatible).
// ---------------------------------------------------------------------------

import { useQuery, useQueryClient } from '@tanstack/react-query'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseMockStoreOpts {
  /** Explicit React Query key. Required if you need cache invalidation via mutations. */
  key?: readonly unknown[]
}

export function useMockStore<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  opts?: UseMockStoreOpts
): AsyncState<T> & { refetch: () => void } {
  // Named key takes priority; fallback to auto-derived
  const queryKey = opts?.key ?? [fetcher.toString().slice(0, 150), ...deps]

  const query = useQuery<T, Error>({
    queryKey,
    queryFn: fetcher,
    staleTime: 30_000,
    retry: 1,
  })

  return {
    data: query.data ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: () => { void query.refetch() },
  }
}

/**
 * Convenience helper for imperative cache invalidation (used in mutations).
 * Usage: const invalidate = useInvalidate(); invalidate(['applications'])
 */
export function useInvalidate() {
  const qc = useQueryClient()
  return (keyPrefix: unknown[]) => {
    void qc.invalidateQueries({ queryKey: keyPrefix })
  }
}
