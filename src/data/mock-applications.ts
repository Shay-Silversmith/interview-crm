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
    nextEventAt: '2026-05-08T14:00:00Z',
    nextEventDescription: 'Technical Interview — SQL & Python coding',
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
        duration: 60,
        interviewer: 'Ran Levi',
        interviewerTitle: 'Senior Data Engineer',
        outcome: 'Pending',
        notes: 'Upcoming. Will cover SQL (complex queries, optimization), Python (data manipulation), and one system design question.',
      },
    ],
    notes: 'Very strong fit — my GIS/data background and Unit 9900 experience directly map to their data infra needs. Need to prep Amazon Leadership Principles hard.',
    whyInteresting: 'Amazon scale data problems are exactly what I want to work on. AWS ecosystem is the industry standard. Strong learning opportunity.',
    whatToEmphasize: 'Unit 9900 large-scale data work, SQL proficiency, Python skills, ability to work on ambiguous problems. Frame everything through Amazon Leadership Principles.',
    createdAt: '2026-03-15T09:00:00Z',
    updatedAt: '2026-05-02T14:00:00Z',
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
        duration: 45,
        interviewer: 'Tal Katz',
        interviewerTitle: 'HR Manager',
        outcome: 'Pending',
        notes: 'First interview. Cover: background, why MyHeritage, project management experience, availability.',
      },
    ],
    notes: 'Good product culture fit. MyHeritage moves fast. Make sure to mention cross-functional work from Unit 9900.',
    whyInteresting: 'Fascinating product domain (AI + genealogy + millions of users). Great PM mentorship culture. Relevant scale for learning.',
    whatToEmphasize: 'Cross-functional coordination in Unit 9900, JIRA experience, data-driven thinking, user empathy.',
    createdAt: '2026-03-28T10:00:00Z',
    updatedAt: '2026-05-01T15:00:00Z',
  },
  {
    id: 'app-mobileye',
    companyId: 'company-mobileye',
    companyName: 'Mobileye',
    companyLogoUrl: 'https://www.google.com/s2/favicons?domain=mobileye.com&sz=128',
    roleName: 'Project Manager Student',
    roleUrl: 'https://mobileye.com/careers',
    jobDescription: `Mobileye is seeking a Project Manager Student to join our autonomous driving software programs team. Work at the intersection of cutting-edge technology and complex systems engineering.

**Responsibilities:**
- Support program managers in tracking milestones across autonomous driving projects
- Create and maintain project plans, risk registers, and status reports
- Interface with R&D, QA, and hardware teams
- Prepare executive presentations and decision docs
- Participate in PI Planning and release ceremonies

**Requirements:**
- B.Sc. student in Information Systems, Industrial Engineering, Computer Science, or related field (3rd year+)
- Strong analytical and organizational skills
- Experience with MS Project, JIRA, or similar tools
- Technical background sufficient to communicate with engineers
- High precision and attention to detail
- Ability to commute to Jerusalem`,
    stage: 'Applied',
    priority: 'High',
    workModel: 'On-site',
    location: 'Jerusalem, Israel',
    fitScore: 79,
    urgencyScore: 55,
    submittedCvId: 'cv-product',
    submittedCvName: 'CV — Product-leaning v1.3',
    appliedAt: '2026-04-10T11:00:00Z',
    contactIds: ['contact-yoav'],
    taskIds: ['task-mobileye-research'],
    interviewStages: [],
    notes: 'Applied online. Waiting for initial response. Jerusalem commute is a concern — clarify remote days.',
    whyInteresting: 'Mobileye is working on some of the hardest engineering problems in the world. GIS background is directly relevant to mapping & localization work.',
    whatToEmphasize: 'GIS expertise from Unit 9900, technical depth, structured thinking, experience managing complex parallel workstreams.',
    createdAt: '2026-04-08T09:00:00Z',
    updatedAt: '2026-04-10T11:00:00Z',
  },
  {
    id: 'app-wix',
    companyId: 'company-wix',
    companyName: 'Wix',
    companyLogoUrl: 'https://www.google.com/s2/favicons?domain=wix.com&sz=128',
    roleName: 'Product Manager Student Program',
    roleUrl: 'https://wix.com/jobs',
    jobDescription: `Wix is looking for exceptional students to join our PM Student Program — a structured 6-month rotational program working directly with product squads. PMs at Wix own the "what" and "why" of features shipped to 250M+ users.

**Responsibilities:**
- Collaborate with a dedicated squad (PM, engineers, designers)
- Write feature specs and contribute to the product roadmap
- Analyze user behavior using internal analytics and A/B testing
- Conduct user research and competitive analysis
- Present recommendations to senior PMs and VP Product

**Requirements:**
- 3rd year B.Sc. student (any technical discipline)
- Exceptional written and verbal communication in English
- Strong analytical skills and comfort with data
- Passion for products people love
- Portfolio or evidence of product thinking (school projects, apps, side projects)`,
    stage: 'Home Assignment',
    priority: 'Critical',
    workModel: 'Hybrid',
    location: 'Tel Aviv, Israel',
    fitScore: 85,
    urgencyScore: 88,
    submittedCvId: 'cv-product',
    submittedCvName: 'CV — Product-leaning v1.3',
    appliedAt: '2026-03-20T09:00:00Z',
    deadlineAt: '2026-05-09T23:59:00Z',
    nextEventAt: '2026-05-09T23:59:00Z',
    nextEventDescription: 'Home Assignment due — Product Case Study',
    contactIds: ['contact-lihi'],
    taskIds: ['task-wix-assignment', 'task-wix-followup'],
    interviewStages: [
      {
        id: 'int-wix-1',
        applicationId: 'app-wix',
        type: 'HR Interview',
        scheduledAt: '2026-04-12T13:00:00Z',
        completedAt: '2026-04-12T13:45:00Z',
        duration: 45,
        interviewer: 'Lihi Shachar',
        interviewerTitle: 'Talent Partner',
        outcome: 'Passed',
        notes: 'Great conversation. She was excited about the GIS background. Asked about product instincts and why Wix. Moved to home assignment.',
        nextSteps: 'Complete product case study assignment',
      },
    ],
    notes: 'High-priority! Home assignment deadline May 9. Case study about improving a Wix feature for small business owners. Need to show data-driven thinking.',
    whyInteresting: 'Wix is a world-class product company with real scale. The student PM program is genuinely rotational and mentored.',
    whatToEmphasize: 'Data-driven thinking, user empathy, GIS product thinking, Agile experience from Unit 9900.',
    createdAt: '2026-03-18T08:00:00Z',
    updatedAt: '2026-05-01T16:00:00Z',
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
- Bonus: military intelligence or OSINT background
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
    notes: 'Found via LinkedIn. Very relevant to Unit 9900 background. Small team, high impact. Not applied yet — need to research more and find the right contact.',
    whyInteresting: 'Unit 9900 background is a very strong fit. Runtime cloud security is a growing field. Early-stage means high learning velocity.',
    whatToEmphasize: 'Intelligence background, OSINT skills, analytical thinking, ability to work with ambiguous data.',
    createdAt: '2026-04-20T10:00:00Z',
    updatedAt: '2026-04-25T11:00:00Z',
  },
]
