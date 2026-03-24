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
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* 顶部控制区 */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-600 space-y-3">
        {/* 进度条 */}
        <div>
          <div className="flex items-center justify-between mb-2">
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

        {/* 播报控制 */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="inline-flex rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 p-1">
            <button
              type="button"
              onClick={() => onQuestionVoiceEnabledChange(!questionVoiceEnabled)}
              disabled={isBusy}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1.5 ${
                questionVoiceEnabled
                  ? 'bg-primary-500 text-white'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <span className={`inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                questionVoiceEnabled ? 'bg-white/30' : 'bg-slate-300 dark:bg-slate-600'
              }`}>
                <span className={`h-3 w-3 rounded-full bg-white transition-transform ${
                  questionVoiceEnabled ? 'translate-x-3' : 'translate-x-0.5'
                }`} />
              </span>
              播报
            </button>
          </div>
        </div>

        {/* 题目语音播报控制 */}
        <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 px-3 py-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isLoadingQuestionAudio
              ? '正在生成语音...'
              : isPlayingQuestionAudio
                ? '播放中'
                : questionVoiceEnabled
                  ? '自动播报已开启'
                  : '自动播报已关闭'}
          </p>
          <div className="flex gap-1">
            <motion.button
              type="button"
              onClick={onReplayQuestionAudio}
              disabled={isBusy || isLoadingQuestionAudio}
              className="px-2 py-1 bg-primary-500 text-white rounded text-xs hover:bg-primary-600 disabled:opacity-50 flex items-center gap-1"
              whileHover={isBusy || isLoadingQuestionAudio ? {} : { scale: 1.02 }}
              whileTap={isBusy || isLoadingQuestionAudio ? {} : { scale: 0.98 }}
            >
              <Volume2 className="w-3 h-3" />
              播放
            </motion.button>
            <motion.button
              type="button"
              onClick={onStopQuestionAudio}
              disabled={!isPlayingQuestionAudio && !isLoadingQuestionAudio}
              className="px-2 py-1 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded text-xs hover:bg-slate-300 dark:hover:bg-slate-500 disabled:opacity-50 flex items-center gap-1"
              whileHover={isPlayingQuestionAudio || isLoadingQuestionAudio ? {} : { scale: 1.02 }}
              whileTap={isPlayingQuestionAudio || isLoadingQuestionAudio ? {} : { scale: 0.98 }}
            >
              <VolumeX className="w-3 h-3" />
              停止
            </motion.button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-900/20">
            {error}
          </div>
        )}
      </div>

      {/* 对话历史 */}
      <div className="flex-1 overflow-hidden">
        <Virtuoso
          data={messages}
          initialTopMostItemIndex={messages.length - 1}
          followOutput="smooth"
          className="h-full"
          itemContent={(_index, msg) => (
            <div className="px-4 py-3 first:pt-4">
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
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-start gap-2"
      >
        <div className="w-6 h-6 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-xs text-primary-600 dark:text-primary-400">AI</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">面试官</span>
            {message.category && (
              <span className="px-2 py-0.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs rounded-full">
                {message.category}
              </span>
            )}
          </div>
          <div className="bg-slate-100 dark:bg-slate-700 rounded-2xl rounded-tl-none p-3 text-slate-800 dark:text-slate-200 text-sm leading-relaxed">
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
      className="flex items-start gap-2 justify-end"
    >
      <div className="flex-1 max-w-[80%]">
        <div className="bg-primary-500 text-white rounded-2xl rounded-tr-none p-3 text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
      <div className="w-6 h-6 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-xs text-slate-600 dark:text-slate-300">我</span>
      </div>
    </motion.div>
  );
}
