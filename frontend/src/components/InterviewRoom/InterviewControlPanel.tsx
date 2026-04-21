// frontend/src/components/InterviewRoom/InterviewControlPanel.tsx
import { AnimatePresence, motion } from 'framer-motion';
import { Mic, Send, Loader2, Brain, MessageCircle, MicOff } from 'lucide-react';
import type { InterviewMode } from './Interviewer2D';
import { useVoiceInput } from '../../hooks/useVoiceInput';

interface InterviewControlPanelProps {
  mode: InterviewMode;
  isSubmitting: boolean;
  answer: string;
  onAnswerChange: (answer: string) => void;
  onSubmit: () => void;
  onStopInterview: () => void;
  error?: string | null;
}

const prefersReducedMotion =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

export function InterviewControlPanel({
  mode,
  isSubmitting,
  answer,
  onAnswerChange,
  onSubmit,
  onStopInterview,
  error,
}: InterviewControlPanelProps) {
  const voiceInput = useVoiceInput({
    onResult: (text) => {
      onAnswerChange(text);
    },
    onError: (err) => {
      console.error('语音输入错误:', err);
    },
  });

  const isIdle = mode === 'idle';
  const isBusy = isSubmitting || voiceInput.isListening || voiceInput.isTranscribing;

  const statusConfig = {
    idle: { icon: null, text: '', color: 'text-[var(--color-text-muted)]', bgColor: '', borderColor: '' },
    thinking: {
      icon: Brain,
      text: '面试官正在思考...',
      color: 'text-[var(--color-state-thinking)]',
      iconColor: 'text-[var(--color-state-thinking)]',
      bgColor: 'bg-[var(--color-state-thinking)]/10',
      borderColor: 'border-[var(--color-state-thinking)]/20',
    },
    speaking: {
      icon: MessageCircle,
      text: '面试官正在提问...',
      color: 'text-[var(--color-state-speaking)]',
      iconColor: 'text-[var(--color-state-speaking)]',
      bgColor: 'bg-[var(--color-state-speaking)]/10',
      borderColor: 'border-[var(--color-state-speaking)]/20',
    },
    listening: {
      icon: Mic,
      text: '请回答问题',
      color: 'text-[var(--color-state-listening)]',
      iconColor: 'text-[var(--color-state-listening)]',
      bgColor: 'bg-[var(--color-state-listening)]/10',
      borderColor: 'border-[var(--color-state-listening)]/20',
    },
  };

  const status = statusConfig[mode] || statusConfig.idle;

  const iconAnimationProps = prefersReducedMotion
    ? {}
    : mode === 'thinking'
    ? { animate: { scale: [1, 1.1, 1] } }
    : mode === 'speaking'
    ? { animate: { scale: [1, 1.05, 1] } }
    : {};

  const iconTransition = prefersReducedMotion
    ? {}
    : { transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' as const } };

  return (
    <div className="w-full mt-6">
      <div className="relative bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between gap-6">
          {/* 左侧：状态区 */}
          <div className="flex-shrink-0">
            {mode !== 'idle' && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={voiceInput.isListening ? 'recording' : mode}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${voiceInput.isListening ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : `${status.bgColor} ${status.borderColor}`}`}
                >
                  {voiceInput.isListening ? (
                    <>
                      <Mic className={`w-4 h-4 ${prefersReducedMotion ? '' : 'animate-pulse'} text-[var(--color-state-recording)]`} />
                      <span className="text-sm text-[var(--color-state-recording)] font-medium">录音中</span>
                    </>
                  ) : voiceInput.isTranscribing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />
                      <span className="text-sm text-[var(--color-primary)] font-medium">识别中</span>
                    </>
                  ) : status.icon ? (
                    <>
                      <motion.div {...iconAnimationProps} {...iconTransition}>
                        <status.icon className={`w-4 h-4 ${status.iconColor}`} />
                      </motion.div>
                      <span className={`text-sm font-medium ${status.color}`}>
                        {status.text}
                      </span>
                    </>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            )}
            {mode === 'idle' && (
              <div className="flex items-center gap-2 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] text-sm px-3 py-1.5">
                <MicOff className="w-4 h-4" />
                等待开始面试...
              </div>
            )}
          </div>

          {/* 中间：输入区域 — 始终显示 textarea + 麦克风 + 提交 */}
          <div className="flex-1 max-w-2xl">
            {!isIdle && (
              <div className="flex items-center gap-2">
                <textarea
                  value={answer}
                  onChange={(e) => onAnswerChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      if (answer.trim() && !isSubmitting) {
                        onSubmit();
                      }
                    }
                  }}
                  placeholder={voiceInput.isTranscribing ? '正在识别...' : voiceInput.isListening ? '录音中...' : '输入你的回答...'}
                  aria-label="回答内容"
                  disabled={isSubmitting || voiceInput.isTranscribing}
                  rows={1}
                  className="flex-1 px-4 py-3 border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] text-[var(--color-text)] dark:text-[var(--color-text-dark)] placeholder-[var(--color-text-placeholder)] dark:placeholder-[var(--color-text-placeholder-dark)] resize-none transition-all duration-200 disabled:opacity-50"
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                />

                {/* 麦克风按钮 — 微信风格 */}
                <motion.button
                  type="button"
                  onClick={voiceInput.toggle}
                  disabled={!voiceInput.isListening && (isBusy || mode === 'thinking' || mode === 'speaking')}
                  aria-label={voiceInput.isListening ? '停止录音' : '语音输入'}
                  className={`relative w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-xl transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none ${
                    voiceInput.isListening
                      ? 'bg-red-500 hover:bg-red-600 text-white shadow-sm'
                      : voiceInput.isTranscribing
                        ? 'bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] text-[var(--color-primary)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)]'
                        : 'bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 border border-[var(--color-border)] dark:border-[var(--color-border-dark)] disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                  whileTap={voiceInput.isListening ? { scale: 0.92 } : {}}
                >
                  {voiceInput.isListening ? (
                    prefersReducedMotion ? (
                      <Mic className="w-5 h-5" />
                    ) : (
                      <motion.div
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <Mic className="w-5 h-5" />
                      </motion.div>
                    )
                  ) : voiceInput.isTranscribing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Mic className="w-5 h-5" />
                  )}
                </motion.button>

                {/* 提交按钮 */}
                <motion.button
                  onClick={onSubmit}
                  disabled={!answer.trim() || isSubmitting}
                  aria-label="提交回答"
                  className="w-11 h-11 flex-shrink-0 flex items-center justify-center bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileTap={answer.trim() && !isSubmitting ? { scale: 0.92 } : {}}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </motion.button>
              </div>
            )}
          </div>

          {/* 右侧：结束按钮 */}
          <div className="flex-shrink-0">
            {!isIdle && (
              <motion.button
                onClick={onStopInterview}
                disabled={isSubmitting}
                aria-label="结束面试"
                className="px-4 py-2 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] hover:text-[var(--color-state-recording)] rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none"
                whileTap={isSubmitting ? {} : { scale: 0.98 }}
              >
                结束面试
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* 错误提示 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-2 px-4 py-2.5 bg-[var(--color-error)]/15 border border-[var(--color-error)]/30 rounded-lg text-[var(--color-error)] text-sm font-medium"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-4" />
    </div>
  );
}
