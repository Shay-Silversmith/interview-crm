// ---------------------------------------------------------------------------
// InterviewFlow — fitScore.ts
// Turns the Role Analysis fit table into a single 0-100 score.
//
// Derived rather than generated: the analysis already rates the candidate
// against each requirement, so the score costs no API call and cannot disagree
// with the table it is shown next to. Asking a model for "a fit score" instead
// would produce a number with nothing behind it — and one that could contradict
// the very breakdown sitting above it on the page.
// ---------------------------------------------------------------------------

/** One requirement rated against the candidate. Mirrors FitItem. */
export interface FitLike {
  level: 'strong' | 'partial' | 'gap' | string
}

/** A gap is not worth zero — a candidate missing one requirement of eight is
 *  not "no fit" — but it has to cost enough that gaps are visible in the score. */
const WEIGHTS: Record<string, number> = {
  strong:  1,
  partial: 0.5,
  gap:     0,
}

export interface FitBreakdown {
  score:   number
  strong:  number
  partial: number
  gap:     number
  total:   number
}

/**
 * Null when there is nothing to score from, so callers can tell "no analysis
 * yet" apart from "analysed and scored zero" — which are very different things
 * to show someone.
 */
export function computeFit(items: FitLike[] | undefined | null): FitBreakdown | null {
  if (!items || items.length === 0) return null

  let sum = 0
  const counts = { strong: 0, partial: 0, gap: 0 }

  for (const item of items) {
    const level = String(item.level).toLowerCase()
    sum += WEIGHTS[level] ?? 0
    if (level in counts) counts[level as keyof typeof counts]++
  }

  return {
    score:   Math.round((sum / items.length) * 100),
    strong:  counts.strong,
    partial: counts.partial,
    gap:     counts.gap,
    total:   items.length,
  }
}

/** Reads the fit table out of a saved aiRoleSummary blob, whatever its shape. */
export function fitFromRoleSummary(summary: unknown): FitBreakdown | null {
  if (!summary || typeof summary !== 'object') return null
  const analysis = (summary as { fitAnalysis?: unknown }).fitAnalysis
  return Array.isArray(analysis) ? computeFit(analysis as FitLike[]) : null
}
