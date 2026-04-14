import {useMemo, useRef} from 'react';
import {motion} from 'framer-motion';
import {Mic, RotateCcw, Send, Square, User, Volume2, VolumeX} from 'lucide-react';
import {Virtuoso, type VirtuosoHandle} from 'react-virtuoso';
import type {CandidateInputMode, InterviewQuestion, InterviewSession} from '../types/interview';

interface Message {
  type: 'interviewer' | 'user';
  content: string;
  category?: string;
  questionIndex?: number;
}

interface InterviewChatPanelProps {
  session: InterviewSession;
  currentQuestion: InterviewQuestion | null;
  messages: Message[];
  candidateInputMode: CandidateInputMode;
  onCandidateInputModeChange: (mode: CandidateInputMode) => void;
  questionVoiceEnabled: boolean;
  onQuestionVoiceEnabledChange: (enabled: boolean) => void;
  answer: string;
  onAnswerChange: (answer: string) => void;
  recognizedText: string;
  onRecognizedTextChange: (answer: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onRetryVoiceAnswer: () => void;
  onSubmitRecognizedAnswer: () => void;
  onSwitchToTextMode: () => void;
  isRecording: boolean;
  isRecognizing: boolean;
  audioUrl: string | null;
  isPlayingQuestionAudio: boolean;
  isLoadingQuestionAudio: boolean;
  onReplayQuestionAudio: () => void;
  onStopQuestionAudio: () => void;
  onSubmit: () => void;
  onCompleteEarly: () => void;
  isSubmitting: boolean;
  showCompleteConfirm: boolean;
  onShowCompleteConfirm: (show: boolean) => void;
  error?: string;
}

/**
 * InterviewChatPanel — 主对话面板，使用统一的 stone/amber 暖色语义 token。
 * 设计规范：温暖中性 + 琥珀金强调，Calm/precise/confident 品牌调性。
 */
export default function InterviewChatPanel({
  session,
  currentQuestion,
  messages,
  candidateInputMode,
  onCandidateInputModeChange,
  questionVoiceEnabled,
  onQuestionVoiceEnabledChange,
  answer,
  onAnswerChange,
  recognizedText,
  onRecognizedTextChange,
  onStartRecording,
  onStopRecording,
  onRetryVoiceAnswer,
  onSubmitRecognizedAnswer,
  onSwitchToTextMode,
  isRecording,
  isRecognizing,
  audioUrl,
  isPlayingQuestionAudio,
  isLoadingQuestionAudio,
  onReplayQuestionAudio,
  onStopQuestionAudio,
  onSubmit,
  // onCompleteEarly, // 暂时未使用
  isSubmitting,
  // showCompleteConfirm, // 暂时未使用
  onShowCompleteConfirm,
  error
}: InterviewChatPanelProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  // 把提交、识别、录音统一视为忙碌态
  const isBusy = isSubmitting || isRecognizing || isRecording;

  const progress = useMemo(() => {
    if (!session || !currentQuestion) return 0;
    return ((currentQuestion.questionIndex + 1) / session.totalQuestions) * 100;
  }, [session, currentQuestion]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      if (isBusy) return;
      if (candidateInputMode === 'voice' && recognizedText.trim()) {
        onSubmitRecognizedAnswer();
        return;
      }
      onSubmit();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-4xl mx-auto">
      {/* 进度卡片 */}
      <div className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-2xl p-6 mb-4 shadow-sm border border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
            已答 {currentQuestion ? currentQuestion.questionIndex + 1 : 0} / {session.totalQuestions} 题
          </span>
          <span className="text-sm text-[var(--color-primary)] dark:text-[var(--color-primary)]">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[var(--color-primary)] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* 主面板 */}
      <div className="flex-1 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0 border border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
        <Virtuoso
          ref={virtuosoRef}
          data={messages}
          initialTopMostItemIndex={messages.length - 1}
          followOutput="smooth"
          className="flex-1"
          itemContent={(_index, msg) => (
            <div className="pb-4 px-6 first:pt-6">
              <MessageBubble message={msg} />
            </div>
          )}
        />

        {/* 输入区域 */}
        <div className="border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)] p-4 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex gap-3 flex-wrap">
              {/* 输入模式切换 */}
              <div className="inline-flex rounded-xl bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] p-1">
                <button
                  type="button"
                  onClick={() => onCandidateInputModeChange('text')}
                  disabled={isBusy}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    candidateInputMode === 'text'
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]'
                  }`}
                >
                  文字回答
                </button>
                <button
                  type="button"
                  onClick={() => onCandidateInputModeChange('voice')}
                  disabled={isBusy}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    candidateInputMode === 'voice'
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]'
                  }`}
                >
                  语音回答
                </button>
              </div>
              {/* 题目语音播报开关 */}
              <div className="inline-flex rounded-xl bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] p-1">
                <button
                  type="button"
                  role="switch"
                  aria-checked={questionVoiceEnabled}
                  onClick={() => onQuestionVoiceEnabledChange(!questionVoiceEnabled)}
                  disabled={isBusy}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${
                    questionVoiceEnabled
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]'
                  }`}
                >
                  <span className={`inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    questionVoiceEnabled ? 'bg-white/30' : 'bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)]'
                  }`}>
                    <span className={`h-4 w-4 rounded-full bg-white transition-transform ${
                      questionVoiceEnabled ? 'translate-x-4' : 'translate-x-0.5'
                    }`} />
                  </span>
                  题目自动语音播报
                </button>
              </div>
            </div>
            <motion.button
              onClick={() => onShowCompleteConfirm(true)}
              disabled={isBusy}
              className="px-6 py-3 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] rounded-xl font-medium hover:bg-[var(--color-border)] dark:hover:bg-[var(--color-border-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm border border-[var(--color-border)] dark:border-[var(--color-border-dark)]"
              whileHover={{ scale: isBusy ? 1 : 1.02 }}
              whileTap={{ scale: isBusy ? 1 : 0.98 }}
            >
              提前交卷
            </motion.button>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-3 text-sm text-red-600 dark:text-red-400 space-y-3">
              <p>{error}</p>
              {candidateInputMode === 'voice' && !isRecording && (
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={onRetryVoiceAnswer}
                    disabled={isBusy}
                    className="px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-200 transition-colors hover:bg-red-200 dark:hover:bg-red-900/60 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    重试语音
                  </button>
                  <button
                    type="button"
                    onClick={onSwitchToTextMode}
                    disabled={isBusy}
                    className="px-3 py-2 rounded-lg bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] text-[var(--color-text)] dark:text-[var(--color-text-dark)] transition-colors hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)] disabled:opacity-50 disabled:cursor-not-allowed border border-[var(--color-border)] dark:border-[var(--color-border-dark)]"
                  >
                    切回文字作答
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 题目语音播报控制 */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">题目语音播报</p>
              <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">
                {isLoadingQuestionAudio
                  ? '正在生成题目语音...'
                  : isPlayingQuestionAudio
                    ? '播放中，可随时停止'
                    : questionVoiceEnabled
                      ? '自动播报已开启，当前题目也可手动重播'
                      : '自动播报已关闭，仍可手动播放当前题目'}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <motion.button
                type="button"
                onClick={onReplayQuestionAudio}
                disabled={isBusy || isLoadingQuestionAudio}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                whileHover={{ scale: isBusy || isLoadingQuestionAudio ? 1 : 1.02 }}
                whileTap={{ scale: isBusy || isLoadingQuestionAudio ? 1 : 0.98 }}
              >
                <Volume2 className="w-4 h-4" />
                {isLoadingQuestionAudio ? '生成中' : isPlayingQuestionAudio ? '重新播放' : '播放题目'}
              </motion.button>
              <motion.button
                type="button"
                onClick={onStopQuestionAudio}
                disabled={!isPlayingQuestionAudio && !isLoadingQuestionAudio}
                className="px-4 py-2 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] rounded-lg text-sm font-medium hover:bg-[var(--color-border)] dark:hover:bg-[var(--color-border-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-[var(--color-border)] dark:border-[var(--color-border-dark)]"
                whileHover={{ scale: !isPlayingQuestionAudio && !isLoadingQuestionAudio ? 1 : 1.02 }}
                whileTap={{ scale: !isPlayingQuestionAudio && !isLoadingQuestionAudio ? 1 : 0.98 }}
              >
                <VolumeX className="w-4 h-4" />
                停止播放
              </motion.button>
            </div>
          </div>

          {/* 文字回答模式 */}
          {candidateInputMode === 'text' ? (
            <div className="flex gap-3">
              <textarea
                value={answer}
                onChange={(e) => onAnswerChange(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="输入你的回答... (Ctrl/Cmd + Enter 提交)"
                className="flex-1 px-4 py-3 border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent resize-none bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] text-[var(--color-text)] dark:text-[var(--color-text-dark)] placeholder-[var(--color-text-placeholder)] dark:placeholder-[var(--color-text-placeholder-dark)]"
                rows={3}
                disabled={isSubmitting || isRecognizing}
              />
              <motion.button
                onClick={onSubmit}
                disabled={!answer.trim() || isSubmitting || isRecognizing}
                className="px-6 py-3 bg-[var(--color-primary)] text-white rounded-xl font-medium hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 self-start"
                whileHover={{ scale: isSubmitting || isRecognizing || !answer.trim() ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting || isRecognizing || !answer.trim() ? 1 : 0.98 }}
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    提交中
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    提交
                  </>
                )}
              </motion.button>
            </div>
          ) : (
            /* 语音回答模式 */
            <div className="rounded-2xl border border-dashed border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] p-4 space-y-4">
              {!recognizedText ? (
                <>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">录音并识别后再提交</p>
                      <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">
                        录音结束后会先展示识别文本，你确认或编辑后才会推进下一题。
                      </p>
                    </div>
                    {audioUrl && !isRecording && !isRecognizing && (
                      <span className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">录音已完成，可重新录制</span>
                    )}
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {isRecording ? (
                      <motion.button
                        onClick={onStopRecording}
                        className="px-5 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Square className="w-4 h-4" />
                        停止并识别
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={onStartRecording}
                        disabled={isRecognizing || isSubmitting || isLoadingQuestionAudio}
                        className="px-5 py-3 bg-[var(--color-primary)] text-white rounded-xl font-medium hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        whileHover={{ scale: isRecognizing || isSubmitting || isLoadingQuestionAudio ? 1 : 1.02 }}
                        whileTap={{ scale: isRecognizing || isSubmitting || isLoadingQuestionAudio ? 1 : 0.98 }}
                      >
                        <Mic className="w-4 h-4" />
                        开始录音
                      </motion.button>
                    )}
                    <div className="px-4 py-3 rounded-xl bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
                      {isRecording ? '录音中...' : isRecognizing ? '正在识别语音...' : audioUrl ? '录音已完成，等待识别结果或重新录音' : '尚未录音'}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-2">识别结果</p>
                    <textarea
                      value={recognizedText}
                      onChange={(e) => onRecognizedTextChange(e.target.value)}
                      onKeyDown={handleKeyPress}
                      rows={4}
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent resize-none bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] text-[var(--color-text)] dark:text-[var(--color-text-dark)] placeholder-[var(--color-text-placeholder)] dark:placeholder-[var(--color-text-placeholder-dark)]"
                    />
                    <p className="mt-2 text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">
                      可以直接修改识别文本，确认无误后再提交。
                    </p>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <motion.button
                      onClick={onSubmitRecognizedAnswer}
                      disabled={!recognizedText.trim() || isSubmitting}
                      className="px-5 py-3 bg-[var(--color-primary)] text-white rounded-xl font-medium hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      whileHover={{ scale: isSubmitting || !recognizedText.trim() ? 1 : 1.02 }}
                      whileTap={{ scale: isSubmitting || !recognizedText.trim() ? 1 : 0.98 }}
                    >
                      <Send className="w-4 h-4" />
                      {isSubmitting ? '提交中' : '确认并提交'}
                    </motion.button>
                    <motion.button
                      onClick={onRetryVoiceAnswer}
                      disabled={isSubmitting || isRecognizing}
                      className="px-5 py-3 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] rounded-xl font-medium hover:bg-[var(--color-border)] dark:hover:bg-[var(--color-border-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-[var(--color-border)] dark:border-[var(--color-border-dark)]"
                      whileHover={{ scale: isSubmitting || isRecognizing ? 1 : 1.02 }}
                      whileTap={{ scale: isSubmitting || isRecognizing ? 1 : 0.98 }}
                    >
                      <RotateCcw className="w-4 h-4" />
                      重录
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  if (message.type === 'interviewer') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-start gap-3"
      >
        {/* Avatar */}
        <div className="w-8 h-8 bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)] rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-[var(--color-primary-hover)] dark:text-[var(--color-primary)]" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">面试官</span>
            {message.category && (
              <span className="px-2 py-0.5 bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)] text-[var(--color-primary-hover)] dark:text-[var(--color-primary)] text-xs rounded-full">
                {message.category}
              </span>
            )}
          </div>
          <div className="bg-[var(--color-bubble-interviewer)] dark:bg-[var(--color-bubble-interviewer-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-2xl rounded-tl-sm p-4 text-[var(--color-text)] dark:text-[var(--color-text-dark)] leading-relaxed">
            {message.content}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-3 justify-end"
    >
      <div className="flex-1 max-w-[80%]">
        <div className="bg-[var(--color-bubble-user)] dark:bg-[var(--color-bubble-user-dark)] text-white rounded-2xl rounded-tr-sm p-4 leading-relaxed">
          {message.content}
        </div>
      </div>
      {/* User avatar */}
      <div className="w-8 h-8 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] rounded-full flex items-center justify-center flex-shrink-0 border border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
        <svg className="w-4 h-4 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]" viewBox="0 0 24 24" fill="none">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
    </motion.div>
  );
}
