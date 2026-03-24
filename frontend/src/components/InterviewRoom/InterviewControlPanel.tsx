// frontend/src/components/InterviewRoom/InterviewControlPanel.tsx
import { AnimatePresence, motion } from 'framer-motion';
import { Mic, Square, Keyboard } from 'lucide-react';
import type { InterviewMode } from './Interviewer2D';
import type { CandidateInputMode } from '../../types/interview';

interface InterviewControlPanelProps {
  mode: InterviewMode;
  candidateInputMode: CandidateInputMode;
  isRecording: boolean;
  isRecognizing: boolean;
  isSubmitting: boolean;
  audioLevel: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onStopInterview: () => void;
  onCandidateInputModeChange: (mode: CandidateInputMode) => void;
  error?: string | null;
}

export function InterviewControlPanel({
  mode,
  candidateInputMode,
  isRecording,
  isRecognizing,
  isSubmitting,
  audioLevel,
  onStartRecording,
  onStopRecording,
  onStopInterview,
  onCandidateInputModeChange,
  error,
}: InterviewControlPanelProps) {
  const isBusy = isSubmitting || isRecognizing || isRecording;
  const isIdle = mode === 'idle';

  return (
    <div className="flex items-center justify-between gap-4">
      {/* 左侧：录音状态 */}
      <div className="flex items-center gap-4">
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3"
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 text-sm font-medium">录音中</span>
            </div>
            <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full"
                animate={{ width: `${audioLevel * 100}%` }}
                transition={{ duration: 0.05 }}
              />
            </div>
          </motion.div>
        )}

        {/* 当前状态提示 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-sm"
          >
            {mode === 'thinking' && (
              <>
                <motion.div
                  className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <span className="text-amber-400">正在思考...</span>
              </>
            )}
            {mode === 'speaking' && (
              <>
                <motion.div
                  className="w-4 h-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <div className="w-full h-full rounded-full border-2 border-green-400 border-t-transparent" />
                </motion.div>
                <span className="text-green-400">正在提问...</span>
              </>
            )}
            {mode === 'listening' && !isRecording && !isIdle && (
              <span className="text-blue-400">点击右下方按钮开始回答</span>
            )}
          </motion.div>
        </AnimatePresence>

        {/* 错误提示 */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}
      </div>

      {/* 右侧：控制按钮 */}
      <div className="flex items-center gap-2">
        {!isIdle && (
          <>
            {/* 文字/语音切换 */}
            <div className="inline-flex rounded-xl bg-slate-700/50 border border-slate-600 p-1">
              <button
                type="button"
                onClick={() => onCandidateInputModeChange('text')}
                disabled={isBusy}
                className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-1.5 ${
                  candidateInputMode === 'text'
                    ? 'bg-primary-500 text-white'
                    : 'text-slate-300 hover:bg-slate-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Keyboard className="w-4 h-4" />
                文字
              </button>
              <button
                type="button"
                onClick={() => onCandidateInputModeChange('voice')}
                disabled={isBusy}
                className={`px-3 py-2 text-sm rounded-lg transition-colors flex items-center gap-1.5 ${
                  candidateInputMode === 'voice'
                    ? 'bg-primary-500 text-white'
                    : 'text-slate-300 hover:bg-slate-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <Mic className="w-4 h-4" />
                语音
              </button>
            </div>

            {/* 录音按钮 */}
            {candidateInputMode === 'voice' && (
              <motion.button
                onClick={isRecording ? onStopRecording : onStartRecording}
                disabled={isRecording ? false : (isBusy || mode === 'thinking' || mode === 'speaking')}
                className={`px-6 py-5 rounded-xl font-medium transition-all ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'border border-slate-600 hover:bg-slate-800 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                whileHover={isRecording ? { scale: 1.02 } : (isBusy ? {} : { scale: 1.02 })}
                whileTap={isRecording ? { scale: 0.98 } : (isBusy ? {} : { scale: 0.98 })}
              >
                {isRecording ? (
                  <>
                    <Square className="w-4 h-4 inline mr-2" />
                    停止
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 inline mr-2" />
                    开始录音
                  </>
                )}
              </motion.button>
            )}

            <motion.button
              onClick={onStopInterview}
              disabled={isSubmitting}
              className="px-6 py-5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              whileHover={isSubmitting ? {} : { scale: 1.02 }}
              whileTap={isSubmitting ? {} : { scale: 0.98 }}
            >
              结束面试
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
}
