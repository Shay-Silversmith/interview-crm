import type { UserProfile } from '@/types'

// Generic demo persona — shown in demo mode and as UI fallback.
// Never put real personal details here; this file is committed to version control.
export const mockUser: UserProfile = {
  id: 'user-demo',
  name: 'Demo User',
  preferredName: 'Demo',
  email: 'demo@example.com',
  phone: '',
  location: 'Tel Aviv, Israel',
  university: 'Tel Aviv University',
  degree: 'B.Sc. Information Systems Engineering',
  year: 3,
  unit: 'IDF Intelligence Corps',
  bio: 'Third-year Information Systems Engineering student with a background in data analysis, GIS, and project management. Experienced in cross-functional environments and passionate about building data-driven products.',
  linkedinUrl: 'https://linkedin.com/in/demo-user',
  githubUrl: 'https://github.com/demo-user',
  targetRoles: ['Product Manager Student', 'Project Manager Student', 'Data Engineer Intern', 'AI Product Manager'],
  targetIndustries: ['Tech', 'Cybersecurity', 'AI / ML', 'GIS / Mapping', 'SaaS'],
  skills: [
    'Python', 'SQL', 'GIS (QGIS, ArcGIS)', 'Data Analysis', 'Tableau', 'Power BI',
    'JIRA', 'Agile / Scrum', 'Product Thinking', 'PostgreSQL',
    'React', 'TypeScript',
  ],
  languages: ['Hebrew (Native)', 'English (Fluent)'],
  defaultPitch: `I'm a third-year Information Systems Engineering student with hands-on experience in GIS, large-scale data systems, and cross-functional project management. I'm now focused on product, project, and data roles where I can combine technical depth with strategic thinking.`,
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2026-04-20T14:30:00Z',
}
