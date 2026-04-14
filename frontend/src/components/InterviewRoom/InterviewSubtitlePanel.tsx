// frontend/src/components/InterviewRoom/InterviewSubtitlePanel.tsx
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Virtuoso } from 'react-virtuoso';
import { Volume2, VolumeX } from 'lucide-react';
import type { InterviewQuestion, InterviewSession } from '../../types/interview';

interface Message {
  type: 'interviewer' | 'user';
  content: string;
  category?: string;
  questionIndex?: number;
}

interface InterviewSubtitlePanelProps {
  session: InterviewSession;
  currentQuestion: InterviewQuestion | null;
  messages: Message[];
  questionVoiceEnabled: boolean;
  isRecording: boolean;
  isRecognizing: boolean;
  isSubmitting: boolean;
  isPlayingQuestionAudio: boolean;
  isLoadingQuestionAudio: boolean;
  error?: string | null;

  onQuestionVoiceEnabledChange: (enabled: boolean) => void;
  onReplayQuestionAudio: () => void;
  onStopQuestionAudio: () => void;
}

/**
 * InterviewSubtitlePanel — displays question progress, voice controls, and conversation history.
 * Uses unified semantic tokens from index.css @theme.
 */
export function InterviewSubtitlePanel({
  session,
  currentQuestion,
  messages,
  questionVoiceEnabled,
  isRecording,
  isRecognizing,
  isSubmitting,
  isPlayingQuestionAudio,
  isLoadingQuestionAudio,
  error,
  onQuestionVoiceEnabledChange,
  onReplayQuestionAudio,
  onStopQuestionAudio,
}: InterviewSubtitlePanelProps) {
  const isBusy = isSubmitting || isRecognizing || isRecording;

  const progress = useMemo(() => {
    if (!session || !currentQuestion) return 0;
    return ((currentQuestion.questionIndex + 1) / session.totalQuestions) * 100;
  }, [session, currentQuestion]);

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface-raised)] dark:bg-[var(--color-bg-dark)] rounded-2xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] overflow-hidden">
      {/* Header: progress + voice controls */}
      <div className="px-6 pt-6 pb-5 space-y-5">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-medium text-[var(--color-text)] dark:text-[var(--color-text-dark)] tracking-tight">
              已答 {currentQuestion ? currentQuestion.questionIndex + 1 : 0} / {session.totalQuestions} 题
            </span>
            <span className="text-sm font-medium text-[var(--color-primary-hover)] dark:text-[var(--color-primary)]">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-0.5 bg-[var(--color-border)] dark:bg-[var(--color-border-dark)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[var(--color-primary)] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            />
          </div>
        </div>

        {/* Voice control pill */}
        <div className="flex items-center justify-between gap-4 rounded-xl bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] px-5 py-4">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={() => onQuestionVoiceEnabledChange(!questionVoiceEnabled)}
              disabled={isBusy}
              aria-label={questionVoiceEnabled ? '关闭题目语音播报' : '开启题目语音播报'}
              aria-pressed={questionVoiceEnabled}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:outline-none ${
                questionVoiceEnabled
                  ? 'bg-[var(--color-primary)]'
                  : 'bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)]'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <motion.span
                className="inline-block h-5 w-5 transform rounded-full bg-white shadow-sm"
                animate={{ x: questionVoiceEnabled ? 22 : 2 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              />
            </button>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)] tracking-tight">题目播报</p>
              <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mt-0.5">
                {isLoadingQuestionAudio
                  ? '生成中...'
                  : isPlayingQuestionAudio
                    ? '播放中'
                    : questionVoiceEnabled
                      ? '已开启'
                      : '已关闭'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              onClick={onReplayQuestionAudio}
              disabled={isBusy || isLoadingQuestionAudio || !currentQuestion}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] hover:text-[var(--color-primary-hover)] dark:hover:text-[var(--color-primary)] hover:border-[var(--color-primary-border)] dark:hover:border-[var(--color-primary-border-dark)] hover:bg-[var(--color-primary-subtle)] dark:hover:bg-[var(--color-primary-subtle-dark)] transition-colors duration-150 disabled:opacity-35 disabled:cursor-not-allowed"
              title="播放题目"
            >
              {isLoadingQuestionAudio ? (
                <motion.div
                  className="w-4 h-4 border-2 border-[var(--color-border)] dark:border-[var(--color-border-dark)] border-t-[var(--color-primary)] rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </motion.button>
            <motion.button
              type="button"
              onClick={onStopQuestionAudio}
              disabled={!isPlayingQuestionAudio}
              className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 hover:bg-red-50 dark:hover:bg-red-950 transition-colors duration-150 disabled:opacity-35 disabled:cursor-not-allowed"
              title="停止播放"
            >
              <VolumeX className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-2.5 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-xs font-medium"
          >
            {error}
          </motion.div>
        )}
      </div>

      {/* Conversation history */}
      <div className="flex-1 overflow-hidden border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
        <Virtuoso
          data={messages}
          initialTopMostItemIndex={messages.length - 1}
          followOutput="smooth"
          className="h-full"
          itemContent={(_index, msg) => (
            <div className="px-6 py-4">
              <MessageBubble message={msg} />
            </div>
          )}
        />
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  if (message.type === 'interviewer') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex items-start gap-3"
      >
        {/* Avatar mark */}
        <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)] border border-[var(--color-primary-border)] dark:border-[var(--color-primary-border-dark)] flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-xs font-bold text-[var(--color-primary-hover)] dark:text-[var(--color-primary)]">AI</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] tracking-wide uppercase">面试官</span>
            {message.category && (
              <span className="px-2 py-0.5 bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)] text-[var(--color-primary-hover)] dark:text-[var(--color-primary)] text-xs font-medium rounded border border-[var(--color-primary-border)] dark:border-[var(--color-primary-border-dark)]">
                {message.category}
              </span>
            )}
          </div>
          <div className="text-sm leading-relaxed text-[var(--color-text)] dark:text-[var(--color-text-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-xl rounded-tl-sm px-4 py-3">
            {message.content}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex items-start gap-3 justify-end"
    >
      <div className="flex-1 max-w-[82%] min-w-0">
        <div className="bg-[var(--color-bubble-user)] dark:bg-[var(--color-bubble-user-dark)] text-white rounded-xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
      <div className="w-8 h-8 rounded-lg bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-xs font-bold text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">我</span>
      </div>
    </motion.div>
  );
}
