import type { UserProfile } from '@/types'

export const mockUser: UserProfile = {
  id: 'user-1',
  name: 'Shay Silversmith',
  preferredName: 'Shay',
  email: 'shay@interviewflow.local',
  phone: '+972-50-123-4567',
  location: 'Tel Aviv, Israel',
  university: 'Ben-Gurion University of the Negev',
  degree: 'B.Sc. Information Systems Engineering',
  year: 3,
  unit: 'Unit 9900 (Intelligence Corps)',
  bio: 'Third-year Information Systems Engineering student with experience in GIS, data analysis, and AI systems. IDF veteran from Unit 9900 with strong analytical and cross-functional collaboration skills. Passionate about building data-driven products.',
  linkedinUrl: 'https://linkedin.com/in/shay-silversmith',
  githubUrl: 'https://github.com/shaysilver',
  targetRoles: ['Product Manager Student', 'Project Manager Student', 'Data Engineer Intern', 'AI Product Manager'],
  targetIndustries: ['Tech', 'Cybersecurity', 'AI / ML', 'GIS / Mapping', 'SaaS'],
  skills: [
    'Python', 'SQL', 'GIS (QGIS, ArcGIS)', 'Data Analysis', 'Tableau', 'Power BI',
    'JIRA', 'Agile / Scrum', 'Product Thinking', 'SQL', 'PostgreSQL',
    'React', 'TypeScript', 'OSINT', 'Signal Processing',
  ],
  languages: ['Hebrew (Native)', 'English (Fluent)', 'Arabic (Basic)'],
  defaultPitch: `I'm a third-year Information Systems Engineering student at Ben-Gurion University. Before my degree, I served in Unit 9900 — the IDF's geospatial intelligence unit — where I worked on large-scale GIS and data systems under high-pressure conditions. That experience gave me deep analytical skills and the ability to drive clarity when things are ambiguous. I'm now focused on product, project, and data roles where I can combine technical depth with strategic thinking.`,
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2026-04-20T14:30:00Z',
}
