import {useMemo, useRef} from 'react';
import {motion} from 'framer-motion';
import {Mic, RotateCcw, Send, Square, User} from 'lucide-react';
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
  answer: string;
  onAnswerChange: (answer: string) => void;
  recognizedText: string;
  onRecognizedTextChange: (answer: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onRetryVoiceAnswer: () => void;
  onSubmitRecognizedAnswer: () => void;
  isRecording: boolean;
  isRecognizing: boolean;
  audioUrl: string | null;
  onSubmit: () => void;
  onCompleteEarly: () => void;
  isSubmitting: boolean;
  showCompleteConfirm: boolean;
  onShowCompleteConfirm: (show: boolean) => void;
  error?: string;
}

/**
 * 面试聊天面板组件
 */
export default function InterviewChatPanel({
  session,
  currentQuestion,
  messages,
  candidateInputMode,
  onCandidateInputModeChange,
  answer,
  onAnswerChange,
  recognizedText,
  onRecognizedTextChange,
  onStartRecording,
  onStopRecording,
  onRetryVoiceAnswer,
  onSubmitRecognizedAnswer,
  isRecording,
  isRecognizing,
  audioUrl,
  onSubmit,
  // onCompleteEarly, // 暂时未使用
  isSubmitting,
  // showCompleteConfirm, // 暂时未使用
  onShowCompleteConfirm,
  error
}: InterviewChatPanelProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);

  const progress = useMemo(() => {
    if (!session || !currentQuestion) return 0;
    return ((currentQuestion.questionIndex + 1) / session.totalQuestions) * 100;
  }, [session, currentQuestion]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      if (candidateInputMode === 'voice' && recognizedText.trim()) {
        onSubmitRecognizedAnswer();
        return;
      }
      onSubmit();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mb-4 shadow-sm dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            题目 {currentQuestion ? currentQuestion.questionIndex + 1 : 0} / {session.totalQuestions}
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm dark:shadow-slate-900/50 overflow-hidden flex flex-col min-h-0 border border-slate-100 dark:border-slate-700">
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

        <div className="border-t border-slate-200 dark:border-slate-600 p-4 bg-slate-50 dark:bg-slate-700/50 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="inline-flex rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 p-1">
              <button
                type="button"
                onClick={() => onCandidateInputModeChange('text')}
                disabled={isSubmitting || isRecognizing || isRecording}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  candidateInputMode === 'text'
                    ? 'bg-primary-500 text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                文字回答
              </button>
              <button
                type="button"
                onClick={() => onCandidateInputModeChange('voice')}
                disabled={isSubmitting || isRecognizing || isRecording}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  candidateInputMode === 'voice'
                    ? 'bg-primary-500 text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                语音回答
              </button>
            </div>
            <motion.button
              onClick={() => onShowCompleteConfirm(true)}
              disabled={isSubmitting || isRecognizing || isRecording}
              className="px-6 py-3 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              whileHover={{ scale: isSubmitting || isRecognizing || isRecording ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting || isRecognizing || isRecording ? 1 : 0.98 }}
            >
              提前交卷
            </motion.button>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          {candidateInputMode === 'text' ? (
            <div className="flex gap-3">
              <textarea
                value={answer}
                onChange={(e) => onAnswerChange(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="输入你的回答... (Ctrl/Cmd + Enter 提交)"
                className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                rows={3}
                disabled={isSubmitting}
              />
              <motion.button
                onClick={onSubmit}
                disabled={!answer.trim() || isSubmitting}
                className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 self-start"
                whileHover={{ scale: isSubmitting || !answer.trim() ? 1 : 1.02 }}
                whileTap={{ scale: isSubmitting || !answer.trim() ? 1 : 0.98 }}
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
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-500 bg-white/80 dark:bg-slate-800/80 p-4 space-y-4">
              {!recognizedText ? (
                <>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">录音并识别后再提交</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        录音结束后会先展示识别文本，你确认或编辑后才会推进下一题。
                      </p>
                    </div>
                    {audioUrl && !isRecording && !isRecognizing && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">录音已完成，可重新录制</span>
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
                        disabled={isRecognizing || isSubmitting}
                        className="px-5 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        whileHover={{ scale: isRecognizing || isSubmitting ? 1 : 1.02 }}
                        whileTap={{ scale: isRecognizing || isSubmitting ? 1 : 0.98 }}
                      >
                        <Mic className="w-4 h-4" />
                        开始录音
                      </motion.button>
                    )}
                    <div className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-sm text-slate-600 dark:text-slate-300">
                      {isRecording ? '录音中...' : isRecognizing ? '正在识别语音...' : '尚未录音'}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">识别结果</p>
                    <textarea
                      value={recognizedText}
                      onChange={(e) => onRecognizedTextChange(e.target.value)}
                      onKeyDown={handleKeyPress}
                      rows={4}
                      disabled={isSubmitting}
                      className="w-full px-4 py-3 border border-slate-300 dark:border-slate-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                    />
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      可以直接修改识别文本，确认无误后再提交。
                    </p>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <motion.button
                      onClick={onSubmitRecognizedAnswer}
                      disabled={!recognizedText.trim() || isSubmitting}
                      className="px-5 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      whileHover={{ scale: isSubmitting || !recognizedText.trim() ? 1 : 1.02 }}
                      whileTap={{ scale: isSubmitting || !recognizedText.trim() ? 1 : 0.98 }}
                    >
                      <Send className="w-4 h-4" />
                      {isSubmitting ? '提交中' : '确认并提交'}
                    </motion.button>
                    <motion.button
                      onClick={onRetryVoiceAnswer}
                      disabled={isSubmitting}
                      className="px-5 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                      whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
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
        <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">面试官</span>
            {message.category && (
              <span className="px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs rounded-full">
                {message.category}
              </span>
            )}
          </div>
          <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl rounded-tl-none p-4 text-slate-800 dark:text-slate-200 leading-relaxed">
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
        <div className="bg-primary-500 text-white rounded-2xl rounded-tr-none p-4 leading-relaxed">
          {message.content}
        </div>
      </div>
      <div className="w-8 h-8 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
        <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" viewBox="0 0 24 24" fill="none">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
    </motion.div>
  );
}
