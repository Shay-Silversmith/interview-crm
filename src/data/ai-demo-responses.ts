// ---------------------------------------------------------------------------
// InterviewFlow — src/data/ai-demo-responses.ts
// Canned, realistic AI responses returned when no Claude API key is configured.
// Lets visitors (recruiters, classmates) experience all AI features without
// providing their own key. Output shapes mirror api/ai/_lib/schemas.ts.
// ---------------------------------------------------------------------------

import type {
  JDParserResponse,
  PrepPackResponse,
  FollowUpResponse,
  CompanyFillResponse,
  CVParseResponse,
  JDSummarizeResponse,
} from '@/services/aiClientService'

export const demoJDParser: JDParserResponse = {
  roleSummary:
    'A Product Manager role on a growth-stage B2B SaaS team, owning a customer-facing analytics product. The PM partners with engineering and design to ship data-driven features that increase activation and retention.',
  responsibilities: [
    'Define product vision and roadmap for the analytics module',
    'Lead discovery interviews with enterprise customers',
    'Write detailed PRDs and partner with eng/design on execution',
    'Define and track success metrics (activation, retention, NPS)',
    'Run A/B tests and synthesize learnings into roadmap decisions',
    'Present quarterly reviews to leadership and stakeholders',
  ],
  requirements: [
    '3+ years of product management at a B2B SaaS company',
    'Strong analytical skills — comfortable with SQL and product analytics tools',
    'Excellent written and verbal communication in English',
    'Experience shipping data-heavy or technical products',
    'Track record of leading cross-functional initiatives',
  ],
  niceToHaves: [
    'Background in data engineering or analytics',
    'Experience with enterprise customers',
    'Familiarity with Israeli tech ecosystem',
  ],
  technologies: ['SQL', 'Amplitude', 'Figma', 'Jira', 'Notion'],
  whatTheyWant:
    'An analytical PM who can balance customer empathy with rigorous metrics. They want someone who reads SQL fluently and can drive product decisions from data.',
  howIMatch: [
    'Industrial Engineering & Management — strong technical foundation and SQL proficiency',
    'Prior internship experience demonstrates ability to own ambiguous, high-stakes problems',
    'Past projects in data analytics map directly to the analytical PM profile',
  ],
  whatToEmphasize: [
    'Concrete metrics from past projects (activation lifts, time-to-value reductions)',
    'Cross-functional leadership stories from prior internship',
    'Examples of using SQL to drive product decisions',
  ],
  possibleQuestions: [
    'Walk me through a product decision you made from data',
    'How would you prioritize features for a new analytics module?',
    'Tell me about a time you disagreed with engineering on scope',
    'How do you measure success for a B2B feature?',
    'Describe your process for customer discovery',
  ],
  prepChecklist: [
    'Prepare 3 STAR stories highlighting data-driven decisions',
    'Review SQL fundamentals — joins, window functions, CTEs',
    'Study the company\'s public product changelog and recent launches',
    'Prepare 5 thoughtful questions about their analytics roadmap',
    'Practice articulating PM frameworks (RICE, Jobs-to-be-Done)',
  ],
}

