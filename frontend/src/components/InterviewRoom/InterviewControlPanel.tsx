// frontend/src/components/InterviewRoom/InterviewControlPanel.tsx
import { AnimatePresence, motion } from 'framer-motion';
import { Mic, Keyboard, Send, Loader2 } from 'lucide-react';
import type { InterviewMode } from './Interviewer2D';
import type { CandidateInputMode } from '../../types/interview';

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
  answer,
  onAnswerChange,
  onSubmit,
  onStartRecording,
  onStopRecording,
  onStopInterview,
  onCandidateInputModeChange,
  error,
}: InterviewControlPanelProps) {
  const isIdle = mode === 'idle';
  const isBusy = isSubmitting || isRecognizing || isRecording;

  // 状态配置
  const statusConfig = {
    idle: { icon: null, text: '', color: 'text-slate-400' },
    thinking: { icon: '⏳', text: '面试官正在思考...', color: 'text-amber-400' },
    speaking: { icon: '💬', text: '面试官正在提问...', color: 'text-green-400' },
    listening: { icon: '👂', text: '请回答问题', color: 'text-blue-400' },
  };

  const status = statusConfig[mode] || statusConfig.idle;

  return (
    <div className="w-full">
      {/* 主控制栏 - 玻璃拟态效果 */}
      <div className="relative bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-4 shadow-2xl shadow-slate-900/50">
        <div className="flex items-center justify-between gap-6">
          {/* 左侧：状态区 */}
          <div className="flex items-center gap-4 min-w-[180px]">
            {mode !== 'idle' && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -10 }}
                  className="flex items-center gap-3"
                >
                  {/* 状态图标 */}
                  <div className={`w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-lg ${isRecording ? 'animate-pulse' : ''}`}>
                    {isRecording ? '🎙️' : status.icon}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${status.color}`}>
                      {isRecording ? '录音中' : status.text}
                    </p>
                    {isRecording && (
                      <p className="text-xs text-red-400/70">点击停止结束录音</p>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            {/* 空闲状态 */}
            {mode === 'idle' && (
              <div className="text-slate-500 text-sm">等待开始面试...</div>
            )}
          </div>

          {/* 中间：输入区域 */}
          <div className="flex-1 max-w-2xl">
            {!isIdle && (
              <div className="flex items-center gap-4">
                {/* 模式切换 */}
                <div className="flex-shrink-0 inline-flex rounded-xl bg-slate-800/60 border border-slate-700/50 p-1">
                  <button
                    type="button"
                    onClick={() => onCandidateInputModeChange('text')}
                    disabled={isBusy}
                    className={`px-4 py-2.5 text-sm rounded-lg transition-all duration-200 flex items-center gap-2 ${
                      candidateInputMode === 'text'
                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30 shadow-lg shadow-primary-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <Keyboard className="w-4 h-4" />
                    <span className="hidden sm:inline">文字</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onCandidateInputModeChange('voice')}
                    disabled={isBusy}
                    className={`px-4 py-2.5 text-sm rounded-lg transition-all duration-200 flex items-center gap-2 ${
                      candidateInputMode === 'voice'
                        ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30 shadow-lg shadow-primary-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    <Mic className="w-4 h-4" />
                    <span className="hidden sm:inline">语音</span>
                  </button>
                </div>

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
                            placeholder="输入你的回答... (Ctrl+Enter 提交)"
                            disabled={isSubmitting || isRecognizing}
                            rows={1}
                            className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/30 resize-none transition-all duration-200 disabled:opacity-50"
                            style={{
                              minHeight: '44px',
                              maxHeight: '120px',
                            }}
                          />
                        </div>
                        <motion.button
                          onClick={onSubmit}
                          disabled={!answer.trim() || isSubmitting || isRecognizing}
                          className="px-5 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30"
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
                          onClick={isRecording ? onStopRecording : onStartRecording}
                          disabled={!isRecording && (isBusy || mode === 'thinking' || mode === 'speaking')}
                          className={`relative px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
                            isRecording
                              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30'
                              : 'bg-primary-500/20 hover:bg-primary-500/30 text-primary-400 border border-primary-500/30 disabled:opacity-40 disabled:cursor-not-allowed'
                          }`}
                          whileHover={isRecording ? { scale: 1.02 } : (isBusy || mode === 'thinking' || mode === 'speaking' ? {} : { scale: 1.02 })}
                          whileTap={isRecording ? { scale: 0.98 } : {}}
                        >
                          {isRecording ? (
                            <>
                              <motion.div
                                className="w-3 h-3 bg-white rounded-sm"
                                animate={{ scale: [1, 0.7, 1] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                              />
                              <span>停止录音</span>
                            </>
                          ) : isRecognizing ? (
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
                          {isRecording ? (
                            <VoiceWaveform audioLevel={audioLevel} />
                          ) : isRecognizing ? (
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>正在识别语音...</span>
                            </div>
                          ) : (
                            <div className="text-slate-500 text-sm">
                              点击开始录音，回答完成后自动停止
                            </div>
                          )}
                        </div>

                        {/* 提示文字 */}
                        {isRecording && (
                          <div className="hidden sm:block text-red-400/80 text-sm animate-pulse">
                            🎙️ 正在聆听...
                          </div>
                        )}
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
                className="px-5 py-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed font-medium border border-transparent hover:border-red-500/20"
                whileHover={isSubmitting ? {} : { scale: 1.02 }}
                whileTap={isSubmitting ? {} : { scale: 0.98 }}
              >
                结束面试
              </motion.button>
            )}
          </div>
        </div>

        {/* 错误提示 */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="mt-3 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 底部留白 */}
      <div className="h-4" />
    </div>
  );
}

// 语音波形组件
function VoiceWaveform({ audioLevel }: { audioLevel: number }) {
  const bars = 20;
  return (
    <div className="flex items-center gap-0.5 h-full">
      {Array.from({ length: bars }).map((_, i) => {
        // 基于 audioLevel 和随机偏移生成每个 bar 的高度
        const baseHeight = 20 + Math.sin(i * 0.5) * 10 + audioLevel * 60;
        return (
          <motion.div
            key={i}
            className="w-1 bg-gradient-to-t from-red-500 to-red-400 rounded-full"
            animate={{
              height: [baseHeight, baseHeight * (0.5 + Math.random() * 0.8), baseHeight],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 0.3 + Math.random() * 0.2,
              repeat: Infinity,
              delay: i * 0.02,
              ease: 'easeInOut',
            }}
            style={{ minHeight: 4 }}
          />
        );
      })}
    </div>
  );
}
