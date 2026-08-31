// ---------------------------------------------------------------------------
// InterviewFlow — question-bank.ts
// Common interview questions per prep category.
//
// Static and curated rather than generated, for three reasons: it costs nothing
// against the Gemini daily quota, it is instant, and the same question phrased
// the same way every time is what makes a saved answer reusable across
// processes. Compiled from the questions that recur across current interview
// guides (Novoresume, Exponent, Product School, IGotAnOffer, InterviewQuery,
// Datavidhya, AIHR) rather than invented.
//
// Each entry carries a short `why` — what the interviewer is actually testing.
// Knowing that is the difference between answering the question and answering
// the thing behind it.
// ---------------------------------------------------------------------------

import type { PrepCategory } from '@/lib/enums'

export interface BankQuestion {
  question: string
  /** What the question is really probing. Shown under it in the picker. */
  why:      string
}

export const QUESTION_BANK: Record<PrepCategory, BankQuestion[]> = {
  'Personal Pitch': [
    { question: 'Tell me about yourself.',
      why: 'Your 90-second narrative. They are testing whether you can prioritise.' },
    { question: 'Walk me through your CV.',
      why: 'Coherence — do the moves add up to a direction, or look random.' },
    { question: 'Why are you looking to move right now?',
      why: 'Whether you are running toward something or away from something.' },
    { question: 'Where do you want to be in three years?',
      why: 'Whether this role is a step on your path or a stopgap.' },
    { question: 'What are you best at?',
      why: 'Self-awareness, and whether your strength matches the job.' },
    { question: 'What do you want to learn in your next role?',
      why: 'Whether the role can actually give you that — a bad fit shows up here.' },
  ],

  HR: [
    { question: 'Why do you want to work here specifically?',
      why: 'Did you research them, or are you applying everywhere.' },
    { question: 'What do you know about what we do?',
      why: 'The cheapest question to prepare and the most common one to fail.' },
    { question: 'What are your salary expectations?',
      why: 'Give a researched range and tie it to scope, not to need.' },
    { question: 'What are your strengths and weaknesses?',
      why: 'A real weakness with a real correction, not a disguised strength.' },
    { question: 'When could you start, and what is your notice period?',
      why: 'Logistics, but a vague answer reads as not serious.' },
    { question: 'Are you interviewing anywhere else?',
      why: 'Your market position. Honest and brief beats either extreme.' },
    { question: 'What kind of work environment do you do your best work in?',
      why: 'Culture fit, and whether you have thought about how you work.' },
    { question: 'Do you have any questions for us?',
      why: 'Never "no". This is scored, and it is the easiest point to win.' },
  ],

  Behavioral: [
    { question: 'Tell me about a time you disagreed with your manager.',
      why: 'Whether you can push back without becoming a problem.' },
    { question: 'Describe a time you worked with a difficult colleague.',
      why: 'Do you attack the person or the problem.' },
    { question: 'Tell me about a time you failed.',
      why: 'Real ownership. A failure that was someone else’s fault does not count.' },
    { question: 'Tell me about a time you had to meet an impossible deadline.',
      why: 'What you cut, and how you decided what to cut.' },
    { question: 'Describe a time you had to persuade someone without authority.',
      why: 'Influence, which is most of the job in any cross-functional role.' },
    { question: 'Tell me about a time you received hard feedback.',
      why: 'What you changed afterwards — that is the whole answer.' },
    { question: 'Describe a time you had to learn something quickly.',
      why: 'Your actual method, not that you are "a fast learner".' },
    { question: 'Tell me about a time you took the lead without being asked.',
      why: 'Initiative, and whether you can see past your own task.' },
  ],

  STAR: [
    { question: 'Tell me about a time you solved a problem with limited resources.',
      why: 'Resourcefulness, and whether you can scope down without giving up.' },
    { question: 'Describe your most significant achievement.',
      why: 'What you consider significant says as much as the achievement.' },
    { question: 'Tell me about a time you had to make a decision without enough data.',
      why: 'How you reason under uncertainty, and what you did to reduce it.' },
    { question: 'Describe a time you improved a process.',
      why: 'Did you measure the before and after, or just feel it was better.' },
    { question: 'Tell me about a time you handled competing priorities.',
      why: 'Your prioritisation logic, said out loud.' },
    { question: 'Describe a time your work had measurable impact.',
      why: 'Numbers. This is the question where a real metric wins the room.' },
  ],

  Technical: [
    { question: 'Walk me through a technical project you are proud of.',
      why: 'Depth. They will drill into whatever you claim, so claim carefully.' },
    { question: 'What was the hardest bug you have debugged, and how?',
      why: 'Your method, not the bug. Narrate the search, not the answer.' },
    { question: 'How do you decide between building something and using an existing tool?',
      why: 'Engineering judgement and awareness of cost.' },
    { question: 'How do you make sure your work is correct?',
      why: 'Testing habits, and whether quality is a step or an afterthought.' },
    { question: 'Explain a technical concept from your work to a non-technical person.',
      why: 'Communication, which is tested more than people expect.' },
    { question: 'What would you do differently if you rebuilt your last project?',
      why: 'Whether you learn from your own code.' },
  ],

  'Product / PM': [
    { question: 'How would you prioritise between two features both stakeholders want?',
      why: 'A named framework (RICE, user vs business value) beats instinct.' },
    { question: 'How would you measure the success of a new feature?',
      why: 'One primary metric plus a guardrail. Naming ten metrics fails this.' },
    { question: 'Tell me about a time you handled conflicting stakeholder requirements.',
      why: 'Whether you resolve or just escalate.' },
    { question: 'How do you decide what NOT to build?',
      why: 'Saying no with a reason is the core of the job.' },
    { question: 'Walk me through how you would launch a feature end to end.',
      why: 'Whether you think past release into adoption.' },
    { question: 'A key metric dropped 20% overnight. What do you do?',
      why: 'Structured diagnosis: instrumentation first, hypotheses second.' },
    { question: 'How do you work with engineers when they disagree with the spec?',
      why: 'Partnership, not handoff.' },
  ],

  SQL: [
    { question: 'Explain the difference between INNER, LEFT, and FULL OUTER JOIN.',
      why: 'The baseline. Getting it slightly wrong ends the round early.' },
    { question: 'Write a query to find the second-highest salary per department.',
      why: 'Window functions — the single most common SQL screen question.' },
    { question: 'When would you use a window function instead of GROUP BY?',
      why: 'Whether you understand that one aggregates rows away and one does not.' },
    { question: 'How would you find and remove duplicate rows?',
      why: 'ROW_NUMBER() over a partition. Classic, and asked constantly.' },
    { question: 'Explain RANK, DENSE_RANK, and ROW_NUMBER.',
      why: 'Tie handling. Interviewers ask precisely because most people blur them.' },
    { question: 'A query is slow. How do you diagnose it?',
      why: 'Execution plan, indexes, cardinality — a method, not a guess.' },
    { question: 'What is a CTE, and when is it better than a subquery?',
      why: 'Readability and recursion, not performance folklore.' },
  ],

  Python: [
    { question: 'How do you read and clean a large CSV that does not fit in memory?',
      why: 'Chunking, dtypes, generators — practical, not theoretical.' },
    { question: 'Explain list vs tuple vs set, and when you would use each.',
      why: 'Baseline fluency and awareness of lookup cost.' },
    { question: 'What is a list comprehension, and when is a loop clearer?',
      why: 'Whether you optimise for readability or for cleverness.' },
    { question: 'How do you handle errors in a script that must not stop?',
      why: 'Targeted exception handling versus a bare except.' },
    { question: 'Walk me through a Python script you wrote that someone else used.',
      why: 'Real usage means real edge cases. That is what they want to hear.' },
    { question: 'How do you test a data transformation?',
      why: 'Whether you can state what "correct" means before writing the test.' },
  ],

  'Data Engineering': [
    { question: 'Walk me through a pipeline you built, end to end.',
      why: 'The anchor question. Sources, transforms, orchestration, monitoring.' },
    { question: 'What is the difference between ETL and ELT, and when do you pick each?',
      why: 'Where the compute lives, and why the warehouse changed the answer.' },
    { question: 'How do you make a pipeline fault tolerant?',
      why: 'Retries, idempotency, backfills. Idempotency is the word they wait for.' },
    { question: 'A nightly job failed and nobody noticed for three days. What went wrong?',
      why: 'Monitoring and alerting, and whether you own the data after it lands.' },
    { question: 'How would you model this data in a warehouse?',
      why: 'Star schema, grain, slowly changing dimensions.' },
    { question: 'How do you handle late-arriving or out-of-order data?',
      why: 'Watermarks and reprocessing — separates real experience from courses.' },
    { question: 'Batch or streaming for this use case, and why?',
      why: 'Whether you can justify the cheaper option instead of the exciting one.' },
  ],

  'Information Systems': [
    { question: 'How do you gather requirements from a business stakeholder?',
      why: 'Whether you interrogate the request or just transcribe it.' },
    { question: 'Describe a process you mapped and improved.',
      why: 'The before state, the intervention, and the measured after.' },
    { question: 'How do you bridge a business team and a technical team?',
      why: 'Translation in both directions is the whole role.' },
    { question: 'Tell me about a system implementation you were part of.',
      why: 'Scope, your specific part, and what went wrong.' },
    { question: 'How do you decide between customising a system and changing the process?',
      why: 'Long-term cost awareness. Customisation is a debt.' },
    { question: 'How would you handle users resisting a new system?',
      why: 'Change management, which is where most implementations actually fail.' },
  ],
}

/** Questions for a category, or an empty list for one with no bank yet. */
export function questionsFor(category: PrepCategory): BankQuestion[] {
  return QUESTION_BANK[category] ?? []
}