export const demoPrepPack: PrepPackResponse = {
  companySnapshot:
    'A Series-B Israeli B2B SaaS company building analytics infrastructure for product teams. Recently raised $40M, growing engineering and product orgs aggressively.',
  roleSummary:
    'Product Manager on the core analytics product — owning roadmap, discovery, and shipping for enterprise customers.',
  reviewFromCV: [
    'Your university analytics project directly mirrors the technical depth they want in a PM',
    'Prior internship ownership is a strong signal for the autonomy expected here',
    'SQL fluency from coursework is exactly what they screen for in technical rounds',
  ],
  expectedHRQuestions: [
    'Why product management vs. data engineering?',
    'Tell me about yourself in 90 seconds',
    'Why this company specifically?',
    'Where do you see yourself in 3 years?',
    'Tell me about a conflict you navigated',
  ],
  expectedTechnicalQuestions: [
    'How would you design metrics for a new feature?',
    'Walk me through SQL to find weekly active users',
    'Estimate the market size for B2B analytics tools in Israel',
    'How would you A/B test a new onboarding flow?',
    'Prioritize these 5 features — show your reasoning',
  ],
  recommendedStarStories: [
    {
      situation: 'During my prior internship, a critical internal dashboard had stale data refreshing only weekly.',
      task: 'I was asked to evaluate whether to invest in real-time infrastructure.',
      action:
        'I interviewed 12 analysts, mapped their decision latency to data freshness, and built a cost model comparing three architectures.',
      result:
        'My recommendation was adopted; we shipped a near-real-time pipeline that cut analyst response time by 60% with 30% less infrastructure cost than the original proposal.',
    },
    {
      situation: 'In a university group project, our team disagreed on whether to use a relational or document database.',
      task: 'As the data lead, I needed to resolve the dispute without alienating the team.',
      action:
        'I proposed a 2-day spike: each side built a prototype with realistic data volume. We then evaluated on read latency, schema flexibility, and team familiarity.',
      result:
        'The data-driven comparison led to consensus on PostgreSQL. The project scored A and the approach became our default for resolving technical disagreements.',
    },
  ],
  questionsToAsk: [
    'What does success look like for this role at the 6-month mark?',
    'How does the PM team partner with data/analytics?',
    'What\'s the biggest product challenge facing the team right now?',
    'How are roadmap decisions made — top-down or bottom-up?',
    'What does the customer discovery process look like here?',
  ],
  finalChecklist: [
    'Review their product changelog from the last 6 months',
    'Prepare a tight "why this company" answer (2 reasons, both specific)',
    'Test camera, mic, and internet 30 minutes before',
    'Have 2-3 STAR stories ready with concrete metrics',
    'Print or open the JD on a second screen for reference',
  ],
}

export const demoFollowUp: FollowUpResponse = {
  short:
    'Hi [Name],\n\nThanks again for the conversation today — I really enjoyed hearing about the team\'s direction on the analytics roadmap. Excited about the possibility of contributing.\n\nLooking forward to next steps.\n\nBest,\nMaya',
  warm:
    'Hi [Name],\n\nReally appreciated the time today. The deep-dive into how your team approaches customer discovery was the highlight — it matches the kind of rigor I\'ve been looking for in my next role.\n\nIf it would help, I\'m happy to share more context on the analytics pipeline I built at university. Otherwise, looking forward to hearing about next steps.\n\nThanks again,\nMaya',
  linkedIn:
    'Hi [Name] — thanks for our conversation today. Loved hearing about the team\'s approach to data-driven product decisions. Hoping to stay in touch either way!',
}

export const demoCompanyFill: CompanyFillResponse = {
  industry: 'B2B SaaS · Product Analytics',
  size: '201-500',
  location: 'Tel Aviv, Israel',
  description:
    'A growth-stage analytics platform for product teams, helping companies understand user behavior and optimize activation. Raised $40M Series B in 2024 and is expanding internationally.',
  website: 'https://example.com',
  linkedinUrl: 'https://linkedin.com/company/example',
  glassdoorRating: 4.3,
  techStack: ['React', 'TypeScript', 'Python', 'PostgreSQL', 'Snowflake', 'Kafka', 'AWS'],
  disambiguation: null,
}

export const demoCVParse: CVParseResponse = {
  emphasis:
    'Strong technical foundation in data analytics and SQL, with leadership experience from a prior internship. Targeting PM and Data roles at growth-stage Israeli tech companies.',
  skillsHighlighted: ['SQL', 'Python', 'Data modeling', 'Cross-functional leadership', 'Hebrew & English'],
  projectsHighlighted: [
    'Real-time analytics pipeline (prior internship) — reduced analyst response time by 60%',
    'University senior project: B2B analytics dashboard with PostgreSQL backend',
    'Independent project: InterviewFlow — full-stack TS/React app with AI integration',
  ],
  suggestedName: 'Maya — Demo CV',
}

export const demoJDSummarize: JDSummarizeResponse = {
  headline: 'Product Manager · Analytics Platform · Tel Aviv',
  bullets: [
    'Own roadmap for the core analytics product',
    'Partner with eng and design on discovery and execution',
    '3+ years B2B SaaS PM experience required',
    'Strong SQL and data analysis skills expected',
    'Hybrid role — 3 days/week in Tel Aviv',
  ],
  bodyText:
    'Product Manager on a B2B SaaS analytics platform. The role owns vision, roadmap, and execution for the company\'s core product. Looking for an analytical PM with 3+ years of experience, strong SQL skills, and a track record of shipping data-heavy features.',
}

/** Small artificial delay so demo responses feel like real network calls. */
export function demoDelay(ms = 600): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}
