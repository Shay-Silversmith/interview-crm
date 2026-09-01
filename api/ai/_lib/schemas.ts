// ---------------------------------------------------------------------------
// InterviewFlow — api/ai/_lib/schemas.ts
// Zod schemas for every AI function's request body and response data.
// Shared between the handler files and the gemini wrapper.
// ---------------------------------------------------------------------------

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

const nonEmptyStr = z.string().min(1).max(30_000)

/**
 * Optional output-language hint sent by the frontend.
 * 'en' → English. 'he' → Hebrew.
 *
 * Every tool honours this now. The old carve-out for the JD parser assumed the
 * user reads the analysis in the JD's own language; in practice the analysis is
 * the part they read closely, and reading it in Hebrew is the whole point of
 * the language toggle.
 */
const localeField = z.enum(['en', 'he']).default('en').optional()

/** Shared "who is this candidate" block, sent by every personalised tool. */
export const candidateSchema = z.object({
  name:        z.string().max(120).optional(),
  headline:    z.string().max(400).optional(),
  background:  z.string().max(4000).optional(),
  skills:      z.array(z.string()).max(60).optional(),
  targetRoles: z.array(z.string()).max(20).optional(),
  cv: z.object({
    emphasis:            z.string().max(2000),
    skillsHighlighted:   z.array(z.string()).max(80),
    projectsHighlighted: z.array(z.string()).max(60),
  }).nullable().optional(),
})

export type Candidate = z.infer<typeof candidateSchema>


/**
 * Research-backed tools run in two stages, and the client may ask for one at a
 * time. Together they can exceed the host's 60-second function limit; as two
 * requests each gets its own clock, for the same two Gemini calls and the same
 * quota. Omitting the field runs both, which is right for the fast routes.
 */
const stageField = z.enum(['research', 'structure']).optional()

/** Stage-two input: notes produced by stage one, to be reshaped. */
const researchField = z.string().max(60_000).optional()

/** A web source the model actually consulted, surfaced so claims are checkable. */
export const sourceSchema = z.object({
  title: z.string().optional(),
  uri:   z.string().optional(),
})

// ---------------------------------------------------------------------------
// JD Parser / Role analysis
// ---------------------------------------------------------------------------

export const jdParserRequestSchema = z
  .object({
    jdText:         z.string().max(30_000).optional(),
    /** Link to the posting on LinkedIn or the company careers site. */
    jdUrl:          z.string().url().max(2000).optional(),
    roleTitle:      z.string().max(200).optional(),
    companyName:    z.string().max(200).optional(),
    userBackground: z.string().max(4000).optional(),
    candidate:      candidateSchema.optional(),
    locale:         localeField,
  })
  .refine(d => (d.jdText && d.jdText.trim().length > 20) || d.jdUrl, {
    message: 'Paste the job description, or give a link to the posting.',
  })

const fitLevel = z.enum(['strong', 'partial', 'gap'])

export const jdParserResponseSchema = z.object({
  roleSummary:        z.string(),
  seniority:          z.string(),
  responsibilities:   z.array(z.string()).min(1),
  requirements:       z.array(z.string()).min(1),
  niceToHaves:        z.array(z.string()),
  technologies:       z.array(z.string()),
  whatTheyWant:       z.string(),
  /** Requirement-by-requirement read on the candidate, not a vague blurb. */
  fitAnalysis: z.array(z.object({
    requirement: z.string(),
    level:       fitLevel,
    evidence:    z.string(),
  })).default([]),
  howIMatch:          z.array(z.string()),
  gapsToAddress:      z.array(z.string()).default([]),
  whatToEmphasize:    z.array(z.string()),
  possibleQuestions:  z.array(z.string()),
  prepChecklist:      z.array(z.string()),
  /** Present only when the posting was read from a URL and something was off. */
  sourceNote:         z.string().nullable().optional(),
})

export type JDParserRequest  = z.infer<typeof jdParserRequestSchema>
export type JDParserResponse = z.infer<typeof jdParserResponseSchema>

// ---------------------------------------------------------------------------
// Prep Pack
// ---------------------------------------------------------------------------

const starStorySchema = z.object({
  title:     z.string().default(''),
  situation: z.string(),
  task:      z.string(),
  action:    z.string(),
  result:    z.string(),
})

