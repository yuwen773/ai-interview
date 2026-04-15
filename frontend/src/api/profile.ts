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

export interface UserProfileDto {
  userId: string;
  targetRole: string | null;
  topicMasteries: TopicMasteryDto[];
  totalWeakPoints: number;
  improvedCount: number;
  dueReviewCount: number;
}

export const profileApi = {
  getProfile: (userId: string = 'current') =>
    request.get<UserProfileDto>(`/api/profile?userId=${userId}`),
  getDueReviews: (userId: string = 'current', topic?: string) =>
    request.get<WeakPointDto[]>(`/api/review/due?userId=${userId}${topic ? `&topic=${topic}` : ''}`),
};
