import type { AISummary } from '@/types'

export const mockAISummaries: AISummary[] = [
  {
    id: 'ai-company-nvidia',
    toolType: 'Company Summary',
    companyId: 'company-nvidia',
    applicationId: 'app-nvidia',
    inputData: {
      companyName: 'Nvidia',
      targetRole: 'Data Engineer Intern',
    },
    outputData: {
      mission: 'To advance the simulation of physical and virtual worlds, powering AI, gaming, and autonomous systems.',
      culture: 'High-performance engineering culture. Fast-paced, results-oriented. Engineers own their domain deeply. Strong emphasis on technical excellence and innovation.',
      recentNews: 'Blackwell GPU architecture launch; NIM microservices for enterprise AI deployment; record revenue driven by AI datacenter demand.',
      interviewTips: 'Expect deep SQL and pipeline architecture questions. Know Kafka, Spark, and cloud-native data services. Be ready to discuss trade-offs in distributed system design.',
      redFlags: 'High bar — rejections are common even for strong candidates. Interview process can be lengthy.',
      fitAssessment: 'Strong fit for a data engineering profile. Large-scale data pipeline work is exactly what this role entails.',
    },
    isMocked: true,
    createdAt: '2026-04-20T14:00:00Z',
  },
  {
    id: 'ai-jd-nvidia',
    toolType: 'JD Parser',
    applicationId: 'app-nvidia',
    inputData: {
      jobDescription: 'Nvidia Data Engineer Intern JD',
    },
    outputData: {
      roleSummary: 'Data engineering role on the AI Infrastructure team — building pipelines for GPU telemetry and ML platform data.',
      technologies: 'Python, Spark, Kafka, SQL, AWS, CUDA',
      keyRequirements: 'SQL proficiency, Python/Pandas, Distributed systems knowledge, 3rd/4th year B.Sc.',
      whatToEmphasize: 'Large-scale pipeline experience, SQL optimization, Cloud data services',
    },
    isMocked: true,
    createdAt: '2026-04-21T10:00:00Z',
  },
  {
    id: 'ai-company-wix',
    toolType: 'Company Summary',
    companyId: 'company-wix',
    applicationId: 'app-wix',
    inputData: {
      companyName: 'Wix',
      targetRole: 'Product Manager Student Program',
    },
    outputData: {
      mission: 'To give everyone the freedom to create, manage, and grow any kind of online presence.',
      culture: 'Product-led, data-driven, and experimentation-heavy culture. PMs own the "what" and "why". Strong emphasis on user empathy and A/B testing.',
      recentNews: 'Wix Studio launch for professional designers; AI-powered site creation tools; expanded eCommerce capabilities for SMBs.',
      interviewTips: 'Lead with metrics and data. VP Product cares about structured thinking and user empathy. Have 3 concrete product examples ready.',
      redFlags: 'Competitive program — many candidates. Differentiate with a strong quantitative story.',
      fitAssessment: 'Strong fit for analytical PM profile. Data-engineering background is a differentiator in the PM space.',
    },
    isMocked: true,
    createdAt: '2026-04-25T09:00:00Z',
  },
]
