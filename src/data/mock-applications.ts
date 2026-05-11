import type { JobApplication } from '@/types'

export const mockApplications: JobApplication[] = [
  {
    id: 'app-nvidia',
    companyId: 'company-nvidia',
    companyName: 'Nvidia',
    companyLogoUrl: 'https://www.google.com/s2/favicons?domain=nvidia.com&sz=128',
    roleName: 'Data Engineer Intern',
    roleUrl: 'https://nvidia.com/careers',
    jobDescription: `Nvidia is looking for a Data Engineer Intern to join the AI Infrastructure team in Tel Aviv. You will work on large-scale data pipelines powering training and inference for world-class ML models.

**Responsibilities:**
- Design and maintain ETL pipelines ingesting telemetry from GPU clusters
- Build dashboards and data models for the ML platform team
- Work with Spark, Kafka, and cloud-native data services
- Collaborate with ML engineers to understand data needs
- Optimize query performance across petabyte-scale datasets

**Requirements:**
- 3rd or 4th year B.Sc. in CS, Information Systems, or related field
- Strong SQL and Python skills
- Familiarity with distributed systems and cloud platforms
- GPA 85+ preferred`,
    stage: 'Technical Interview',
    priority: 'Critical',
    workModel: 'Hybrid',
    location: 'Tel Aviv, Israel',
    salaryMin: 9000,
    salaryMax: 13000,
    currency: 'ILS',
    fitScore: 90,
    urgencyScore: 93,
    submittedCvId: 'cv-data',
    submittedCvName: 'CV — Data-heavy v2.1',
    appliedAt: '2026-03-20T10:00:00Z',
    nextEventAt: '2026-05-14T13:00:00Z',
    nextEventDescription: 'Technical Interview — SQL, Python & system design',
    contactIds: ['contact-maya', 'contact-tom'],
    taskIds: ['task-nvidia-sql', 'task-nvidia-system-design'],
    interviewStages: [
      {
        id: 'int-nvidia-1',
        applicationId: 'app-nvidia',
        type: 'Phone Screen',
        scheduledAt: '2026-04-08T11:00:00Z',
        completedAt: '2026-04-08T11:30:00Z',
        duration: 30,
        interviewer: 'Maya Cohen',
        interviewerTitle: 'Technical Recruiter',
        outcome: 'Passed',
        notes: 'Brief intro call. Asked about data engineering background, availability, and interest in AI infrastructure.',
        nextSteps: 'Technical interview with engineering team',
      },
      {
        id: 'int-nvidia-2',
        applicationId: 'app-nvidia',
        type: 'Technical',
        scheduledAt: '2026-05-14T13:00:00Z',
        duration: 60,
        interviewer: 'Tom Goldberg',
        interviewerTitle: 'Senior Data Engineer',
        outcome: 'Pending',
        notes: 'Upcoming. Expect SQL optimization, Python data manipulation, and one system design on a streaming pipeline.',
      },
    ],
    notes: 'Strong fit — GPU/AI infrastructure is exactly the kind of scale I want to work with. Technical bar is high, need to prep SQL and system design.',
    whyInteresting: 'Nvidia is defining the AI era. Working on their data infrastructure is a rare opportunity to touch world-class ML systems.',
    whatToEmphasize: 'Large-scale data work, SQL proficiency, Python skills, ability to work with ambiguous requirements.',
    createdAt: '2026-03-18T09:00:00Z',
    updatedAt: '2026-05-02T14:00:00Z',
  },
  {
    id: 'app-wix',
    companyId: 'company-wix',
    companyName: 'Wix',
    companyLogoUrl: 'https://www.google.com/s2/favicons?domain=wix.com&sz=128',
    roleName: 'Product Manager Student Program',
    roleUrl: 'https://wix.com/jobs',
    jobDescription: `Wix is looking for exceptional students to join our PM Student Program — a structured rotational program working directly with product squads owning features used by 250M+ users.

**Responsibilities:**
- Collaborate with a dedicated squad (PM, engineers, designers)
- Write feature specs and contribute to the product roadmap
- Analyze user behavior using internal analytics and A/B testing
- Conduct user research and competitive analysis

**Requirements:**
- 3rd year B.Sc. student (any technical discipline)
- Exceptional written and verbal communication in English
- Strong analytical skills and comfort with data
- Evidence of product thinking`,
    stage: 'Manager Interview',
    priority: 'Critical',
    workModel: 'Hybrid',
    location: 'Tel Aviv, Israel',
    fitScore: 87,
    urgencyScore: 89,
    submittedCvId: 'cv-product',
    submittedCvName: 'CV — Product-leaning v1.3',
    appliedAt: '2026-03-22T09:00:00Z',
    nextEventAt: '2026-05-15T11:00:00Z',
    nextEventDescription: 'Manager Interview — with VP Product',
    contactIds: ['contact-lihi'],
    taskIds: ['task-wix-manager-prep', 'task-wix-followup'],
    interviewStages: [
      {
        id: 'int-wix-1',
        applicationId: 'app-wix',
        type: 'HR Interview',
        scheduledAt: '2026-04-10T13:00:00Z',
        completedAt: '2026-04-10T13:45:00Z',
        duration: 45,
        interviewer: 'Lihi Friedman',
        interviewerTitle: 'Talent Partner',
        outcome: 'Passed',
        notes: 'Great conversation. Expressed strong interest in the data-informed PM profile. Moved to home assignment.',
        nextSteps: 'Complete product case study',
      },
      {
        id: 'int-wix-2',
        applicationId: 'app-wix',
        type: 'Home Assignment Review',
        scheduledAt: '2026-04-28T14:00:00Z',
        completedAt: '2026-04-28T14:45:00Z',
        duration: 45,
        interviewer: 'Lihi Friedman',
        interviewerTitle: 'Talent Partner',
        outcome: 'Passed',
        notes: 'Positive feedback on the case study structure and metrics framework. Moving to manager interview.',
        nextSteps: 'Manager interview with VP Product',
      },
      {
        id: 'int-wix-3',
        applicationId: 'app-wix',
        type: 'Manager Interview',
        scheduledAt: '2026-05-15T11:00:00Z',
        duration: 60,
        outcome: 'Pending',
        notes: 'Final interview before offer. Prepare leadership stories and product vision discussion.',
      },
    ],
    notes: 'Most advanced process — already through HR + home assignment. Manager interview on May 15 is the last step.',
    whyInteresting: 'Wix is a world-class product company with real scale. Student PM program is genuinely mentored and impactful.',
    whatToEmphasize: 'Data-driven thinking, user empathy, Agile experience, structured product reasoning.',
    createdAt: '2026-03-20T08:00:00Z',
    updatedAt: '2026-05-02T16:00:00Z',
  },
  {
    id: 'app-google',
    companyId: 'company-google',
    companyName: 'Google',
    companyLogoUrl: 'https://www.google.com/s2/favicons?domain=google.com&sz=128',
    roleName: 'Associate Product Manager Intern',
    roleUrl: 'https://careers.google.com',
    jobDescription: `Google is seeking APM Intern candidates for our Israel R&D center. You will work embedded in a product team, owning a feature area for the duration of the internship.

**Responsibilities:**
- Define and scope a feature project with your host PM
- Write PRDs, run user studies, and track launch metrics
- Present recommendations to senior leadership
- Partner with engineering and UX on execution

**Requirements:**
- Pursuing B.Sc. or M.Sc. in CS, Business, or related field
- Strong analytical and communication skills
- Demonstrated passion for building products users love
- English fluency`,
    stage: 'Home Assignment',
    priority: 'High',
    workModel: 'Hybrid',
    location: 'Tel Aviv, Israel',
    fitScore: 83,
    urgencyScore: 75,
    submittedCvId: 'cv-product',
    submittedCvName: 'CV — Product-leaning v1.3',
    appliedAt: '2026-03-28T09:00:00Z',
    deadlineAt: '2026-05-18T23:59:00Z',
    nextEventAt: '2026-05-18T23:59:00Z',
    nextEventDescription: 'Home Assignment deadline — Product case submission',
    contactIds: ['contact-daniel'],
    taskIds: ['task-google-assignment', 'task-google-research'],
    interviewStages: [
      {
        id: 'int-google-1',
        applicationId: 'app-google',
        type: 'Phone Screen',
        scheduledAt: '2026-04-22T10:00:00Z',
        completedAt: '2026-04-22T10:30:00Z',
        duration: 30,
        interviewer: 'Daniel Levy',
        interviewerTitle: 'University Programs Recruiter',
        outcome: 'Passed',
        notes: 'Friendly call. Asked about motivation, background, and availability. Sent home assignment link.',
        nextSteps: 'Complete APM case study',
      },
    ],
    notes: 'Strong brand, competitive program. Case study deadline May 18 — need to carve time this week.',
    whyInteresting: 'Google-scale products and rigorous PM culture. APM program is one of the best training grounds in the industry.',
    whatToEmphasize: 'Data-driven decisions, product metrics, structured problem solving, communication skills.',
    createdAt: '2026-03-25T09:00:00Z',
    updatedAt: '2026-05-01T15:00:00Z',
  },
  {
    id: 'app-microsoft',
    companyId: 'company-microsoft',
    companyName: 'Microsoft',
    companyLogoUrl: 'https://www.google.com/s2/favicons?domain=microsoft.com&sz=128',
    roleName: 'Program Manager Intern',
    roleUrl: 'https://microsoft.com/careers',
    jobDescription: `Microsoft Israel is looking for Program Manager Interns to join teams working on Azure and Microsoft 365. PMs at Microsoft own product strategy and cross-team execution for enterprise-scale products.

**Responsibilities:**
- Partner with engineering teams on feature design and delivery
- Track project milestones and identify blockers
- Write functional specs and participate in design reviews
- Analyze telemetry data to drive product decisions

**Requirements:**
- 3rd or 4th year B.Sc. in CS, Information Systems, or Industrial Engineering
- Strong communication and organizational skills
- Technical background to partner effectively with engineering
- Ability to manage multiple workstreams simultaneously`,
    stage: 'HR Screen',
    priority: 'High',
    workModel: 'Hybrid',
    location: 'Herzliya, Israel',
    fitScore: 80,
    urgencyScore: 65,
    submittedCvId: 'cv-product',
    submittedCvName: 'CV — Product-leaning v1.3',
    appliedAt: '2026-04-05T10:00:00Z',
    nextEventAt: '2026-05-19T10:00:00Z',
    nextEventDescription: 'HR Screen — Intro call with Sarah Williams',
    contactIds: ['contact-sarah'],
    taskIds: ['task-microsoft-prep'],
    interviewStages: [
      {
        id: 'int-microsoft-1',
        applicationId: 'app-microsoft',
        type: 'HR Interview',
        scheduledAt: '2026-05-19T10:00:00Z',
        duration: 45,
        interviewer: 'Sarah Williams',
        interviewerTitle: 'University Recruiter',
        outcome: 'Pending',
        notes: 'First call. Cover: background, why Microsoft, growth mindset examples, availability.',
      },
    ],
    notes: 'Applied online. HR screen scheduled for May 19. Good fit for PM/PM-adjacent roles given the broad ownership model.',
    whyInteresting: 'Azure and M365 are used by billions. Working on enterprise products at this scale is a unique learning opportunity.',
    whatToEmphasize: 'Cross-functional coordination, technical depth, project management experience, structured thinking.',
    createdAt: '2026-04-03T09:00:00Z',
    updatedAt: '2026-04-10T11:00:00Z',
  },
  {
    id: 'app-mobileye',
    companyId: 'company-mobileye',
    companyName: 'Mobileye',
    companyLogoUrl: 'https://www.google.com/s2/favicons?domain=mobileye.com&sz=128',
    roleName: 'Project Manager Student',
    roleUrl: 'https://mobileye.com/careers',
    jobDescription: `Mobileye is seeking a Project Manager Student to join our autonomous driving software programs team.

**Responsibilities:**
- Support program managers in tracking milestones across AV projects
- Create and maintain project plans, risk registers, and status reports
- Interface with R&D, QA, and hardware teams
- Prepare executive presentations and decision docs

**Requirements:**
- B.Sc. student in Information Systems, Industrial Engineering, CS, or related field (3rd year+)
- Strong analytical and organizational skills
- Experience with project management tools
- Technical background to communicate effectively with engineers`,
    stage: 'HR Screen',
    priority: 'High',
    workModel: 'On-site',
    location: 'Jerusalem, Israel',
    fitScore: 78,
    urgencyScore: 58,
    submittedCvId: 'cv-product',
    submittedCvName: 'CV — Product-leaning v1.3',
    appliedAt: '2026-04-12T11:00:00Z',
    nextEventAt: '2026-05-13T09:00:00Z',
    nextEventDescription: 'Phone Screen — Intro with Avi Ben-Tal',
    contactIds: ['contact-avi'],
    taskIds: ['task-mobileye-prep'],
    interviewStages: [
      {
        id: 'int-mobileye-1',
        applicationId: 'app-mobileye',
        type: 'Phone Screen',
        scheduledAt: '2026-05-13T09:00:00Z',
        duration: 30,
        interviewer: 'Avi Ben-Tal',
        interviewerTitle: 'Program Manager',
        outcome: 'Pending',
        notes: 'Intro call via referral. Avi is a BGU alum — reached out on LinkedIn.',
      },
    ],
    notes: 'Got in via alumni connection. Jerusalem commute is a concern — will ask about remote policy.',
    whyInteresting: 'Mobileye is solving one of the hardest engineering problems in the world. AV project management is unique.',
    whatToEmphasize: 'Technical depth, structured thinking, experience managing complex parallel workstreams.',
    createdAt: '2026-04-10T09:00:00Z',
    updatedAt: '2026-04-12T11:00:00Z',
  },
  {
    id: 'app-dell',
    companyId: 'company-dell',
    companyName: 'Dell Technologies',
    companyLogoUrl: 'https://www.google.com/s2/favicons?domain=dell.com&sz=128',
    roleName: 'Data Analyst Intern',
    roleUrl: 'https://dell.com/careers',
    jobDescription: `Dell Technologies Israel is hiring a Data Analyst Intern to support the cloud infrastructure product team with data insights and reporting.

**Responsibilities:**
- Build dashboards and reports for the product and engineering teams
- Analyze operational metrics and flag anomalies
- Support data modeling for capacity planning
- Document data pipelines and maintain data dictionary

**Requirements:**
- B.Sc. student in Information Systems, Statistics, or CS
- SQL proficiency
- Experience with BI tools (Tableau, Power BI, or Looker)
- Python is a plus`,
    stage: 'Applied',
    priority: 'Medium',
    workModel: 'Hybrid',
    location: 'Ra\'anana, Israel',
    fitScore: 70,
    urgencyScore: 40,
    submittedCvId: 'cv-data',
    submittedCvName: 'CV — Data-heavy v2.1',
    appliedAt: '2026-04-25T10:00:00Z',
    contactIds: [],
    taskIds: ['task-dell-research'],
    interviewStages: [],
    notes: 'Applied online. Backup option — less exciting than Nvidia/Google but solid learning environment.',
    whyInteresting: 'Enterprise data at scale. Good for building a BI and analytics portfolio.',
    whatToEmphasize: 'SQL skills, data modeling, BI tool experience, attention to detail.',
    createdAt: '2026-04-23T09:00:00Z',
    updatedAt: '2026-04-25T10:00:00Z',
  },
]
