import type { UserProfile } from '@/types'

// Generic demo persona — shown in demo mode and as UI fallback for mock mode.
// Never put real personal details here; this file is committed to version control.
// "Maya Cohen" is a placeholder; intended for marketing screenshots and demos.
export const mockUser: UserProfile = {
  id: 'user-demo',
  name: 'Maya Cohen',
  displayName: 'Maya',
  preferredName: 'Maya',
  email: 'maya.cohen@example.com',
  phone: '',
  location: 'Tel Aviv, Israel',
  university: 'Bar-Ilan University',
  degree: 'B.Sc. Industrial Engineering & Management',
  year: 3,
  unit: undefined,
  bio: 'Third-year Industrial Engineering & Management student focused on product and data internships. Strong foundations in analytics, SQL, and cross-functional project work.',
  linkedinUrl: 'https://linkedin.com/in/maya-cohen-demo',
  githubUrl: 'https://github.com/maya-cohen-demo',
  targetRoles: ['Product Manager Intern', 'Project Manager Intern', 'Data Analyst Intern', 'Associate Product Manager'],
  targetIndustries: ['Tech', 'SaaS', 'AI / ML', 'Fintech', 'Consumer'],
  skills: [
    'Python', 'SQL', 'Data Analysis', 'Tableau', 'Excel',
    'JIRA', 'Agile / Scrum', 'Product Thinking', 'PostgreSQL',
    'React', 'TypeScript', 'A/B Testing',
  ],
  languages: ['Hebrew (Native)', 'English (Fluent)'],
  defaultPitch: `I'm a third-year Industrial Engineering & Management student looking for product and data internships. I combine analytical depth — SQL, Python, A/B testing — with cross-functional project experience from a prior internship at a SaaS startup.`,
  createdAt: '2025-01-15T10:00:00Z',
  updatedAt: '2026-04-20T14:30:00Z',
}
