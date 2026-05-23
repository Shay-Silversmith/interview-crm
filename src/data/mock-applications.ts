import type { JobApplication } from '@/types'

export const mockApplications: JobApplication[] = [
  {
    id: 'app-amazon',
    companyId: 'company-amazon',
    companyName: 'Amazon',
    companyLogoUrl: 'https://www.google.com/s2/favicons?domain=amazon.com&sz=128',
    roleName: 'Data Engineer Intern',
    roleUrl: 'https://amazon.jobs/en/jobs/data-engineer-intern',
    jobDescription: `We are looking for a Data Engineer Intern to join our AWS Data Platform team in Tel Aviv. You will work with petabyte-scale datasets, build ETL pipelines, and help shape our data infrastructure.

**Responsibilities:**
- Design and build scalable ETL pipelines using Python and Spark
- Work with AWS services: Redshift, Glue, S3, Lambda
- Collaborate with data scientists and analysts to understand data needs
- Optimize query performance and data modeling
- Participate in code reviews and contribute to technical documentation

**Requirements:**
- 3rd or 4th year B.Sc. in Computer Science, Information Systems, or related field
- Strong SQL skills (window functions, CTEs, optimization)
- Python proficiency (Pandas, PySpark preferred)
- Familiarity with cloud platforms (AWS preferred)
- GPA 85+ preferred
- Strong analytical and problem-solving skills

**Nice to have:**
- Experience with big data tools (Spark, Kafka, Hadoop)
- Knowledge of data warehousing concepts (star/snowflake schema)
- Experience with version control (Git)`,
    stage: 'Technical Interview',
    priority: 'Critical',
    workModel: 'Hybrid',
    location: 'Tel Aviv, Israel',
    salaryMin: 8000,
    salaryMax: 12000,
    currency: 'ILS',
    fitScore: 88,
    urgencyScore: 92,
    submittedCvId: 'cv-data',
    submittedCvName: 'CV — Data-heavy v2.1',
    appliedAt: '2026-03-18T10:00:00Z',
    nextEventAt: '2026-06-01T14:00:00Z',
    nextEventDescription: 'Awaiting decision after Technical Interview',
    contactIds: ['contact-noa', 'contact-ran'],
    taskIds: ['task-sql-prep', 'task-amazon-lp'],
    interviewStages: [
      {
        id: 'int-amazon-1',
        applicationId: 'app-amazon',
        type: 'Phone Screen',
        scheduledAt: '2026-04-05T11:00:00Z',
        completedAt: '2026-04-05T11:30:00Z',
        duration: 30,
        interviewer: 'Noa Ben-David',
        interviewerTitle: 'Technical Recruiter',
        outcome: 'Passed',
        notes: 'Quick intro call. Asked about background, SQL experience, availability. Moved to technical round.',
        nextSteps: 'Technical interview with engineering team',
      },
      {
        id: 'int-amazon-2',
        applicationId: 'app-amazon',
        type: 'Technical',
        scheduledAt: '2026-05-08T14:00:00Z',
        completedAt: '2026-05-08T15:00:00Z',
        duration: 60,
        interviewer: 'Ran Levi',
        interviewerTitle: 'Senior Data Engineer',
        outcome: 'Pending',
        notes: 'Covered SQL (window functions, optimization), Python (Pandas), and one system design question on a streaming pipeline. Felt strong overall.',
        nextSteps: 'Awaiting recruiter feedback',
      },
    ],
    notes: 'Very strong fit — my prior internship analytics work and SQL/Python depth directly map to their data infra needs. Need to prep Amazon Leadership Principles hard.',
    whyInteresting: 'Amazon scale data problems are exactly what I want to work on. AWS ecosystem is the industry standard. Strong learning opportunity.',
    whatToEmphasize: 'Past internship analytics pipelines, SQL proficiency, Python skills, ability to work on ambiguous problems. Frame everything through Amazon Leadership Principles.',
    createdAt: '2026-03-15T09:00:00Z',
    updatedAt: '2026-05-08T16:00:00Z',
  },
  {
    id: 'app-salesforce',
    companyId: 'company-salesforce',
    companyName: 'Salesforce',
    companyLogoUrl: 'https://www.google.com/s2/favicons?domain=salesforce.com&sz=128',
    roleName: 'Associate Product Manager Intern',
    roleUrl: 'https://salesforce.com/careers',
    jobDescription: `Salesforce is seeking an Associate Product Manager Intern to join our Israel R&D center. You will work alongside experienced PMs on CRM and analytics products used by thousands of enterprises worldwide.

**Responsibilities:**
- Collaborate with cross-functional teams (engineering, design, data science) to define product requirements
- Write product specs, user stories, and acceptance criteria
- Analyze product usage data and translate insights into actionable improvements
- Conduct competitive research and user interviews
- Support roadmap planning and sprint ceremonies

**Requirements:**
- 3rd or 4th year B.Sc. in Information Systems, Industrial Engineering, or Computer Science
- Strong analytical skills and comfort with data
- Excellent communication in English and Hebrew
- Experience with project management tools (JIRA, Confluence, or similar)
- Ability to work 3+ days per week

**Nice to have:**
- Familiarity with CRM or B2B SaaS concepts
- Experience with SQL or BI tools
- Previous PM or product internship`,
    stage: 'HR Screen',
    priority: 'High',
    workModel: 'Hybrid',
    location: 'Tel Aviv, Israel',
    fitScore: 80,
    urgencyScore: 70,
    submittedCvId: 'cv-product',
    submittedCvName: 'CV — Product-leaning v1.3',
    appliedAt: '2026-05-01T10:00:00Z',
    nextEventAt: '2026-05-28T11:00:00Z',
    nextEventDescription: 'HR Screen — Intro call with Netta Levy',
    contactIds: ['contact-netta'],
    taskIds: ['task-salesforce-prep'],
    interviewStages: [
      {
        id: 'int-salesforce-1',
        applicationId: 'app-salesforce',
        type: 'HR Interview',
        scheduledAt: '2026-05-28T11:00:00Z',
        duration: 45,
        interviewer: 'Netta Levy',
        interviewerTitle: 'University Recruiter',
        outcome: 'Pending',
        notes: 'First call. Cover: background, why Salesforce, PM experience, availability. Research Salesforce products beforehand.',
      },
    ],
    notes: 'Applied via LinkedIn. Salesforce CRM domain is interesting for PM skills — B2B product experience. Need to sharpen "why Salesforce" story.',
    whyInteresting: 'Salesforce has massive enterprise scale with strong product culture. B2B SaaS PM experience is highly transferable. Strong mentorship for early-career PMs.',
    whatToEmphasize: 'Cross-functional coordination from prior internship, data-driven thinking, JIRA/project management experience, ability to work with ambiguous requirements.',
    createdAt: '2026-04-28T09:00:00Z',
    updatedAt: '2026-05-01T10:00:00Z',
  },
  {
    id: 'app-myheritage',
    companyId: 'company-myheritage',
    companyName: 'MyHeritage',
    companyLogoUrl: 'https://www.google.com/s2/favicons?domain=myheritage.com&sz=128',
    roleName: 'Project Manager Student',
    roleUrl: 'https://myheritage.com/careers',
    jobDescription: `MyHeritage is looking for a motivated Project Manager Student to join our Product & Engineering team. You will work alongside senior PMs and engineers to ship features used by millions of users worldwide.

**Responsibilities:**
- Assist in managing cross-functional projects from spec to launch
- Write PRDs, track milestones, and coordinate between teams
- Analyze product metrics and user feedback
- Run sprint ceremonies (stand-ups, retrospectives, planning)
- Conduct competitive research and user interviews

**Requirements:**
- 3rd or 4th year B.Sc. in Information Systems, Industrial Engineering, or related field
- Strong communication and interpersonal skills
- Experience with project management tools (JIRA, Asana, Notion)
- Analytical mindset — comfortable with data
- Ability to work 3+ days per week during semester
- English fluency`,
    stage: 'HR Screen',
    priority: 'High',
    workModel: 'Hybrid',
    location: 'Or Yehuda, Israel',
    fitScore: 82,
    urgencyScore: 70,
    submittedCvId: 'cv-product',
    submittedCvName: 'CV — Product-leaning v1.3',
    appliedAt: '2026-04-01T09:00:00Z',
    nextEventAt: '2026-05-07T10:00:00Z',
    nextEventDescription: 'HR Screen — Intro call with Tal Katz',
    contactIds: ['contact-tal'],
    taskIds: ['task-myheritage-prep', 'task-review-cv-myheritage'],
    interviewStages: [
      {
        id: 'int-myheritage-1',
        applicationId: 'app-myheritage',
        type: 'HR Interview',
        scheduledAt: '2026-05-07T10:00:00Z',
        completedAt: '2026-05-07T10:45:00Z',
        duration: 45,
        interviewer: 'Tal Katz',
        interviewerTitle: 'HR Manager',
        outcome: 'Pending',
        notes: 'First interview. Cover: background, why MyHeritage, project management experience, availability.',
        nextSteps: 'Waiting for feedback on next stage',
      },
    ],
    notes: 'Good product culture fit. MyHeritage moves fast. Lean on cross-functional examples from prior internship.',
    whyInteresting: 'Fascinating product domain (AI + genealogy + millions of users). Great PM mentorship culture. Relevant scale for learning.',
    whatToEmphasize: 'Cross-functional coordination from prior internship, JIRA experience, data-driven thinking, user empathy.',
    createdAt: '2026-03-28T10:00:00Z',
    updatedAt: '2026-05-07T11:00:00Z',
  },
  {
    id: 'app-upwind',
    companyId: 'company-upwind',
    companyName: 'Upwind',
    companyLogoUrl: 'https://www.google.com/s2/favicons?domain=upwind.io&sz=128',
    roleName: 'Cybersecurity Bootcamp',
    roleUrl: 'https://upwind.io/careers',
    jobDescription: `Upwind Security is running a selective 3-month Cybersecurity Bootcamp for outstanding students with technical backgrounds. Participants work alongside our security research and product teams on real cloud security challenges.

**What you'll do:**
- Learn cloud-native security concepts (CNAPP, CSPM, CWPP)
- Work on real security research problems with our engineering team
- Build tooling and dashboards for cloud security posture
- Contribute to threat detection and incident response workflows

**Who we're looking for:**
- Students with strong technical background (CS, InfoSec, Data, Intelligence)
- Analytical thinkers who can connect dots across large datasets
- Bonus: prior security research or OSINT experience
- Self-motivated with high curiosity and initiative`,
    stage: 'Interested',
    priority: 'Medium',
    workModel: 'Hybrid',
    location: 'Tel Aviv, Israel',
    fitScore: 74,
    urgencyScore: 42,
    contactIds: [],
    taskIds: ['task-upwind-research'],
    interviewStages: [],
    notes: 'Found via LinkedIn. Small team, high impact. Not applied yet — need to research more and find the right contact.',
    whyInteresting: 'Runtime cloud security is a growing field. Early-stage means high learning velocity.',
    whatToEmphasize: 'Analytical thinking, ability to work with ambiguous data, prior internship project ownership.',
    createdAt: '2026-04-20T10:00:00Z',
    updatedAt: '2026-04-25T11:00:00Z',
  },
]
