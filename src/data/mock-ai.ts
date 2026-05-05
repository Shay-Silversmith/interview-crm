import type { AISummary } from '@/types'

export const mockAISummaries: AISummary[] = [
  {
    id: 'ai-company-amazon',
    toolType: 'Company Summary',
    companyId: 'company-amazon',
    applicationId: 'app-amazon',
    inputData: {
      companyName: 'Amazon',
      targetRole: 'Data Engineer Intern',
    },
    outputData: {
      mission: 'To be Earth\'s most customer-centric company, enabling anyone to find and discover anything they want to buy online.',
      culture: 'Driven by 16 Leadership Principles. High-performance, data-driven, and customer-obsessed culture. Engineers are expected to own their domain end-to-end ("you build it, you run it"). Strong bias for written communication (6-pager memos).',
      recentNews: 'AWS re:Invent 2025 announcements: new Redshift Serverless capabilities, Amazon Q for data engineering workflows, expanded Bedrock foundation model offerings.',
      interviewTips: 'Every interview question can and should be answered through a Leadership Principle lens. Prepare 2 STAR stories per LP. The bar-raiser will challenge you on depth — be ready to "Dive Deep" into specifics. Avoid vague answers.',
      redFlags: 'Work-life balance concerns are common in Glassdoor reviews. Amazon Israel is smaller and more autonomous than US offices, which can be positive for students.',
      fitAssessment: 'Strong fit for Amir. Unit 9900 GIS/data work directly maps to AWS data platform work. LP stories around "Dive Deep" and "Invent and Simplify" are authentic and strong.',
    },
    isMocked: true,
    createdAt: '2026-04-20T14:00:00Z',
  },
  {
    id: 'ai-jd-amazon',
    toolType: 'JD Parser',
    applicationId: 'app-amazon',
    inputData: {
      jobDescription: 'Amazon Data Engineer Intern JD',
    },
    outputData: {
      mustHaveSkills: 'SQL (complex queries, optimization), Python (Pandas/PySpark), AWS basics, analytical mindset',
      niceToHaveSkills: 'Apache Spark, Kafka, data warehousing (star/snowflake schema), Git',
      keyResponsibilities: 'ETL pipeline design, AWS service integration (Redshift/Glue/S3/Lambda), collaboration with data scientists, query optimization',
      cultureFit: 'Customer obsession, bias for action, ownership mentality, ability to work with ambiguity',
      interviewFocus: 'Technical round will likely cover: 2-3 SQL problems (medium-hard complexity), Python/Pandas manipulation, one system design question around data pipelines',
      coverageScore: '88/100 — CV covers most must-haves. Gap: no explicit Spark experience mentioned. Recommend adding GeoPandas pipeline work as a proxy.',
    },
    isMocked: true,
    createdAt: '2026-04-21T09:00:00Z',
  },
  {
    id: 'ai-prepare-amazon',
    toolType: 'Prepare Me',
    applicationId: 'app-amazon',
    inputData: {
      interviewType: 'Technical Interview',
      interviewDate: '2026-05-08',
      role: 'Data Engineer Intern',
    },
    outputData: {
      likelyTopics: '1. SQL: Window functions, CTEs, query optimization (EXPLAIN ANALYZE)\n2. Python: Pandas manipulation, GroupBy, Merge, handling NaN\n3. System Design: Design a data pipeline for a specific use case (e.g., ingest clickstream data)\n4. Leadership Principles: 2-3 behavioral questions — likely "Dive Deep", "Customer Obsession", "Deliver Results"',
      practiceQuestions: 'SQL: Find the top 3 products by revenue per category using window functions.\nPython: Given a DataFrame with missing values, describe your approach to cleaning it.\nSystem Design: Design a pipeline that ingests 10M events/day from a web app into a queryable analytics store.',
      studyPlan: 'Day 1-2: SQL practice (LeetCode SQL 50). Day 3: Python/Pandas review. Day 4: System design concepts (medallion architecture, Lambda vs Kappa). Day 5: LP stories. Day 6: Mock interview.',
      prepTips: 'Lead with your Unit 9900 experience when asked behavioral questions — high-stakes environments with real consequences make for compelling LP stories. On SQL, always explain your thought process aloud. On system design, start with requirements before drawing any architecture.',
    },
    isMocked: true,
    createdAt: '2026-04-22T10:00:00Z',
  },
  {
    id: 'ai-interview-summary-amazon-phone',
    toolType: 'Interview Summary',
    applicationId: 'app-amazon',
    inputData: {
      interviewType: 'Phone Screen',
      date: '2026-04-05',
      interviewer: 'Noa Ben-David',
    },
    outputData: {
      keyMoments: 'Strong opener: Unit 9900 introduction landed well (Noa mentioned it was impressive). SQL section: confident answers on joins and GROUP BY. Weak moment: stumbled on question about Spark experience — didn\'t have any.',
      whatWorked: 'Clear, structured answers. Good energy. Translated military experience into business value effectively.',
      whatToImprove: 'Add Spark to study plan before technical round. Prepare a more specific answer about familiarity with AWS services.',
      overallSentiment: 'Positive — Noa was engaged throughout and fast-tracked to next round. Good signal.',
      nextSteps: 'Prepare for technical interview: SQL (window functions, optimization), Python/Pandas, one system design question. Study Amazon LP stories.',
    },
    isMocked: true,
    createdAt: '2026-04-06T09:00:00Z',
  },
  {
    id: 'ai-followup-wix',
    toolType: 'Follow-up Message',
    applicationId: 'app-wix',
    inputData: {
      recipientName: 'Lihi Shachar',
      occasion: 'After submitting home assignment',
      tone: 'Professional, warm',
    },
    outputData: {
      subject: 'Wix PM Program — Home Assignment Submitted',
      message: `Hi Lihi,

I wanted to let you know I've submitted the home assignment — it was a really engaging challenge. I focused on improving the Wix onboarding experience for small business owners, with a proposal built around reducing post-launch anxiety through lightweight site versioning.

I enjoyed the process and it confirmed my genuine excitement about the product problems Wix is solving.

Looking forward to your feedback and to the next steps.

Best,
Amir`,
      tone: 'Professional but warm. Shows product thinking without being over-eager.',
    },
    isMocked: true,
    createdAt: '2026-05-02T10:00:00Z',
  },
  {
    id: 'ai-personalized-answer',
    toolType: 'Personalized Answer',
    applicationId: 'app-amazon',
    inputData: {
      question: 'Tell me about a time you delivered results under pressure',
      company: 'Amazon',
      lpFocus: 'Deliver Results',
    },
    outputData: {
      answer: `**Situation:** During my service in Unit 9900, we received a time-critical analytical request with a 3-hour deadline — significantly shorter than our standard process, which typically took 8-12 hours.

**Task:** I needed to deliver a complete spatial analysis without compromising accuracy, which meant I couldn't cut corners on verification.

**Action:** I immediately triage the request: what was truly required vs. what was nice-to-have. I ran the critical analysis paths in parallel, automated the most repetitive verification steps with a quick Python script I'd built for exactly this kind of scenario, and handed off the summary components to a colleague while I focused on the highest-uncertainty data.

**Result:** Delivered a complete, verified output in 2h45m — 15 minutes ahead of deadline. The output was directly actionable, which was confirmed in the debrief.

**Amazon LP connection:** This is "Deliver Results" — never accepting that something is impossible without first asking what can be restructured. It's also "Bias for Action" — moving quickly once the path is clear.`,
      tips: 'Lead with specifics. Amazon interviewers will ask "tell me more" to test depth — prepare two follow-up levels for each story. Quantify where possible.',
    },
    isMocked: true,
    createdAt: '2026-04-28T14:00:00Z',
  },
]
