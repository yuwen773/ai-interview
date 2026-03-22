import type { JobRole } from './interview';

export interface DashboardLatestResume {
  id: number;
  filename: string;
  uploadedAt: string;
}

export interface DashboardLatestInterview {
  sessionId: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  overallScore: number | null;
  jobRole?: JobRole;
  jobLabel?: string;
}

export interface DashboardLatestReport {
  sessionId: string;
  overallScore: number;
  completedAt: string | null;
}

export interface DashboardSummary {
  resumeCount: number;
  totalInterviewCount: number;
  unfinishedInterviewCount: number;
  latestResume: DashboardLatestResume | null;
  latestInterview: DashboardLatestInterview | null;
  latestReport: DashboardLatestReport | null;
}
