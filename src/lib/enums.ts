export type ApplicationStage =
  | 'Interested'
  | 'Applied'
  | 'HR Screen'
  | 'Home Assignment'
  | 'Technical Interview'
  | 'Manager Interview'
  | 'Final Interview'
  | 'Offer'
  | 'Negotiating'
  | 'Rejected'
  | 'Accepted'
  | 'Withdrawn'

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical'

export type TaskStatus = 'Todo' | 'In Progress' | 'Done' | 'Cancelled'

export type TaskCategory =
  | 'Preparation'
  | 'Follow-up'
  | 'Application'
  | 'Assignment'
  | 'Research'
  | 'Admin'

export type WorkModel = 'On-site' | 'Hybrid' | 'Remote'

export type SalaryType = 'Hourly' | 'Monthly'

export type JobScope =
  | '2 days/week'
  | '3 days/week'
  | '4 days/week'
  | 'Full-time'

export type CompanySize =
  | '1-10'
  | '11-50'
  | '51-200'
  | '201-500'
  | '501-2000'
  | '2001-10000'
  | '10000+'

export type ContactType =
  | 'HR'
  | 'Recruiter'
  | 'Hiring Manager'
  | 'Employee'
  | 'Referral'
  | 'Other'

export type InterviewType =
  | 'Phone Screen'
  | 'HR Interview'
  | 'Technical'
  | 'System Design'
  | 'Behavioral'
  | 'Case Study'
  | 'Home Assignment Review'
  | 'Manager Interview'
  | 'Final Round'
  | 'Offer Call'

export type InterviewOutcome = 'Passed' | 'Failed' | 'Pending' | 'Cancelled'

export type CalendarEventType =
  | 'Interview'
  | 'Assignment Deadline'
  | 'Application Deadline'
  | 'Follow-up Reminder'
  | 'Preparation Session'
  | 'General Task'

export type DocumentType =
  | 'CV'
  | 'Cover Letter'
  | 'Portfolio'
  | 'Certificate'
  | 'Transcript'
  | 'Reference Letter'
  | 'Other'

/**
 * Prep is organised by the round you are walking into, not by subject.
 *
 * The earlier list mixed the two — 'HR' and 'Behavioral' next to 'SQL' and
 * 'Python' — which left no answer to the question people actually have the
 * night before: what am I being asked tomorrow. A discipline like SQL is not a
 * kind of interview; it is what gets asked inside the professional round, and
 * it now lives there as a role family.
 *
 * STAR is likewise absent: it is the way you answer a story question, not a
 * round of its own. Questions that suit it are flagged in the question bank.
 */
export type PrepCategory =
  | 'Phone Screen'
  | 'Professional'
  | 'Home Assignment'
  | 'Manager'
  | 'HR / Personality'
  | 'Other'

/**
 * What the professional round is about. Chosen when browsing questions, not
 * stored on the answer — the saved answer belongs to a round, and the family
 * only decides which questions are worth showing while writing it.
 */
export type RoleFamily =
  | 'Software Engineering'
  | 'Data Engineering'
  | 'Data Analysis / BI'
  | 'Data Science / ML'
  | 'Product Management'
  | 'Project / Program Management'
  | 'Business / Systems Analysis'
  | 'QA / Automation'
  | 'DevOps / SRE'
  | 'Cybersecurity'
  | 'IT / Information Systems'
  | 'Support / Customer Success'

export type ConfidenceLevel = 1 | 2 | 3 | 4 | 5

export type AIToolType =
  | 'Company Summary'
  | 'JD Parser'
  | 'Prepare Me'
  | 'Interview Summary'
  | 'Follow-up Message'
  | 'Personalized Answer'

export type ActivityType =
  | 'application_created'
  | 'stage_changed'
  | 'task_completed'
  | 'interview_scheduled'
  | 'offer_received'
  | 'note_added'
  | 'document_added'
  | 'contact_added'
