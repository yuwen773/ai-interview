import { request } from './request';

export interface TopicMasteryDto {
  topic: string;
  score: number;
  sessionCount: number;
}

export interface WeakPointDto {
  id: number;
  topic: string;
  questionText: string;
  answerSummary: string | null;
  score: number | null;
  source: string;
  sessionId: number | null;
  nextReview: string;
  easeFactor: number;
  repetitions: number;
  timesSeen: number;
  isImproved: boolean;
}

export interface StrongPointDto {
  id: number;
  topic: string;
  description: string;
  source: string;
  sessionId: number | null;
  firstSeen: string;
}

export interface UserProfileDto {
  userId: string;
  targetRole: string | null;
  topicMasteries: TopicMasteryDto[];
  totalWeakPoints: number;
  improvedCount: number;
  dueReviewCount: number;
}

function buildUrl(base: string, params: Record<string, string | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) searchParams.set(key, value);
  }
  const qs = searchParams.toString();
  return qs ? `${base}?${qs}` : base;
}

export const profileApi = {
  getProfile: (userId: string = 'current') =>
    request.get<UserProfileDto>(buildUrl('/api/profile', { userId })),
  getDueReviews: (userId: string = 'current', topic?: string) =>
    request.get<WeakPointDto[]>(buildUrl('/api/review/due', { userId, topic })),
  getStrongPoints: (userId: string = 'current') =>
    request.get<StrongPointDto[]>(buildUrl('/api/profile/strong-points', { userId })),
  enrollWeakPoints: (userId: string, items: Record<string, unknown>[]) =>
    request.post('/api/review/enroll', { userId, items }),
};
