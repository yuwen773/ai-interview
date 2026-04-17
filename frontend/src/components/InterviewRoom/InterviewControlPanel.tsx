// frontend/src/components/InterviewRoom/InterviewControlPanel.tsx
import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Mic, Keyboard, Send, Loader2, Brain, MessageCircle, MicOff } from 'lucide-react';
import type { InterviewMode } from './Interviewer2D';
import type { CandidateInputMode } from '../../types/interview';
import { useVoiceInput } from '../../hooks/useVoiceInput';

interface InterviewControlPanelProps {
  mode: InterviewMode;
  candidateInputMode: CandidateInputMode;
  isRecording: boolean;
  isRecognizing: boolean;
  isSubmitting: boolean;
  audioLevel: number;
  answer: string;
  onAnswerChange: (answer: string) => void;
  onSubmit: () => void;
  onStopInterview: () => void;
  onCandidateInputModeChange: (mode: CandidateInputMode) => void;
  onReRecordVoice: () => void;
  voiceJustRecognized: boolean;
  error?: string | null;
}

// 检测用户是否偏好减少动画
const prefersReducedMotion =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

/**
 * InterviewControlPanel — 面试控制栏
 * 使用项目统一的语义 token（surface/border/text/primary/state），
 * 遵循 light/dark 配对的写法规范。
 */
