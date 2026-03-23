type InterviewCompletionState = {
  status?: string | null;
  evaluateStatus?: string | null;
  completedAt?: string | null;
};

export function isInterviewCompleted(session: InterviewCompletionState) {
  if (session.evaluateStatus === 'COMPLETED') {
    return true;
  }

  if (typeof session.completedAt === 'string' && session.completedAt.trim()) {
    return true;
  }

  return session.status === 'COMPLETED' || session.status === 'EVALUATED';
}

export function isInterviewOngoing(session: InterviewCompletionState) {
  return session.status === 'CREATED' || session.status === 'IN_PROGRESS';
}
