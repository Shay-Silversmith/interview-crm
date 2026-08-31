// ---------------------------------------------------------------------------
// InterviewFlow — question-bank.ts
// Questions organised by the round you are walking into.
//
// Static and curated rather than generated: it costs nothing against the Gemini
// daily quota, it is instant, and the same question phrased the same way every
// time is what makes a saved answer reusable across processes. Compiled from
// the questions that recur across current interview guides (Hiration, The Muse,
// Coursera, BetterUp, HRMorning, Indeed, BigPanda Engineering, AlgoCademy,
// Exponent, Product School, IGotAnOffer, InterviewQuery, Datavidhya, Novoresume)
// rather than invented.
//
// Two flags carry most of the value:
//   `why`  — what the interviewer is actually testing, which is usually the
//            harder half of the question.
//   `star` — whether a story answer fits. STAR is a way of answering, not a
//            category of question, so the "restructure into STAR" action is
//            offered only where it belongs. Offering it on "explain a LEFT
//            JOIN" teaches the wrong instinct.
// ---------------------------------------------------------------------------

import type { PrepCategory, RoleFamily } from '@/lib/enums'

export interface BankQuestion {
  question: string
  /** What the question is really probing. */
  why:      string
  /** True when the expected answer is a story — the STAR helper applies. */
  star?:    boolean
}

// ---------------------------------------------------------------------------
// Rounds
// ---------------------------------------------------------------------------

const PHONE_SCREEN: BankQuestion[] = [
  { question: 'Tell me about yourself.',
    why: 'Your 90-second narrative. On a screen call this is most of the decision.' },
  { question: 'Walk me through your CV.',
    why: 'Coherence — do the moves add up to a direction, or look random.' },
  { question: 'Why are you looking to move right now?',
    why: 'Whether you are running toward something or away from something.' },
  { question: 'What do you know about us?',
    why: 'The cheapest question to prepare and the most common one to fail.' },
  { question: 'Why this role specifically?',
    why: 'Whether you read the posting or applied to everything.' },
  { question: 'What are your salary expectations?',
    why: 'Asked early and often offhand. Give a researched range, and set its bottom at the number you actually want — they hear the low end.' },
  { question: 'What is your notice period, and when could you start?',
    why: 'Logistics, but a vague answer reads as not serious.' },
  { question: 'Are you interviewing anywhere else?',
    why: 'Your market position. Honest and brief beats either extreme.' },
  { question: 'Is the location and work model workable for you?',
    why: 'Screens exist to catch dealbreakers early. Do not discover yours later.' },
  { question: 'Do you have any questions for me?',
    why: 'Ask about the loop and the timeline — this is your cheapest information.' },
]

const MANAGER: BankQuestion[] = [
  { question: 'What does success look like for you in the first six months?',
    why: 'Whether you think in outcomes or in tasks.' },
  { question: 'Tell me about a time you disagreed with your manager.',
    why: 'Whether you can push back without becoming a problem.', star: true },
  { question: 'How do you like to be managed?',
    why: 'Fit with how this manager actually works. Answer honestly — a mismatch found now is cheaper than one found later.' },
  { question: 'Tell me about a time you owned something end to end.',
    why: 'Autonomy. Managers are hiring for the part they will not have to watch.', star: true },
  { question: 'Describe a time a project went wrong on your watch.',
    why: 'Ownership without blame-shifting. What you changed afterwards is the answer.', star: true },
  { question: 'How do you prioritise when everything is urgent?',
    why: 'Your logic said out loud, not that you "work hard".' },
  { question: 'Tell me about a time you had to give someone difficult feedback.',
    why: 'Whether you avoid conflict or handle it.', star: true },
  { question: 'What kind of work do you want more of, and less of?',
    why: 'Whether this role can actually give you that.' },
  { question: 'How do you keep stakeholders informed when things slip?',
    why: 'Early warning versus surprise. Managers care about this more than about the slip.' },
  { question: 'What questions do you have about the team?',
    why: 'Ask about churn, how decisions get made, and what the last person did.' },
]

