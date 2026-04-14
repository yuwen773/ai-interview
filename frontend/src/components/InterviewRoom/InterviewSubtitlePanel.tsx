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
    <div className="flex flex-col h-full bg-slate-800 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* 顶部控制区 */}
      <div className="p-4 border-b border-slate-700/30 space-y-4">
        {/* 进度条 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-300">
              已答 {currentQuestion ? currentQuestion.questionIndex + 1 : 0} / {session.totalQuestions} 题
            </span>
            <span className="text-sm text-slate-400">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* 题目语音播报控制 */}
        <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-800/40 border border-slate-700/30 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onQuestionVoiceEnabledChange(!questionVoiceEnabled)}
              disabled={isBusy}
              aria-label={questionVoiceEnabled ? '关闭题目语音播报' : '开启题目语音播报'}
              aria-pressed={questionVoiceEnabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:outline-none ${
                questionVoiceEnabled ? 'bg-primary-500' : 'bg-slate-600'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                questionVoiceEnabled ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
            <div>
              <p className="text-sm font-medium text-slate-300">题目播报</p>
              <p className="text-xs text-slate-500">
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
          <div className="flex gap-2">
            <motion.button
              type="button"
              onClick={onReplayQuestionAudio}
              disabled={isBusy || isLoadingQuestionAudio || !currentQuestion}
              className="p-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              whileHover={isBusy || isLoadingQuestionAudio ? {} : { scale: 1.05 }}
              whileTap={isBusy || isLoadingQuestionAudio ? {} : { scale: 0.95 }}
              title="播放题目"
            >
              {isLoadingQuestionAudio ? (
                <motion.div
                  className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full"
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
              className="p-2 bg-slate-700/50 hover:bg-red-500/20 text-white hover:text-red-400 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              whileHover={isPlayingQuestionAudio ? { scale: 1.05 } : {}}
              whileTap={isPlayingQuestionAudio ? { scale: 0.95 } : {}}
              title="停止播放"
            >
              <VolumeX className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs"
          >
            {error}
          </motion.div>
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
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="flex items-start gap-3"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 border border-primary-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-primary-400">AI</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-medium text-slate-400">面试官</span>
            {message.category && (
              <span className="px-2 py-0.5 bg-primary-500/10 text-primary-400/80 text-xs rounded-full border border-primary-500/20">
                {message.category}
              </span>
            )}
          </div>
          <div className="bg-slate-800/60 border border-slate-700/30 rounded-2xl rounded-tl-none px-4 py-3 text-slate-200 text-sm leading-relaxed">
            {message.content}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-3 justify-end"
    >
      <div className="flex-1 max-w-[85%] min-w-0">
        <div className="bg-gradient-to-r from-primary-500/20 to-primary-600/10 border border-primary-500/20 rounded-2xl rounded-tr-none px-4 py-3 text-slate-200 text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
      <div className="w-8 h-8 rounded-xl bg-slate-800/60 border border-slate-700/30 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-medium text-slate-400">我</span>
      </div>
    </motion.div>
  );
}
