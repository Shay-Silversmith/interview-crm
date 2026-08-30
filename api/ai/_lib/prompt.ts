// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/_lib/prompt.ts
// Shared prompt fragments.
//
// Every tool is personalised off the same candidate record, so the block that
// describes them is written once. When each route built its own, they drifted:
// one sent skills, another sent only free-text background, and the STAR tool
// invented projects because it never received the real ones.
// ---------------------------------------------------------------------------

import type { Candidate } from './schemas.js'

/** Renders the candidate block, or null when there is nothing worth sending. */
export function candidateBlock(candidate?: Candidate, extraBackground?: string): string | null {
  const lines: string[] = []

  if (candidate?.name)     lines.push(`Name: ${candidate.name}`)
  if (candidate?.headline) lines.push(`Headline: ${candidate.headline}`)

  const background = candidate?.background ?? extraBackground
  if (background?.trim()) lines.push(`Background:\n${background.trim()}`)
  else if (extraBackground?.trim() && candidate?.background !== extraBackground)
    lines.push(`Background:\n${extraBackground.trim()}`)

  if (candidate?.skills?.length)      lines.push(`Skills: ${candidate.skills.join(', ')}`)
  if (candidate?.targetRoles?.length) lines.push(`Target roles: ${candidate.targetRoles.join(', ')}`)

  if (candidate?.cv) {
    lines.push(
      'CV in play:',
      `  Emphasis: ${candidate.cv.emphasis}`,
      `  Skills highlighted: ${candidate.cv.skillsHighlighted.join(', ') || '(none listed)'}`,
      `  Projects highlighted: ${candidate.cv.projectsHighlighted.join(', ') || '(none listed)'}`,
    )
  }

  if (lines.length === 0) return null
  return `CANDIDATE\n${lines.join('\n')}`
}

/**
 * The honesty clause. Without it these tools produce fluent, specific,
 * completely invented detail — a headcount for a startup nobody has heard of,
 * a STAR story about a project the candidate never worked on. An invented
 * story is worse than no story: it gets repeated in the room.
 */
export const GROUNDING_RULES = `
Grounding rules (these override any instruction to be helpful):
— Never invent facts, numbers, dates, projects, or experiences. If you do not know something, say so in the relevant field or leave it out.
— When the candidate's CV or background does not support a claim, do not make the claim. Say what is missing instead.
— Prefer specific and checkable over impressive and vague.
— Do not pad lists to hit a count. Fewer, better items beat filler.`

/** Same clause, for the grounded (search-backed) routes. */
export const RESEARCH_RULES = `
Research rules (these override any instruction to be helpful):
— Search the web before answering. Base every claim on what the results actually say.
— Attach a date to anything time-sensitive (funding, layoffs, launches, leadership). An undated "recently" is how a two-year-old fact gets repeated in an interview as news.
— If the search results do not establish a field, say so plainly or return an empty list. Do not fill it from memory.
— Do not state a headcount, valuation, or rating you did not see in a result.
— Return ONLY the JSON object: no prose before or after it, no markdown fences.`