const HR_PERSONALITY: BankQuestion[] = [
  { question: 'Tell me about a time you worked with a difficult colleague.',
    why: 'Do you attack the person or the problem.', star: true },
  { question: 'Tell me about a time you failed.',
    why: 'Real ownership. A failure that was someone else’s fault does not count.', star: true },
  { question: 'Describe a time you had to persuade someone without authority.',
    why: 'Influence, which is most of the job in any cross-functional role.', star: true },
  { question: 'Tell me about a time you received hard feedback.',
    why: 'What you changed afterwards — that is the whole answer.', star: true },
  { question: 'Describe a time you had to learn something quickly.',
    why: 'Your actual method, not that you are "a fast learner".', star: true },
  { question: 'Tell me about a time you took the lead without being asked.',
    why: 'Initiative, and whether you can see past your own task.', star: true },
  { question: 'Tell me about a time you had to meet an impossible deadline.',
    why: 'What you cut, and how you decided what to cut.', star: true },
  { question: 'Describe a time you handled competing priorities.',
    why: 'Your prioritisation logic, in a real situation.', star: true },
  { question: 'What are your strengths and weaknesses?',
    why: 'A real weakness with a real correction, not a disguised strength.' },
  { question: 'What kind of environment do you do your best work in?',
    why: 'Culture fit, and whether you have thought about how you work.' },
  { question: 'Where do you want to be in three years?',
    why: 'Whether this role is a step on your path or a stopgap.' },
]

const HOME_ASSIGNMENT: BankQuestion[] = [
  { question: 'Walk me through your solution.',
    why: 'Structure first, code second. Lead with the shape, then the detail.' },
  { question: 'Why did you structure it this way?',
    why: 'The core question of this round — every choice should have a reason.' },
  { question: 'What trade-offs did you make?',
    why: 'Naming what you gave up is what separates a decision from a default.' },
  { question: 'What did you deliberately leave out, and why?',
    why: 'Scoping judgement. "I ran out of time" is weaker than "I chose not to".' },
  { question: 'What would you do differently with another week?',
    why: 'Whether you can criticise your own work before they do.' },
  { question: 'How would this behave with 100× the data or users?',
    why: 'Scaling. Asked in almost every review, per published accounts.' },
  { question: 'How did you test it, and what is not covered?',
    why: 'Honesty about coverage beats claiming it is fully tested.' },
  { question: 'How does it handle bad or missing input?',
    why: 'Edge cases are where reviewers look first.' },
  { question: 'Which part are you least happy with?',
    why: 'Self-awareness. Have one answer ready — "none" reads badly.' },
  { question: 'What alternative approaches did you consider and reject?',
    why: 'Shows the space you searched, not just the point you landed on.' },
  { question: 'Are there security or privacy concerns in your approach?',
    why: 'Frequently asked and frequently unprepared for.' },
  { question: 'How long did it actually take you?',
    why: 'Answer honestly. Inflated or deflated numbers both read badly.' },
]

const OTHER: BankQuestion[] = [
  { question: 'Why do you want to work here?',
    why: 'Works in any round, and gets asked in most of them.' },
  { question: 'Tell me about a time you had measurable impact.',
    why: 'A real number wins any room.', star: true },
  { question: 'What questions do you have for us?',
    why: 'Never "no". This is scored in every round.' },
]

// ---------------------------------------------------------------------------
// The professional round, by role family
// ---------------------------------------------------------------------------

const PROFESSIONAL_COMMON: BankQuestion[] = [
  { question: 'Walk me through a project you are proud of.',
    why: 'The anchor question. They will drill into whatever you claim, so claim carefully.', star: true },
  { question: 'What was the hardest problem you have debugged, and how?',
    why: 'Your method, not the bug. Narrate the search, not the answer.', star: true },
  { question: 'What would you do differently if you rebuilt your last project?',
    why: 'Whether you learn from your own work.' },
  { question: 'How do you make sure your work is correct?',
    why: 'Testing habits, and whether quality is a step or an afterthought.' },
]

