export type JobStatus = "Applied" | "Interviewing" | "Offered" | "Rejected";

export type UserProfile = {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
};

export type JobApplication = {
  _id: string;
  companyName: string;
  jobRole: string;
  applicationDate: string;
  status: JobStatus | string;
  notes?: string;
  emailId?: string;
  confidence?: number;
};

export type JobApplicationMutationPayload = {
  companyName: string;
  jobRole: string;
  status: JobStatus;
  notes?: string;
};

export type JobApplicationMutationResponse = {
  success: boolean;
  message: string;
  data: JobApplication;
};

export type JobApplicationsResponse = {
  success: boolean;
  message: string;
  data: JobApplication[];
};

export type SyncResponse = {
  message: string;
  jobApplications?: JobApplication[];
};

export type DeleteJobResponse = {
  success: boolean;
  message: string;
};
