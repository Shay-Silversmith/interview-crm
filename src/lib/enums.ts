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

export type PrepCategory =
  | 'Personal Pitch'
  | 'HR'
  | 'Behavioral'
  | 'STAR'
  | 'Technical'
  | 'Product / PM'
  | 'SQL'
  | 'Python'
  | 'Data Engineering'
  | 'Information Systems'

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