export const ROLE_FAMILY_QUESTIONS: Record<RoleFamily, BankQuestion[]> = {
  'Software Engineering': [
    { question: 'Explain a technical concept from your work to a non-technical person.',
      why: 'Communication, tested more than people expect.' },
    { question: 'How do you decide between building something and using a library?',
      why: 'Engineering judgement and awareness of long-term cost.' },
    { question: 'Walk me through how you would design this feature.',
      why: 'Ask clarifying questions before designing. That is half the score.' },
    { question: 'What happens when this code runs on ten times the load?',
      why: 'Complexity and bottlenecks, in your own code.' },
    { question: 'How do you handle errors you cannot recover from?',
      why: 'Failure modes, logging, and what the user sees.' },
    { question: 'Talk me through your code review process.',
      why: 'How you work with people, expressed through code.' },
  ],

  'Data Engineering': [
    { question: 'Walk me through a pipeline you built, end to end.',
      why: 'Sources, transforms, orchestration, monitoring.', star: true },
    { question: 'What is the difference between ETL and ELT, and when do you pick each?',
      why: 'Where the compute lives, and why the warehouse changed the answer.' },
    { question: 'How do you make a pipeline fault tolerant?',
      why: 'Retries, idempotency, backfills. Idempotency is the word they wait for.' },
    { question: 'A nightly job failed and nobody noticed for three days. What went wrong?',
      why: 'Monitoring and ownership of data after it lands.' },
    { question: 'Write a query to find the second-highest salary per department.',
      why: 'Window functions — the single most common SQL screen question.' },
    { question: 'Explain RANK, DENSE_RANK, and ROW_NUMBER.',
      why: 'Tie handling. Asked precisely because most people blur them.' },
    { question: 'How would you find and remove duplicate rows?',
      why: 'ROW_NUMBER() over a partition. Classic and constant.' },
    { question: 'A query is slow. How do you diagnose it?',
      why: 'Execution plan, indexes, cardinality — a method, not a guess.' },
    { question: 'How would you model this data in a warehouse?',
      why: 'Star schema, grain, slowly changing dimensions.' },
    { question: 'How do you handle late-arriving or out-of-order data?',
      why: 'Watermarks and reprocessing — separates experience from courses.' },
    { question: 'How do you read a CSV too large to fit in memory?',
      why: 'Chunking, dtypes, generators. Practical Python, not theory.' },
  ],

  'Data Analysis / BI': [
    { question: 'Explain the difference between INNER, LEFT, and FULL OUTER JOIN.',
      why: 'The baseline. Getting it slightly wrong ends the round early.' },
    { question: 'When would you use a window function instead of GROUP BY?',
      why: 'One aggregates rows away and one does not.' },
    { question: 'A dashboard number looks wrong. How do you investigate?',
      why: 'Tracing back to the source, not defending the number.' },
    { question: 'How do you decide which metric answers a business question?',
      why: 'Whether you interrogate the question before querying.' },
    { question: 'How would you explain a statistical result to a sceptical stakeholder?',
      why: 'Translation, which is most of the job.' },
    { question: 'Tell me about an analysis that changed a decision.',
      why: 'Impact, not output. The decision is the point.', star: true },
  ],

  'Data Science / ML': [
    { question: 'Walk me through a model you built and how you evaluated it.',
      why: 'Metric choice and whether it matched the business problem.', star: true },
    { question: 'How do you handle imbalanced classes?',
      why: 'Beyond accuracy — precision, recall, and what the cost of each error is.' },
    { question: 'How do you know your model is not overfitting?',
      why: 'Validation strategy, not just a train/test split.' },
    { question: 'How would you tell whether a feature is worth keeping?',
      why: 'Importance, leakage, and cost of maintaining it.' },
    { question: 'Your model works offline but not in production. Why might that be?',
      why: 'Training-serving skew, drift, and data availability at inference.' },
  ],

  'Product Management': [
    { question: 'How would you prioritise between two features both stakeholders want?',
      why: 'A named framework (RICE, user vs business value) beats instinct.' },
    { question: 'How would you measure the success of a new feature?',
      why: 'One primary metric plus a guardrail. Naming ten metrics fails this.' },
    { question: 'A key metric dropped 20% overnight. What do you do?',
      why: 'Structured diagnosis: instrumentation first, hypotheses second.' },
    { question: 'How do you decide what NOT to build?',
      why: 'Saying no with a reason is the core of the job.' },
    { question: 'Walk me through launching a feature end to end.',
      why: 'Whether you think past release into adoption.' },
    { question: 'Design a product for this user. Where do you start?',
      why: 'Product sense: user, problem, then solution. Never solution first.' },
    { question: 'Tell me about a time you handled conflicting stakeholder requirements.',
      why: 'Whether you resolve or just escalate.', star: true },
    { question: 'How do you work with engineers who disagree with the spec?',
      why: 'Partnership, not handoff.', star: true },
  ],

  'Project / Program Management': [
    { question: 'How do you build a plan when the scope is still moving?',
      why: 'Whether you plan for uncertainty or pretend it away.' },
    { question: 'Tell me about a project that slipped. What did you do?',
      why: 'Early warning and recovery, not blame.', star: true },
    { question: 'How do you track dependencies across teams?',
      why: 'Concrete mechanics, not "I use Jira".' },
    { question: 'How do you run a status update that people actually read?',
      why: 'Communication discipline.' },
    { question: 'How do you handle a stakeholder who keeps adding scope?',
      why: 'Saying no with a trade-off attached.', star: true },
  ],

  'Business / Systems Analysis': [
    { question: 'How do you gather requirements from a business stakeholder?',
      why: 'Whether you interrogate the request or just transcribe it.' },
    { question: 'Describe a process you mapped and improved.',
      why: 'The before state, the intervention, and the measured after.', star: true },
    { question: 'How do you bridge a business team and a technical team?',
      why: 'Translation in both directions is the whole role.' },
    { question: 'How do you decide between customising a system and changing the process?',
      why: 'Long-term cost awareness. Customisation is a debt.' },
    { question: 'How would you handle users resisting a new system?',
      why: 'Change management, where most implementations actually fail.', star: true },
    { question: 'Tell me about a system implementation you were part of.',
      why: 'Scope, your specific part, and what went wrong.', star: true },
  ],

  'QA / Automation': [
    { question: 'How do you decide what to automate and what to test manually?',
      why: 'Cost versus value, not "automate everything".' },
    { question: 'How would you test this feature?',
      why: 'Coverage thinking: happy path, edges, failure, and non-functional.' },
    { question: 'A test fails intermittently. How do you handle it?',
      why: 'Flakiness is the real job. Ignoring it is the wrong answer.' },
    { question: 'How do you write a bug report a developer can act on?',
      why: 'Reproduction steps and expected versus actual.' },
  ],

  'DevOps / SRE': [
    { question: 'Walk me through what happens when a deploy goes wrong.',
      why: 'Rollback, blast radius, and how quickly you know.' },
    { question: 'How do you decide what to alert on?',
      why: 'Symptoms over causes, and alert fatigue.' },
    { question: 'How would you design CI for this project?',
      why: 'Stages, speed, and what blocks a merge.' },
    { question: 'Tell me about an incident you handled.',
      why: 'Detection, mitigation, then root cause — in that order.', star: true },
  ],

  Cybersecurity: [
    { question: 'How would you approach securing this system?',
      why: 'Threat modelling before controls.' },
    { question: 'Walk me through how you would handle a suspected breach.',
      why: 'Contain, investigate, communicate. Order matters.', star: true },
    { question: 'How do you balance security against usability?',
      why: 'Whether you can accept a real trade-off.' },
    { question: 'What is the most common way this kind of system gets compromised?',
      why: 'Practical awareness over textbook lists.' },
  ],

  'IT / Information Systems': [
    { question: 'Walk me through a system you helped implement.',
      why: 'Scope, your specific part, and what went wrong.', star: true },
    { question: 'How do you prioritise support requests?',
      why: 'Impact versus urgency, and how you communicate the wait.' },
    { question: 'How do you document a process so someone else can run it?',
      why: 'Whether the knowledge survives you leaving.' },
    { question: 'How do you handle an integration between two systems that disagree?',
      why: 'Source of truth, reconciliation, and error handling.' },
  ],

  'Support / Customer Success': [
    { question: 'Tell me about a difficult customer you turned around.',
      why: 'Patience plus a concrete action, not just empathy.', star: true },
    { question: 'How do you handle a customer asking for something you cannot deliver?',
      why: 'Saying no while keeping the relationship.' },
    { question: 'How do you decide when to escalate?',
      why: 'Judgement, and respect for the escalation path.' },
    { question: 'How do you spot a customer who is about to churn?',
      why: 'Signals and proactive habits.' },
  ],
}

