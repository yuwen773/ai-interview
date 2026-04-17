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
 * InterviewSubtitlePanel — 沉浸式面试房间的底部面板。
 * 显示答题进度、语音控制和对话历史。
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
    <div className="flex flex-col h-full bg-[var(--color-surface-dark)]/95 backdrop-blur-md rounded-2xl border border-white/[0.06] overflow-hidden">
      {/* Header: progress + voice controls */}
      <div className="px-5 pt-5 pb-4 space-y-4">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[var(--color-text-dark)] tracking-tight">
              已答 {currentQuestion ? currentQuestion.questionIndex + 1 : 0} / {session.totalQuestions} 题
            </span>
            <span className="text-sm font-semibold text-[var(--color-primary)]">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[var(--color-primary)] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            />
          </div>
        </div>

        {/* Voice control pill */}
        <div className="flex items-center justify-between gap-4 rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onQuestionVoiceEnabledChange(!questionVoiceEnabled)}
              disabled={isBusy}
              aria-label={questionVoiceEnabled ? '关闭题目语音播报' : '开启题目语音播报'}
              aria-pressed={questionVoiceEnabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none ${
                questionVoiceEnabled
                  ? 'bg-[var(--color-primary)]'
                  : 'bg-white/[0.08]'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <motion.span
                className="inline-block h-4 w-4 transform rounded-full bg-white shadow-sm"
                animate={{ x: questionVoiceEnabled ? 20 : 2 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              />
            </button>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-dark)] tracking-tight">题目播报</p>
              <p className="text-xs text-[var(--color-text-muted-dark)] mt-0.5">
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
          <div className="flex items-center gap-1.5">
            <motion.button
              type="button"
              onClick={onReplayQuestionAudio}
              disabled={isBusy || isLoadingQuestionAudio || !currentQuestion}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.06] bg-white/[0.04] text-[var(--color-text-muted-dark)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/10 transition-colors duration-150 disabled:opacity-35 disabled:cursor-not-allowed"
              title="播放题目"
            >
              {isLoadingQuestionAudio ? (
                <motion.div
                  className="w-3.5 h-3.5 border-2 border-white/[0.12] border-t-[var(--color-primary)] rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </motion.button>
            <motion.button
              type="button"
              onClick={onStopQuestionAudio}
              disabled={!isPlayingQuestionAudio}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-white/[0.06] bg-white/[0.04] text-[var(--color-text-muted-dark)] hover:text-[var(--color-state-recording)] hover:border-[var(--color-state-recording)]/30 hover:bg-[var(--color-state-recording)]/10 transition-colors duration-150 disabled:opacity-35 disabled:cursor-not-allowed"
              title="停止播放"
            >
              <VolumeX className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-2.5 bg-[var(--color-state-recording)]/10 border border-[var(--color-state-recording)]/25 rounded-lg text-[var(--color-state-recording)] text-xs font-medium"
          >
            {error}
          </motion.div>
        )}
      </div>

      {/* Conversation history */}
      <div className="flex-1 overflow-hidden border-t border-white/[0.06]">
        <Virtuoso
          data={messages}
          initialTopMostItemIndex={messages.length - 1}
          followOutput="smooth"
          className="h-full"
          itemContent={(_index, msg) => (
            <div className="px-5 py-3">
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
        className="flex items-start gap-2.5"
      >
        {/* Avatar mark */}
        <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/25 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-[10px] font-bold text-[var(--color-primary)]">AI</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-semibold text-[var(--color-text-muted-dark)] tracking-wide uppercase">面试官</span>
            {message.category && (
              <span className="px-1.5 py-0.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-[11px] font-medium rounded border border-[var(--color-primary)]/20">
                {message.category}
              </span>
            )}
          </div>
          <div className="text-sm leading-relaxed text-[var(--color-text-dark)] bg-white/[0.04] border border-white/[0.06] rounded-xl rounded-tl-sm px-3.5 py-2.5">
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
      className="flex items-start gap-2.5 justify-end"
    >
      <div className="flex-1 max-w-[82%] min-w-0">
        <div className="bg-[var(--color-bubble-user-dark)] text-white rounded-xl rounded-tr-sm px-3.5 py-2.5 text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
      <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-[10px] font-bold text-[var(--color-text-muted-dark)]">我</span>
      </div>
    </motion.div>
  );
}
