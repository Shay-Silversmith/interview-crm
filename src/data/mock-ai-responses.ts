// ---------------------------------------------------------------------------
// InterviewFlow — mock-ai-responses.ts
// Static fallback shapes returned when VITE_AI_ENABLED is false or the
// real API call fails. Shape must match aiClientService response types exactly.
// Only imported by src/services/aiService.ts — nowhere else.
// ---------------------------------------------------------------------------
import type { JDParserResponse, PrepPackResponse, FollowUpResponse } from '@/services/aiClientService'

export const mockJDParserResponse: JDParserResponse = {
  roleSummary:
    'A data engineering role focused on building scalable ETL pipelines, working with cloud infrastructure, and enabling data-driven decision-making across the organisation.',
  responsibilities: [
    'Design and build scalable ETL pipelines using Python and Spark',
    'Integrate AWS services: Redshift, Glue, S3, Lambda',
    'Collaborate with data scientists and analysts on data needs',
    'Optimise query performance and data modelling',
    'Participate in code reviews and technical documentation',
  ],
  requirements: [
    'Strong SQL skills — window functions, CTEs, query optimisation',
    'Python proficiency — Pandas, PySpark preferred',
    'Familiarity with cloud platforms (AWS preferred)',
    'B.Sc. student in CS, IS, or related field (3rd year+)',
    'GPA 85+ preferred',
  ],
  niceToHaves: [
    'Experience with big data tools (Spark, Kafka, Hadoop)',
    'Knowledge of data warehousing (star/snowflake schema)',
    'Version control with Git',
  ],
  technologies: ['Python', 'SQL', 'AWS', 'Pandas', 'Redshift', 'Glue', 'Spark'],
  whatTheyWant:
    'A technically strong, ownership-driven engineer who can move fast on ambiguous problems and communicate clearly with non-technical stakeholders.',
  howIMatch: [
    'Prior internship analytics pipeline work maps directly to large-scale pipeline requirements',
    'SQL and Python background covers the core technical must-haves',
    'Cross-functional internship experience demonstrates ownership and delivery',
  ],
  whatToEmphasize: [
    'Analytics pipeline work from prior internship',
    'SQL optimisation projects and advanced query skills',
    'Python/Pandas proficiency with real data pipeline experience',
    'Ability to work on ambiguous, high-stakes problems',
  ],
  possibleQuestions: [
    'Describe a complex SQL query you wrote and why it was necessary.',
    'How would you design a pipeline to ingest 10M events per day?',
    'Walk me through a time you debugged a data quality issue under pressure.',
    'What AWS services have you worked with, and how?',
  ],
  prepChecklist: [
    'Practice SQL window functions, CTEs, and EXPLAIN ANALYZE',
    'Review system design basics: medallion architecture, Lambda vs Kappa',
    'Prepare 2–3 STAR stories covering ownership and delivery under pressure',
    'Brush up on Pandas GroupBy, Merge, and handling NaN at scale',
    'Research the company\'s data stack from public sources',
  ],
}

export const mockPrepPackResponse: PrepPackResponse = {
  companySnapshot:
    'A high-growth technology company known for data-intensive products, a strong engineering culture, and high performance expectations. Emphasises ownership, speed, and measurable impact.',
  roleSummary:
    'The role requires building and owning data infrastructure end-to-end — from ingestion to querying. Expect technical depth on SQL and Python, at least one system design scenario, and behavioural questions anchored in company values.',
  reviewFromCV: [
    'Prior internship analytics pipeline work is your strongest anchor — lead with it',
    'SQL and Python skills cover the core requirements well',
    'Highlight the cross-functional coordination experience for behavioural rounds',
    'Add a quantified outcome to the data pipeline project if possible',
  ],
  expectedHRQuestions: [
    'Why are you interested in this specific role and company?',
    'Tell me about yourself and your background.',
    'Where do you see yourself in 3–5 years?',
    'How do you handle working in a fast-paced, ambiguous environment?',
    'What is your availability and preferred working arrangement?',
  ],
  expectedTechnicalQuestions: [
    'Write a SQL query to find the top 3 products by revenue per category.',
    'Given a DataFrame with missing values, how do you clean it?',
    'Design a pipeline that ingests clickstream data and makes it queryable.',
    'What is the difference between a star schema and a snowflake schema?',
    'How would you optimise a slow SQL query — walk me through your process.',
  ],
  recommendedStarStories: [
    {
      situation:
        'During a prior internship, a time-critical analytics request arrived with a 3-hour deadline — well below the standard 8–12 hour process.',
      task: 'Deliver a complete, verified analysis without cutting corners on accuracy.',
      action:
        'Triaged requirements immediately. Ran critical analysis paths in parallel, automated the most repetitive verification steps with a Python script, and delegated the summary section while focusing on the highest-uncertainty data.',
      result:
        'Delivered a complete, verified output 15 minutes ahead of deadline. The output was directly actionable, confirmed in the debrief.',
    },
    {
      situation:
        'A cross-team analytics project lacked a clear owner — three teams were producing overlapping data with no shared schema.',
      task: 'As the informal lead, standardise the data model and get buy-in from all parties within one sprint.',
      action:
        'Mapped each team\'s output format, identified the 4 fields that overlapped, proposed a minimal shared schema, and ran a 30-minute sync to align on it. Built a Python normalisation script to automate the merge.',
      result:
        'Merged output quality improved by ~40% on the next delivery cycle. The schema became the team standard going forward.',
    },
  ],
  questionsToAsk: [
    'What does a typical first-week onboarding look like for this role?',
    'What are the biggest data infrastructure challenges the team is solving right now?',
    'How is success measured for this role in the first 3 months?',
    'What does the collaboration between data engineers and data scientists look like here?',
  ],
  finalChecklist: [
    'Review SQL window functions and write 3 practice queries from scratch',
    'Prepare the "time-critical delivery" STAR story — know all 4 levels deep',
    'Research the company\'s recent engineering blog posts or product launches',
    'Review the JD one more time — map each requirement to a specific story',
    'Prepare 3–4 smart questions for the interviewer',
    'Test your setup (video, audio, internet) the night before',
  ],
}

export function getMockFollowUpResponse(company: string, contactName: string): FollowUpResponse {
  const firstName = contactName.split(' ')[0] || 'there'
  return {
    short: `Hi ${firstName},\n\nThank you for your time — I genuinely enjoyed the conversation about the role at ${company}. I'm excited about the opportunity and look forward to next steps.\n\nBest,\nMaya`,
    warm: `Hi ${firstName},\n\nI wanted to take a moment to thank you for the interview. The conversation gave me a much clearer picture of what the team is working on at ${company} — and it confirmed how genuinely excited I am about contributing there.\n\nI was particularly energised by what you mentioned about [specific point from the conversation]. It aligns closely with the kind of work I want to be doing.\n\nLooking forward to hearing from you on next steps.\n\nWarm regards,\nMaya`,
    linkedIn: `Hi ${firstName} — great speaking with you about the ${company} opportunity! Really appreciated the conversation and excited about what the team is building. Looking forward to next steps.`,
  }
}
