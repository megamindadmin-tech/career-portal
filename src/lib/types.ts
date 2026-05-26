import { z } from "zod";

export const CANDIDATE_STATUSES = [
  "Applied",
  "In Review",
  "Shortlisted",
  "First Round",
  "Second Round",
  "Third Round",
  "Final Round",
  "Hired",
  "Rejected",
  "Future Reference",
] as const;

export const CANDIDATE_TYPES = ["full-time", "internship"] as const;
export const CANDIDATE_SOURCES = ["Website", "LinkedIn", "Naukri", "Indeed", "Facebook", "Instagram", "WhatsApp", "Referral", "Other"] as const;

export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];
export type CandidateType = (typeof CANDIDATE_TYPES)[number];
export type CandidateSource = (typeof CANDIDATE_SOURCES)[number];

export type Candidate = {
  id: string;
  fullName: string;
  email: string;
  contactNumber: string;
  location?: string; // Kept for backward compatibility, new data uses city/state
  address: string;
  city: string;
  state: string;
  pincode: string;
  education: string;
  workExperience?: string; // from AI
  experience: string; // from form/db
  position: string;
  portfolio: string;
  resumeUrl: string;
  avatar: string;
  status: CandidateStatus | string; // Allow for lowercase from db
  type: CandidateType;
  submittedAt: any; // Allow for Firestore timestamp object
  whatsappNumber: string;
  introductionVideoIntern?: string;
  introductionVideoFulltime?: string;
  comments?: string;
  submissions?: AssessmentSubmission[];
  source?: CandidateSource | string;
  currentCTC?: string;
  expectedCTC?: string;
  assessmentCompleted?: boolean;
  assessmentPdfUrl?: string;
};

export const CandidateUpdateSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address"),
  contactNumber: z.string().min(1, "Contact number is required"),
  whatsappNumber: z.string().min(1, "WhatsApp number is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(1, "Pincode is required"),
  education: z.string().optional(),
  experience: z.string().optional(),
  position: z.string().min(1, "Position is required"),
  portfolio: z.string().optional(),
  introductionVideoIntern: z.string().refine(
    (val) => {
      if (val === "" || val.toLowerCase() === "na" || val.toLowerCase() === "n/a") return true;
      return z.string().url().safeParse(val).success;
    },
    { message: "Invalid URL" }
  ),
  introductionVideoFulltime: z.string().refine(
    (val) => {
      if (val === "" || val.toLowerCase() === "na" || val.toLowerCase() === "n/a") return true;
      return z.string().url().safeParse(val).success;
    },
    { message: "Invalid URL" }
  ),
  status: z.enum(CANDIDATE_STATUSES),
  type: z.enum(CANDIDATE_TYPES),
  comments: z.string().optional(),
  source: z.string().optional(),
  currentCTC: z.string().optional(),
  expectedCTC: z.string().optional(),
  assessmentCompleted: z.boolean().optional(),
  assessmentPdfUrl: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.type === "full-time" && (!data.experience || data.experience.trim() === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Experience is required for full-time candidates",
      path: ["experience"],
    });
  }
});

export const JOB_STATUSES = ["Open", "Closed"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_TYPES = ["full-time", "internship"] as const;
export type JobType = (typeof JOB_TYPES)[number];

export type JobSection = {
  title: string;
  points: string[];
};

export type Job = {
  id: string;
  position: string;
  icon: string;
  openings: number;
  experience: string;
  location: string;
  status: JobStatus;
  createdAt: any;
  type: JobType;
  priority: number;
  duration?: string;
  sections?: JobSection[];
  highlightPoints?: string[];
  // Deprecated fields for backward compatibility
  responsibilities?: string[];
  skills?: string[];
};

// Assessment Types
export const QUESTION_TYPES = ["textarea", "text", "multiple-choice", "checkbox", "file-upload", "date", "email", "number", "url", "tel"] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

export const AUTHENTICATION_TYPES = ["none", "email_verification"] as const;
export type AuthenticationType = (typeof AUTHENTICATION_TYPES)[number];

export type AssessmentQuestion = {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  isRequired?: boolean;
  correctAnswer?: string | string[];
  points?: number;
};

export type AssessmentSection = {
  id: string;
  title: string;
  questions: AssessmentQuestion[];
};

export type Assessment = {
  id: string;
  title: string;
  passcode?: string;
  timeLimit?: number; // in minutes
  sections?: AssessmentSection[];
  questions?: AssessmentQuestion[]; // For backward compatibility
  createdAt: any;
  submissionCount?: number;
  authentication: AuthenticationType;
  disableCopyPaste?: boolean;
  successTitle?: string;
  successMessage?: string;
  startPageTitle?: string;
  startPageInstructions?: string;
  startButtonText?: string;
  startPageImportantInstructions?: string;
  isActive?: boolean;
  shouldAutoGrade?: boolean;
};

export type AssessmentSubmission = {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  candidateName: string;
  candidateEmail: string;
  candidateContact?: string;
  candidateResumeUrl?: string;
  answers: {
    questionId: string;
    questionText: string;
    answer: any;
    isCorrect?: boolean | null; // Allow null for non-gradable questions
    points?: number;
  }[];
  submittedAt: any;
  timeTaken: number; // in seconds
  collegeId?: string | null;
  collegeCandidateId?: string | null;
  candidateId?: string | null; // Link to the main 'applications' candidate
  score?: number;
  maxScore?: number;
  shouldAutoGrade?: boolean; // Added to pass this info to the modal
};

// College Collaboration Types
export const CollegeSchema = z.object({
  name: z.string().min(1, "College name is required"),
  location: z.string().min(1, "Location is required"),
  collegeEmail: z.string().email("A valid email is required for the college.").optional().or(z.literal("")),
  contactPerson: z.string().min(1, "Contact person's name is required"),
  contactEmail: z.string().email("A valid email is required for the contact person"),
});

export type CollegeCandidate = {
  id: string;
  name: string;
  email: string;
  status: CandidateStatus | string;
  importedAt?: any;
  submissions?: AssessmentSubmission[];
};

// Email Template Types
export const TemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  subject: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Email body cannot be empty"),
});

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
  createdAt: any;
};