export const prepPackRequestSchema = z.object({
  application: z.object({
    title:         z.string().max(200),
    company:       z.string().max(200),
    stage:         z.string().max(100),
    jdText:        z.string().max(20_000).optional(),
    jdUrl:         z.string().max(2000).optional(),
    aiRoleSummary: z.string().max(6000).optional(),
    notes:         z.string().max(3000).optional(),
  }),
  cv: z.object({
    emphasis:            z.string().max(2000),
    skillsHighlighted:   z.array(z.string()),
    projectsHighlighted: z.array(z.string()),
  }).nullable(),
  company: z.object({
    name:               z.string().max(200),
    summary:            z.string().max(4000).optional(),
    productDescription: z.string().max(2000).optional(),
  }).nullable(),
  pastInterviews: z.array(z.object({
    type:         z.string(),
    questions:    z.array(z.string()),
    roughAnswers: z.array(z.string()),
    takeaways:    z.string(),
  })),
  userBackground: z.string().max(4000),
  interviewType:  z.string().max(200),
  /** When true the pack is researched against the live web, not memory. */
  research:       z.boolean().default(true).optional(),
  locale:         localeField,
  stage:          stageField,
  /** Stage-two input. Named separately because the flag above is also "research". */
  researchNotes:  researchField,
})

/**
 * Split for the same reason as the company briefing, along the seam that was
 * already there: half of a prep pack needs the live web and half needs only the
 * candidate's CV and the job description. Running them as two parallel requests
 * gives each its own function timeout, and the CV half — which needs no
 * searching — comes back quickly regardless of how the research half fares.
 *
 * Half one: what the web says about the company and its loop.
 */
export const prepResearchResponseSchema = z.object({
  companySnapshot:     z.string(),
  expectedHRQuestions: z.array(z.string()).default([]),
  questionsToAsk:      z.array(z.string()).default([]),
  redFlagsToProbe:     z.array(z.string()).default([]),
})

/** Half two: what this candidate should say, from their own material. */
export const prepPlanResponseSchema = z.object({
  roleSummary:                z.string(),
  reviewFromCV:               z.array(z.string()).default([]),
  expectedTechnicalQuestions: z.array(z.string()).default([]),
  recommendedStarStories:     z.array(starStorySchema).default([]),
  /** Concrete study items, each with a reason, so the checklist is arguable. */
  finalChecklist:             z.array(z.string()).default([]),
  /** What to do with the last hour before the call. */
  dayOfPlan:                  z.array(z.string()).default([]),
})

export type PrepPackRequest      = z.infer<typeof prepPackRequestSchema>
export type PrepResearchResponse = z.infer<typeof prepResearchResponseSchema>
export type PrepPlanResponse     = z.infer<typeof prepPlanResponseSchema>

// ---------------------------------------------------------------------------
// Follow-up
// ---------------------------------------------------------------------------

export const followUpRequestSchema = z.object({
  messageType: z.enum(['post-interview', 'ping-after-silence', 'thank-you', 'decline-politely']),
  company:     z.string().max(200),
  contactName: z.string().max(200),
  contactTitle: z.string().max(200).optional(),
  role:        z.string().max(200),
  tone:        z.enum(['professional', 'warm', 'casual']),
  context:     z.string().max(4000),
  candidate:   candidateSchema.optional(),
  locale:      localeField,
})

export const followUpResponseSchema = z.object({
  short:    z.string(),
  warm:     z.string(),
  linkedIn: z.string(),
  /** Subject line for the two email variants. */
  subject:  z.string().default(''),
})

export type FollowUpRequest  = z.infer<typeof followUpRequestSchema>
export type FollowUpResponse = z.infer<typeof followUpResponseSchema>

// ---------------------------------------------------------------------------
// Company auto-fill (used by the Company form)
// ---------------------------------------------------------------------------

const companySize = z.enum([
  '1-10', '11-50', '51-200', '201-500', '501-2000', '2001-10000', '10000+',
])

export const companyFillRequestSchema = z.object({
  companyName: z.string().min(1).max(200),
  hint:        z.string().max(500).optional(),
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
  disambiguation:  z.string().nullable().optional(),
})

export type CompanyFillRequest  = z.infer<typeof companyFillRequestSchema>
export type CompanyFillResponse = z.infer<typeof companyFillResponseSchema>

// ---------------------------------------------------------------------------
// Company brief — the interview-facing research report.
//
// Distinct from company-fill, which fills CRM columns. This one answers
// "what do I need to know about this company before I walk into the room",
// and every claim is grounded in search results the UI can link to.
// ---------------------------------------------------------------------------

