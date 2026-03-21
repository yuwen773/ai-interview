import { useEffect, useRef } from 'react';
import type { InterviewQuestion } from '../types/interview';
import { fetchQuestionAudioBlob, getCachedQuestionAudioBlob } from '../utils/interviewVoiceAudio';

interface UseQuestionVoicePrefetchOptions {
  sessionId: string | null;
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  questionVoiceEnabled: boolean;
  enabled?: boolean;
  windowSize?: number;
}

export function useQuestionVoicePrefetch({
  sessionId,
  questions,
  currentQuestionIndex,
  questionVoiceEnabled,
  enabled = true,
  windowSize = 3,
}: UseQuestionVoicePrefetchOptions): void {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    if (!enabled || !questionVoiceEnabled || !sessionId || questions.length === 0) {
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const normalizedWindowSize = Math.max(1, windowSize);
    const endIndex = Math.min(questions.length, currentQuestionIndex + normalizedWindowSize);
    const targets = questions.slice(currentQuestionIndex, endIndex);

    void (async () => {
      for (const question of targets) {
        if (controller.signal.aborted) {
          return;
        }

        if (!question.question.trim()) {
          continue;
        }

        const request = {
          sessionId,
          questionIndex: question.questionIndex,
          text: question.question,
        };

        const cachedBlob = await getCachedQuestionAudioBlob(request);
        if (cachedBlob) {
          continue;
        }

        try {
          await fetchQuestionAudioBlob(request);
        } catch (error) {
          if (controller.signal.aborted) {
            return;
          }
          console.warn('question_voice_prefetch_failed', {
            sessionId,
            questionIndex: question.questionIndex,
            error,
          });
        }
      }
    })();

    return () => {
      controller.abort();
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    };
  }, [currentQuestionIndex, enabled, questionVoiceEnabled, questions, sessionId, windowSize]);
}
