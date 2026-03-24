// frontend/src/utils/interviewMode.ts
import type { InterviewMode } from '../components/InterviewRoom/Interviewer2D';

type InterviewStage = 'config' | 'interview';

/**
 * 将面试页面状态映射到面试官模式
 */
export function getInterviewerMode(
  stage: InterviewStage,
  isRecording: boolean,
  isSubmitting: boolean,
  isPlayingQuestionAudio: boolean
): InterviewMode {
  if (stage === 'config') return 'idle';
  if (isSubmitting) return 'thinking';
  if (isPlayingQuestionAudio) return 'speaking';
  if (isRecording) return 'listening';
  return 'listening'; // 默认倾听状态
}