export const companyBriefRequestSchema = z.object({
  companyName: z.string().min(1).max(200),
  roleTitle:   z.string().max(200).optional(),
  /** Disambiguator, e.g. "the Israeli cloud-security startup". */
  hint:        z.string().max(500).optional(),
  /** Company site / LinkedIn / careers page the model should read directly. */
  urls:        z.array(z.string().url()).max(5).optional(),
  candidate:   candidateSchema.optional(),
  locale:      localeField,
  stage:       stageField,
  research:    researchField,
})

/**
 * The brief is split across two endpoints, and the split is load-bearing rather
 * than cosmetic. Deployed functions get about 60 seconds; one grounded call
 * that searches the web and then writes sixteen fields does not reliably fit.
 * Two halves, requested in parallel, are two separate invocations — each with
 * its own clock and half the writing to do — so wall time is the slower of the
 * two rather than the sum, and a stall in one still leaves the other on screen.
 *
 * Half one: what the company is.
 */
export const companyProfileResponseSchema = z.object({
  /** One line a candidate could say out loud to show they did the reading. */
  headline:      z.string(),
  whatTheyDo:    z.string(),
  products:      z.array(z.string()).default([]),
  businessModel: z.string().default(''),
  customers:     z.string().default(''),
  scale:         z.string().default(''),
  /** Dated items. Undated "recent news" is how a stale fact becomes a gaffe. */
  recentNews: z.array(z.object({
    date:         z.string(),
    item:         z.string(),
    whyItMatters: z.string().default(''),
  })).default([]),
  competitors:   z.array(z.string()).default([]),
  /** Israeli site / team presence — the difference between HQ and the office. */
  localPresence: z.string().nullable().optional(),
  techStack:     z.array(z.string()).default([]),
  /** Set when the name was ambiguous and a guess had to be made. */
  disambiguation: z.string().nullable().optional(),
})

/** Half two: what to do with it in the room. */
export const companyInterviewResponseSchema = z.object({
  /** What the hiring loop actually looks like, per public accounts. */
  interviewProcess: z.array(z.string()).default([]),
  culture:          z.array(z.string()).default([]),
  /** Lines to work into answers that prove genuine research. */
  talkingPoints:    z.array(z.string()).default([]),
  questionsToAsk:   z.array(z.string()).default([]),
  /** Public criticism worth knowing about, stated neutrally. */
  watchOuts:        z.array(z.string()).default([]),
  /** Why this candidate specifically fits — empty when no CV was sent. */
  whyYouFit:        z.array(z.string()).default([]),
})

export type CompanyBriefRequest     = z.infer<typeof companyBriefRequestSchema>
export type CompanyProfileResponse  = z.infer<typeof companyProfileResponseSchema>
export type CompanyInterviewResponse = z.infer<typeof companyInterviewResponseSchema>

// ---------------------------------------------------------------------------
// Interview debrief — unordered notes in, an organised record out.
// ---------------------------------------------------------------------------

export const interviewDebriefRequestSchema = z.object({
  notes:         z.string().min(10).max(30_000),
  company:       z.string().max(200).optional(),
  role:          z.string().max(200).optional(),
  interviewType: z.string().max(120).optional(),
  interviewer:   z.string().max(200).optional(),
  interviewedAt: z.string().max(60).optional(),
  candidate:     candidateSchema.optional(),
  locale:        localeField,
})

export const interviewDebriefResponseSchema = z.object({
  headline:  z.string(),
  overview:  z.string(),
  /** Reconstructed Q&A. answerGiven stays faithful to the notes. */
  questionsAsked: z.array(z.object({
    question:    z.string(),
    answerGiven: z.string().default(''),
    assessment:  z.string().default(''),
  })).default([]),
  topicsCovered:      z.array(z.string()).default([]),
  /** Facts about the role, team, or company that came out of the conversation. */
  learnedAboutRole:   z.array(z.string()).default([]),
  wentWell:           z.array(z.string()).default([]),
  couldImprove:       z.array(z.string()).default([]),
  /** Things asked that went unanswered — the actual study list. */
  unansweredQuestions: z.array(z.string()).default([]),
  /** Signals of how it landed, hedged honestly rather than reassuringly. */
  signalsRead:        z.array(z.string()).default([]),
  nextSteps:          z.array(z.string()).default([]),
  followUpActions:    z.array(z.string()).default([]),
  prepForNextRound:   z.array(z.string()).default([]),
  /** The whole debrief as clean markdown, for copying into notes. */
  markdown:           z.string(),
})