export function InterviewControlPanel({
  mode,
  candidateInputMode,
  isRecording,
  isRecognizing,
  isSubmitting,
  audioLevel,
  answer,
  onAnswerChange,
  onSubmit,
  onStopInterview,
  onCandidateInputModeChange,
  onReRecordVoice,
  voiceJustRecognized,
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
  // When voiceInput is active (listening or transcribing), treat as busy too
  const isBusy = isSubmitting || isRecognizing || isRecording || voiceInput.isListening || voiceInput.isTranscribing;

  // 状态配置 - 使用项目状态色 token（thinking/speaking/listening/recording）
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

  // 动画配置
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
    <div className="w-full">
      {/* 主控制栏 */}
      <div className="relative bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-2xl shadow-sm p-4">
        <div className="flex items-center justify-between gap-6">
          {/* 左侧：状态区 */}
          <div className="flex-shrink-0">
            {mode !== 'idle' && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${status.bgColor} ${status.borderColor}`}
                >
                  {isRecording || voiceInput.isListening ? (
                    <>
                      <Mic className={`w-4 h-4 ${prefersReducedMotion ? '' : 'animate-pulse'} text-[var(--color-state-recording)]`} />
                      <span className="text-sm text-[var(--color-state-recording)] font-medium">录音中</span>
                    </>
                  ) : status.icon ? (
                    <>
                      <motion.div
                        {...iconAnimationProps}
                        {...iconTransition}
                      >
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

          {/* 中间：输入区域 */}
          <div className="flex-1 max-w-2xl">
            {!isIdle && (
              <div className="flex items-center gap-4">
                {/* 模式切换 */}
                <button
                  type="button"
                  onClick={() => onCandidateInputModeChange(candidateInputMode === 'text' ? 'voice' : 'text')}
                  disabled={isBusy}
                  aria-label={candidateInputMode === 'text' ? '切换到语音输入' : '切换到文字输入'}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] hover:text-[var(--color-text)] dark:hover:text-[var(--color-text-dark)] hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none text-sm"
                >
                  {candidateInputMode === 'text' ? (
                    <Keyboard className="w-3.5 h-3.5" />
                  ) : (
                    <Mic className="w-3.5 h-3.5" />
                  )}
                  <span className="text-xs">{candidateInputMode === 'text' ? '文字' : '语音'}</span>
                </button>

                {/* 输入控件 */}
                <div className="flex-1">
                  <AnimatePresence mode="wait">
                    {candidateInputMode === 'text' ? (
                      /* 文字输入模式 */
                      <motion.div
                        key="text-input"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex gap-2"
                      >
                        <div className="relative flex-1">
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
                            placeholder="输入你的回答..."
                            aria-label="回答内容"
                            disabled={isSubmitting || isRecognizing}
                            rows={1}
                            className="w-full px-4 py-3 border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] text-[var(--color-text)] dark:text-[var(--color-text-dark)] placeholder-[var(--color-text-placeholder)] dark:placeholder-[var(--color-text-placeholder-dark)] resize-none transition-all duration-200 disabled:opacity-50"
                            style={{
                              minHeight: '44px',
                              maxHeight: '120px',
                            }}
                          />
                          {voiceJustRecognized && (
                            <div className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 px-3 py-2">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                                <span className="text-sm text-[var(--color-state-thinking)]">识别完成，请确认后提交</span>
                              </div>
                              <button
                                type="button"
                                onClick={onReRecordVoice}
                                className="text-xs text-[var(--color-primary)]/80 hover:text-[var(--color-primary)] underline underline-offset-2 transition-colors"
                              >
                                重新录音
                              </button>
                            </div>
                          )}
                          {!voiceJustRecognized && (
                            <div className="mt-1.5 text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] text-center">
                              Tip: Ctrl+Enter 提交
                            </div>
                          )}
                        </div>
                        <motion.button
                          onClick={onSubmit}
                          disabled={!answer.trim() || isSubmitting || isRecognizing}
                          aria-label="提交回答"
                          className="px-5 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl font-medium shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          whileHover={!answer.trim() || isSubmitting || isRecognizing ? {} : { scale: 1.02 }}
                          whileTap={!answer.trim() || isSubmitting || isRecognizing ? {} : { scale: 0.98 }}
                        >
                          {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </motion.button>
                      </motion.div>
                    ) : (
                      /* 语音输入模式 */
                      <motion.div
                        key="voice-input"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center gap-4"
                      >
                        {/* 录音按钮 */}
                        <motion.button
                          onClick={voiceInput.toggle}
                          disabled={!voiceInput.isListening && !voiceInput.isTranscribing && (isBusy || mode === 'thinking' || mode === 'speaking')}
                          aria-label={voiceInput.isListening ? '停止录音' : '开始录音'}
                          className={`relative px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 shadow-sm ${
                            voiceInput.isListening
                              ? 'bg-red-500 hover:bg-red-600 text-white'
                              : 'bg-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/30 text-[var(--color-primary)] border border-[var(--color-primary)]/30 disabled:opacity-50 disabled:cursor-not-allowed'
                          }`}
                          whileHover={voiceInput.isListening ? { scale: 1.02 } : (isBusy || mode === 'thinking' || mode === 'speaking' ? {} : { scale: 1.02 })}
                          whileTap={voiceInput.isListening ? { scale: 0.98 } : {}}
                        >
                          {voiceInput.isListening ? (
                            <>
                              {!prefersReducedMotion ? (
                                <motion.div
                                  className="w-3 h-3 bg-white rounded-sm"
                                  animate={{ scale: [1, 0.7, 1] }}
                                  transition={{ duration: 0.5, repeat: Infinity }}
                                />
                              ) : (
                                <div className="w-3 h-3 bg-white rounded-sm" />
                              )}
                              <span>停止录音</span>
                            </>
                          ) : voiceInput.isTranscribing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>识别中...</span>
                            </>
                          ) : (
                            <>
                              <Mic className="w-4 h-4" />
                              <span>开始录音</span>
                            </>
                          )}
                        </motion.button>

                        {/* 波形动画 */}
                        <div className="flex-1 flex items-center gap-1 h-12 overflow-hidden">
                          {voiceInput.isListening ? (
                            <VoiceWaveform audioLevel={audioLevel} />
                          ) : voiceInput.isTranscribing ? (
                            <div className="flex items-center gap-2 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] text-sm">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>正在识别...</span>
                            </div>
                          ) : (
                            <div className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] text-sm">
                              点击麦克风开始说话
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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
                whileHover={isSubmitting ? {} : { scale: 1.02 }}
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

      {/* 底部留白 */}
      <div className="h-4" />
    </div>
  );
}

// 语音波形动画 - 20个bar各自独立的keyframes在组件外部定义一次
const WAVE_BARS = 20;
const waveKeyframes = Array.from({ length: WAVE_BARS }, (_, i) => `
  @keyframes wave-bar-${i} {
    0% { opacity: 0.6; transform: scaleY(0.7); }
    100% { opacity: 1; transform: scaleY(1); }
  }
`).join('\n');

// 语音波形组件
function VoiceWaveform({ audioLevel }: { audioLevel: number }) {
  const barHeights = useMemo(() => {
    return Array.from({ length: WAVE_BARS }, (_, i) => {
      const normalized = i / WAVE_BARS;
      const baseOscillation = Math.sin(normalized * Math.PI * 4) * 0.5 + 0.5;
      return 12 + baseOscillation * 24 + audioLevel * 60;
    });
  }, [audioLevel]);

  return (
    <div className="flex items-center gap-0.5 h-full" aria-hidden="true">
      <style>{waveKeyframes}</style>
      {barHeights.map((height, i) => (
        <div
          key={i}
          className="w-1 bg-gradient-to-t from-[var(--color-primary)] to-[var(--color-primary-300)] rounded-full"
          style={{
            height: `${height}px`,
            animation: `wave-bar-${i} 0.6s ease-in-out infinite alternate`,
            animationDelay: `${i * 40}ms`,
            minHeight: '4px',
          }}
        />
      ))}
    </div>
  );
}
