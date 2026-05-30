import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { request } from '../../api/request';
import type { SessionMeta } from '../../api/voiceInterview';

export default function VoiceInterviewListPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    request.get<SessionMeta[]>('/api/voice-interview/sessions')
      .then(data => {
        setSessions(data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleViewEvaluation = (sessionId: number) => {
    navigate(`/voice-interview/${sessionId}/evaluation`);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.h1
        className="text-2xl font-bold mb-6 text-[var(--color-text)] dark:text-[var(--color-text-dark)]"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        语音面试
      </motion.h1>

      <div className="mb-6">
        <button
          onClick={() => navigate('/voice-interview/new')}
          className="px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl text-sm font-medium transition-colors"
        >
          开始新面试
        </button>
      </div>

      <div className="space-y-4">
        {sessions.map((session, index) => (
          <motion.div
            key={session.sessionId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border-subtle)] dark:border-[var(--color-border-dark)] rounded-xl p-5 shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                  Session #{session.sessionId}
                </p>
                <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mt-1">
                  角色: {session.roleType} | 状态: {session.status} | 阶段: {session.currentPhase}
                </p>
                {session.actualDuration && (
                  <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mt-1">
                    时长: {Math.round(session.actualDuration / 60)}分钟
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                {/* 评估状态指示 */}
                {session.evaluateStatus === 'COMPLETED' && (
                  <button
                    onClick={() => handleViewEvaluation(session.sessionId)}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg transition-colors"
                  >
                    查看评估报告
                  </button>
                )}
                {session.evaluateStatus === 'PROCESSING' && (
                  <span className="px-4 py-2 text-blue-500 text-sm">评估中...</span>
                )}
                {session.evaluateStatus === 'FAILED' && (
                  <span className="px-4 py-2 text-red-500 text-sm">评估失败</span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}