export type InterviewDebriefRequest  = z.infer<typeof interviewDebriefRequestSchema>
export type InterviewDebriefResponse = z.infer<typeof interviewDebriefResponseSchema>

// ---------------------------------------------------------------------------
// STAR answers — questions and model answers built from the CV and the JD.
// ---------------------------------------------------------------------------

export const starAnswersRequestSchema = z.object({
  role:        z.string().max(200),
  company:     z.string().max(200),
  jdText:      z.string().max(20_000).optional(),
  jdUrl:       z.string().url().max(2000).optional(),
  /** Ask for answers to a specific question instead of generated ones. */
  question:    z.string().max(1000).optional(),
  /**
   * The candidate's own rough answer, to be restructured rather than replaced.
   * When present the model reshapes what they wrote instead of inventing from
   * the CV — a different job, and the one people actually want once they have
   * something down on paper.
   */
  draftAnswer: z.string().max(8000).optional(),
  /**
   * How the answer should be shaped. Not every question wants a story — salary
   * expectations answered in STAR is a worse answer, not a better one — so the
   * caller says which, and 'direct' returns a concise reply instead.
   */
  answerStyle: z.enum(['star', 'direct']).default('star').optional(),
  /** Behavioural themes to bias toward, e.g. Amazon leadership principles. */
  focus:       z.string().max(500).optional(),
  count:       z.number().int().min(1).max(8).default(4).optional(),
  candidate:   candidateSchema.optional(),
  locale:      localeField,
})

export const starAnswersResponseSchema = z.object({
  answers: z.array(z.object({
    question:      z.string(),
    /** Why this question shows up for this role — makes the list arguable. */
    whyAsked:      z.string().default(''),
    /** Which CV item the story is built on, so invention is visible. */
    basedOn:       z.string().default(''),
    situation:     z.string(),
    task:          z.string(),
    action:        z.string(),
    result:        z.string(),
    /** 60-90 second version to actually say out loud. */
    spokenAnswer:  z.string().default(''),
    deliveryTips:  z.array(z.string()).default([]),
    followUps:     z.array(z.string()).default([]),
  })).min(1),
  /** Flagged when the CV was too thin to ground a story honestly. */
  coverageNote: z.string().nullable().optional(),
})

export type StarAnswersRequest  = z.infer<typeof starAnswersRequestSchema>
export type StarAnswersResponse = z.infer<typeof starAnswersResponseSchema>

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
  /** Raw-ish text of the CV, reused as candidate context by the other tools. */
  extractedText:       z.string().default(''),
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
  headline: z.string(),
  bullets:  z.array(z.string()).min(1),
  bodyText: z.string(),
})

export type JDSummarizeRequest  = z.infer<typeof jdSummarizeRequestSchema>
export type JDSummarizeResponse = z.infer<typeof jdSummarizeResponseSchema>

// ---------------------------------------------------------------------------
// Application autofill — a posting link in, CRM fields out
// ---------------------------------------------------------------------------

export const applicationFillRequestSchema = z
  .object({
    jdUrl:  z.string().url().max(2000).optional(),
    jdText: z.string().max(30_000).optional(),
    locale: localeField,
    stage:  stageField,
    research: researchField,
  })
  .refine(d => !!d.jdUrl || (d.jdText && d.jdText.trim().length > 20), {
    message: 'Give a link to the posting, or paste its text.',
  })

/**
 * Every field is nullable on purpose. A posting that does not state a salary
 * must come back with null, not a plausible guess — these values are written
 * straight into the form, and an invented salary band becomes a fact the
 * candidate negotiates against.
 */
export const applicationFillResponseSchema = z.object({
  companyName:  z.string().nullable(),
  roleName:     z.string().nullable(),
  location:     z.string().nullable(),
  workModel:    z.enum(['On-site', 'Hybrid', 'Remote']).nullable(),
  jobScope:     z.enum(['Full-time', '4 days', '3 days', '2 days']).nullable(),
  salaryMin:    z.number().nullable(),
  salaryMax:    z.number().nullable(),
  salaryType:   z.enum(['Hourly', 'Monthly']).nullable(),
  currency:     z.string().nullable(),
  jobDescription: z.string().nullable(),
  whyInteresting: z.string().nullable(),
  /** Named so the UI can show what the posting did not say. */
  notFound:     z.array(z.string()).default([]),
  sourceNote:   z.string().nullable().optional(),
})

export type ApplicationFillRequest  = z.infer<typeof applicationFillRequestSchema>
export type ApplicationFillResponse = z.infer<typeof applicationFillResponseSchema>
