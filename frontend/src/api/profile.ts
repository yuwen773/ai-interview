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

export type WeakPointStatus = 'ACTIVE' | 'IMPROVED' | 'DUE';

export interface StrongPointDto {
  id: number;
  topic: string;
  description: string;
  source: string;
  sessionId: number | null;
  firstSeen: string;
}

export interface BehaviorSignalDto {
  id: number;
  namespace: string;
  signalKey: string;
  polarity: string;
  statement: string;
  evidence: Record<string, unknown>[];
  timesSeen: number;
  status: string;
  lastSeen: string | null;
}

export interface ProfilePatternDto {
  id: number;
  patternType: string;
  title: string;
  summary: string;
  relatedTopics: string[];
  relatedSignalIds: number[];
  confidence: number;
  status: string;
  lastSeen: string | null;
}

export interface ProfileRecommendationDto {
  type: string;
  title: string;
  reason: string;
  topic: string | null;
  priority: number;
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
  getProfile: (userId: string = 'default') =>
    request.get<UserProfileDto>(buildUrl('/api/profile', { userId })),
  getDueReviews: (userId: string = 'default', topic?: string) =>
    request.get<WeakPointDto[]>(buildUrl('/api/review/due', { userId, topic })),
  getStrongPoints: (userId: string = 'default') =>
    request.get<StrongPointDto[]>(buildUrl('/api/profile/strong-points', { userId })),
  getWeakPoints: (userId: string = 'default', status: WeakPointStatus = 'ACTIVE', topic?: string) =>
    request.get<WeakPointDto[]>(buildUrl('/api/profile/weak-points', { userId, status, topic })),
  getBehaviorSignals: (userId: string = 'default', namespace?: string, status?: string) =>
    request.get<BehaviorSignalDto[]>(buildUrl('/api/profile/behavior-signals', { userId, namespace, status })),
  getPatterns: (userId: string = 'default', status: string = 'ACTIVE') =>
    request.get<ProfilePatternDto[]>(buildUrl('/api/profile/patterns', { userId, status })),
  getRecommendations: (userId: string = 'default') =>
    request.get<ProfileRecommendationDto[]>(buildUrl('/api/profile/recommendations', { userId })),
  enrollWeakPoints: (userId: string, items: Record<string, unknown>[]) =>
    request.post('/api/review/enroll', { userId, items }),
};
