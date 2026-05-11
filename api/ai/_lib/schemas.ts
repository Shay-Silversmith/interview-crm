// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/_lib/schemas.ts
// Zod schemas for every AI function's request body and response data.
// Shared between the handler files and the claude wrapper.
// ---------------------------------------------------------------------------

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

const nonEmptyStr = z.string().min(1).max(30_000)

/**
 * Optional output-language hint sent by the frontend.
 * 'en'  → English output (default for all tools).
 * 'he'  → Hebrew output for content-heavy tools (prep-pack, follow-up).
 *
 * JD Parser intentionally ignores this field — job descriptions are written
 * in English and structured output (responsibilities, requirements, …) reads
 * better in its source language. See docs/ai-functions.md for rationale.
 */
const localeField = z.enum(['en', 'he']).default('en').optional()

// ---------------------------------------------------------------------------
// JD Parser
// ---------------------------------------------------------------------------

export const jdParserRequestSchema = z.object({
  jdText:          nonEmptyStr,
  roleTitle:       z.string().max(200).optional(),
  userBackground:  z.string().max(2000).optional(),
  // Accepted for API consistency but NOT used — JD output stays English.
  locale:          localeField,
})

export const jdParserResponseSchema = z.object({
  roleSummary:         z.string(),
  responsibilities:    z.array(z.string()).min(1),
  requirements:        z.array(z.string()).min(1),
  niceToHaves:         z.array(z.string()),
  technologies:        z.array(z.string()),
  whatTheyWant:        z.string(),
  howIMatch:           z.array(z.string()),
  whatToEmphasize:     z.array(z.string()),
  possibleQuestions:   z.array(z.string()),
  prepChecklist:       z.array(z.string()),
})

export type JDParserRequest  = z.infer<typeof jdParserRequestSchema>
export type JDParserResponse = z.infer<typeof jdParserResponseSchema>

// ---------------------------------------------------------------------------
// Prep Pack
// ---------------------------------------------------------------------------

const starStorySchema = z.object({
  situation: z.string(),
  task:      z.string(),
  action:    z.string(),
  result:    z.string(),
})

export const prepPackRequestSchema = z.object({
  application: z.object({
    title:          z.string().max(200),
    company:        z.string().max(200),
    stage:          z.string().max(100),
    jdText:         z.string().max(20_000).optional(),
    aiRoleSummary:  z.string().max(2000).optional(),
    notes:          z.string().max(3000).optional(),
  }),
  cv: z.object({
    emphasis:            z.string().max(1000),
    skillsHighlighted:   z.array(z.string()),
    projectsHighlighted: z.array(z.string()),
  }).nullable(),
  company: z.object({
    name:               z.string().max(200),
    summary:            z.string().max(2000).optional(),
    productDescription: z.string().max(2000).optional(),
  }).nullable(),
  pastInterviews: z.array(z.object({
    type:         z.string(),
    questions:    z.array(z.string()),
    roughAnswers: z.array(z.string()),
    takeaways:    z.string(),
  })),
  userBackground: z.string().max(3000),
  interviewType:  z.string().max(200),
  locale:         localeField,
})

export const prepPackResponseSchema = z.object({
  companySnapshot:             z.string(),
  roleSummary:                 z.string(),
  reviewFromCV:                z.array(z.string()),
  expectedHRQuestions:         z.array(z.string()),
  expectedTechnicalQuestions:  z.array(z.string()),
  recommendedStarStories:      z.array(starStorySchema),
  questionsToAsk:              z.array(z.string()),
  finalChecklist:              z.array(z.string()),
})

export type PrepPackRequest  = z.infer<typeof prepPackRequestSchema>
export type PrepPackResponse = z.infer<typeof prepPackResponseSchema>

// ---------------------------------------------------------------------------
// Follow-up
// ---------------------------------------------------------------------------

export const followUpRequestSchema = z.object({
  messageType:  z.enum(['post-interview', 'ping-after-silence', 'thank-you', 'decline-politely']),
  company:      z.string().max(200),
  contactName:  z.string().max(200),
  role:         z.string().max(200),
  tone:         z.enum(['professional', 'warm', 'casual']),
  context:      z.string().max(2000),
  locale:       localeField,
})

export const followUpResponseSchema = z.object({
  short:    z.string(),
  warm:     z.string(),
  linkedIn: z.string(),
})

export type FollowUpRequest  = z.infer<typeof followUpRequestSchema>
export type FollowUpResponse = z.infer<typeof followUpResponseSchema>

// ---------------------------------------------------------------------------
// Company auto-fill
// ---------------------------------------------------------------------------

const companySize = z.enum([
  '1-10', '11-50', '51-200', '201-500', '501-2000', '2001-10000', '10000+',
])

export const companyFillRequestSchema = z.object({
  companyName: z.string().min(1).max(200),
  hint:        z.string().max(500).optional(),  // optional disambiguator e.g. "the Israeli AI startup"
  locale:      localeField,
})

export const companyFillResponseSchema = z.object({
  industry:        z.string(),
  size:            companySize.nullable().optional(),
  location:        z.string(),
  description:     z.string(),
  website:         z.string().nullable().optional(),
  linkedinUrl:     z.string().nullable().optional(),
  glassdoorRating: z.number().min(0).max(5).nullable().optional(),
  techStack:       z.array(z.string()),
  /** Optional disambiguation note when multiple matching companies exist. */
  disambiguation:  z.string().nullable().optional(),
})

export type CompanyFillRequest  = z.infer<typeof companyFillRequestSchema>
export type CompanyFillResponse = z.infer<typeof companyFillResponseSchema>

// ---------------------------------------------------------------------------
// CV parse — extract structured highlights from an uploaded resume
// ---------------------------------------------------------------------------

export const cvParseRequestSchema = z.object({
  fileName:   z.string().min(1).max(300),
  mimeType:   z.string().min(1).max(120),
  /** Base64-encoded file content. ~7MB cap to stay under Vercel's body limit. */
  base64Data: z.string().min(1).max(10_000_000),
  locale:     localeField,
})

export const cvParseResponseSchema = z.object({
  emphasis:            z.string(),
  skillsHighlighted:   z.array(z.string()),
  projectsHighlighted: z.array(z.string()),
  suggestedName:       z.string(),
})

export type CVParseRequest  = z.infer<typeof cvParseRequestSchema>
export type CVParseResponse = z.infer<typeof cvParseResponseSchema>

// ---------------------------------------------------------------------------
// JD Summarize — turn a pasted URL or text into a clean bullet summary
// ---------------------------------------------------------------------------

export const jdSummarizeRequestSchema = z
  .object({
    jdUrl:  z.string().url().optional(),
    jdText: z.string().max(30_000).optional(),
    locale: localeField,
  })
  .refine(d => !!d.jdUrl || !!d.jdText, { message: 'Either jdUrl or jdText is required' })

export const jdSummarizeResponseSchema = z.object({
  /** Short headline summarising the role in 1 sentence. */
  headline: z.string(),
  /** 6-10 bullet points covering responsibilities, requirements, perks, etc. */
  bullets:  z.array(z.string()).min(1),
  /** Plain-text body ready to drop straight into the JD textarea. */
  bodyText: z.string(),
})

export type JDSummarizeRequest  = z.infer<typeof jdSummarizeRequestSchema>
export type JDSummarizeResponse = z.infer<typeof jdSummarizeResponseSchema>