// ---------------------------------------------------------------------------

const BY_STAGE: Record<PrepCategory, BankQuestion[]> = {
  'Phone Screen':     PHONE_SCREEN,
  'Professional':     PROFESSIONAL_COMMON,
  'Home Assignment':  HOME_ASSIGNMENT,
  'Manager':          MANAGER,
  'HR / Personality': HR_PERSONALITY,
  'Other':            OTHER,
}

/**
 * Questions for a round. The professional round takes a role family: its
 * common questions come first, then the ones specific to that discipline.
 */
export function questionsFor(
  category: PrepCategory,
  roleFamily?: RoleFamily,
): BankQuestion[] {
  const base = BY_STAGE[category] ?? []
  if (category !== 'Professional' || !roleFamily) return base
  return [...base, ...(ROLE_FAMILY_QUESTIONS[roleFamily] ?? [])]
}

export const ROLE_FAMILIES = Object.keys(ROLE_FAMILY_QUESTIONS) as RoleFamily[]

/**
 * Where answers written under the old subject-based categories belong now.
 * Applied when reading, so nothing has to be migrated and nothing is lost.
 */
const LEGACY_CATEGORIES: Record<string, PrepCategory> = {
  'Personal Pitch':      'Phone Screen',
  'HR':                  'HR / Personality',
  'Behavioral':          'HR / Personality',
  'STAR':                'HR / Personality',
  'Technical':           'Professional',
  'Product / PM':        'Professional',
  'SQL':                 'Professional',
  'Python':              'Professional',
  'Data Engineering':    'Professional',
  'Information Systems': 'Professional',
}

export function normalizeCategory(raw: string): PrepCategory {
  if (raw in BY_STAGE) return raw as PrepCategory
  return LEGACY_CATEGORIES[raw] ?? 'Other'
}
