import {useCallback, useEffect, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {EvaluateStatus, historyApi, InterviewItem} from '../api/history';
import {formatDate} from '../utils/date';
import {deleteSessionAudio} from '../utils/interviewVoiceCache';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Loader2,
  PlayCircle,
  RefreshCw,
  Search,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';

interface InterviewHistoryPageProps {
  onBack: () => void;
  onViewInterview: (sessionId: string, resumeId?: number) => void;
  onStartInterview?: () => void;
}

interface InterviewWithResume extends InterviewItem {
  resumeId: number;
  resumeFilename: string;
  evaluateStatus?: EvaluateStatus;
  evaluateError?: string;
}

interface InterviewStats {
  totalCount: number;
  completedCount: number;
  averageScore: number;
}

// 统计卡片组件
function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  suffix?: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-xl p-6 shadow-sm border border-[var(--color-border-subtle)] dark:border-[var(--color-border-dark)]"
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
            <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">{label}</p>
            <p className="text-2xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                {value}{suffix &&
                <span className="text-base font-normal text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] ml-1">{suffix}</span>}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// 判断是否为已完成状态（包括 COMPLETED 和 EVALUATED）
function isCompletedStatus(status: string): boolean {
  return status === 'COMPLETED' || status === 'EVALUATED';
}

// 判断评估是否完成
function isEvaluateCompleted(interview: InterviewWithResume): boolean {
  // 如果 evaluateStatus 存在且为 COMPLETED，则评估已完成
  if (interview.evaluateStatus === 'COMPLETED') return true;
  // 向后兼容：如果 status 为 EVALUATED，也认为评估已完成
  if (interview.status === 'EVALUATED') return true;
  return false;
}

// 判断是否正在评估中
function isEvaluating(interview: InterviewWithResume): boolean {
  return interview.evaluateStatus === 'PENDING' || interview.evaluateStatus === 'PROCESSING';
}

// 判断评估是否失败
function isEvaluateFailed(interview: InterviewWithResume): boolean {
  return interview.evaluateStatus === 'FAILED';
}

// 状态图标
function StatusIcon({ interview }: { interview: InterviewWithResume }) {
  // 评估失败
  if (isEvaluateFailed(interview)) {
      return <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400"/>;
  }
  // 正在评估
  if (isEvaluating(interview)) {
      return <RefreshCw className="w-4 h-4 text-blue-500 dark:text-blue-400 animate-spin"/>;
  }
  // 评估完成
  if (isEvaluateCompleted(interview)) {
      return <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400"/>;
  }
  // 面试进行中
  if (interview.status === 'IN_PROGRESS') {
      return <PlayCircle className="w-4 h-4 text-blue-500 dark:text-blue-400"/>;
  }
  // 面试已完成但评估未开始
  if (isCompletedStatus(interview.status)) {
      return <Clock className="w-4 h-4 text-yellow-500 dark:text-yellow-400"/>;
  }
  // 已创建
    return <Clock className="w-4 h-4 text-yellow-500 dark:text-yellow-400"/>;
}

// 状态文本
function getStatusText(interview: InterviewWithResume): string {
  // 评估失败
  if (isEvaluateFailed(interview)) {
    return '评估失败';
  }
  // 正在评估
  if (isEvaluating(interview)) {
    return interview.evaluateStatus === 'PROCESSING' ? '评估中' : '等待评估';
  }
  // 评估完成
  if (isEvaluateCompleted(interview)) {
    return '已完成';
  }
  // 面试进行中
  if (interview.status === 'IN_PROGRESS') {
    return '进行中';
  }
  // 面试已完成但评估未开始
  if (isCompletedStatus(interview.status)) {
    return '已提交';
  }
  return '已创建';
}

// 获取分数颜色
function getScoreColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  return 'bg-red-500';
}

export default function InterviewHistoryPage({ onBack: _onBack, onViewInterview, onStartInterview }: InterviewHistoryPageProps) {
  const [interviews, setInterviews] = useState<InterviewWithResume[]>([]);
  const [stats, setStats] = useState<InterviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [deleteItem, setDeleteItem] = useState<InterviewWithResume | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const pollingRef = useRef<number | null>(null);

  const loadAllInterviews = useCallback(async (isPolling = false) => {
    if (!isPolling) {
      setLoading(true);
    }
    try {
      const resumes = await historyApi.getResumes();
      const allInterviews: InterviewWithResume[] = [];

      for (const resume of resumes) {
        const detail = await historyApi.getResumeDetail(resume.id);
        if (detail.interviews && detail.interviews.length > 0) {
          detail.interviews.forEach(interview => {
            allInterviews.push({
              ...interview,
              resumeId: resume.id,
              resumeFilename: resume.filename
            });
          });
        }
      }

      // 按创建时间倒序排序
      allInterviews.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setInterviews(allInterviews);

      // 计算统计信息（只统计评估已完成的面试）
      const evaluated = allInterviews.filter(i => isEvaluateCompleted(i));
      const totalScore = evaluated.reduce((sum, i) => sum + (i.overallScore || 0), 0);
      setStats({
        totalCount: allInterviews.length,
        completedCount: evaluated.length,
        averageScore: evaluated.length > 0 ? Math.round(totalScore / evaluated.length) : 0,
      });
    } catch (err) {
      console.error('加载面试记录失败', err);
    } finally {
      if (!isPolling) {
        setLoading(false);
      }
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadAllInterviews();
  }, [loadAllInterviews]);

  // 轮询检查评估状态
  useEffect(() => {
    // 检查是否有正在评估的面试
    const hasEvaluating = interviews.some(i => isEvaluating(i));

    if (hasEvaluating) {
      // 启动轮询
      pollingRef.current = window.setInterval(() => {
        loadAllInterviews(true);
      }, 3000); // 每3秒轮询一次
    } else {
      // 停止轮询
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [interviews, loadAllInterviews]);

  const handleDeleteClick = (interview: InterviewWithResume, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteItem(interview);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;

    setDeletingSessionId(deleteItem.sessionId);
    try {
      await historyApi.deleteInterview(deleteItem.sessionId);
      await deleteSessionAudio(deleteItem.sessionId);
      await loadAllInterviews();
      setDeleteItem(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败，请稍后重试');
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleExport = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExporting(sessionId);
    try {
      const blob = await historyApi.exportInterviewPdf(sessionId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `面试报告_${sessionId.slice(-8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('导出失败，请重试');
    } finally {
      setExporting(null);
    }
  };

  const filteredInterviews = interviews.filter(interview =>
    interview.resumeFilename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      className="w-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* 头部 */}
      <div className="flex justify-between items-start mb-8 flex-wrap gap-6">
        <div>
          <motion.h1
              className="text-2xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)] flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Users className="w-7 h-7 text-[var(--color-primary)]" />
            面试记录
          </motion.h1>
          <motion.p
              className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            查看和管理所有模拟面试记录
          </motion.p>
        </div>

        <motion.div
            className="flex items-center gap-3 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-xl px-4 py-2.5 min-w-[280px] focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary-subtle)] dark:focus-within:ring-[var(--color-primary-subtle-dark)] transition-all"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Search className="w-5 h-5 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="搜索简历名称..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 outline-none text-[var(--color-text-muted)] dark:text-[var(--color-text-dark)] placeholder:text-[var(--color-text-placeholder)] dark:placeholder:text-[var(--color-text-placeholder-dark)] bg-transparent"
          />
        </motion.div>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={Users}
            label="面试总数"
            value={stats.totalCount}
            color="bg-[var(--color-primary)]"
          />
          <StatCard
            icon={CheckCircle}
            label="已完成"
            value={stats.completedCount}
            color="bg-emerald-500"
          />
          <StatCard
            icon={TrendingUp}
            label="平均分数"
            value={stats.averageScore}
            suffix="分"
            color="bg-[var(--color-primary)]"
          />
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[var(--color-primary)] animate-spin" />
        </div>
      )}

      {/* 空状态 */}
      {!loading && filteredInterviews.length === 0 && (
        <motion.div
            className="text-center py-20 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-2xl shadow-sm border border-[var(--color-border-subtle)] dark:border-[var(--color-border-dark)]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
            {/* 面试插图 */}
            <svg className="w-16 h-16 mx-auto mb-6 text-[var(--color-text-muted)] dark:text-[var(--color-border-dark)]" viewBox="0 0 64 64" fill="none" aria-hidden="true">
              <circle cx="32" cy="32" r="24" fill="currentColor" opacity="0.2"/>
              <circle cx="32" cy="28" r="8" fill="currentColor" opacity="0.6"/>
              <path d="M20 48 C20 40 26 36 32 36 C38 36 44 40 44 48" fill="currentColor" opacity="0.5"/>
              <circle cx="32" cy="28" r="8" fill="currentColor" opacity="0.6"/>
              <path d="M20 48 C20 40 26 36 32 36 C38 36 44 40 44 48" fill="currentColor" opacity="0.5"/>
              <circle cx="44" cy="20" r="5" fill="#f59e0b" opacity="0.8"/>
              <path d="M44 20 L48 16" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
            </svg>
            <h3 className="text-xl font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-2">暂无面试记录</h3>
            <p className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mb-6">开始一次模拟面试后，记录将显示在这里</p>
            {onStartInterview && (
              <button
                onClick={onStartInterview}
                className="px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white rounded-xl text-sm font-medium transition-colors"
              >
                开始模拟面试
              </button>
            )}
        </motion.div>
      )}

      {/* 表格 */}
      {!loading && filteredInterviews.length > 0 && (
        <motion.div
            className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-xl shadow-sm border border-[var(--color-border-subtle)] dark:border-[var(--color-border-dark)] overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <table className="w-full">
              <thead className="bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] border-b border-[var(--color-border-subtle)] dark:border-[var(--color-border-dark)]">
              <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[var(--color-text-muted)] dark:text-[var(--color-text-dark)]">关联简历</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[var(--color-text-muted)] dark:text-[var(--color-text-dark)]">题目数</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[var(--color-text-muted)] dark:text-[var(--color-text-dark)]">状态</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[var(--color-text-muted)] dark:text-[var(--color-text-dark)]">得分</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[var(--color-text-muted)] dark:text-[var(--color-text-dark)]">创建时间</th>
                  <th className="text-right px-6 py-4 text-sm font-medium text-[var(--color-text-muted)] dark:text-[var(--color-text-dark)]">操作</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredInterviews.map((interview, index) => (
                  <motion.tr
                    key={interview.sessionId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onViewInterview(interview.sessionId, interview.resumeId)}
                    className="border-b border-[var(--color-border-subtle)] dark:border-[var(--color-border-dark)] hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)] cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[var(--color-text-muted)]" />
                        <div>
                            <p className="font-medium text-[var(--color-text)] dark:text-[var(--color-text-dark)]">{interview.resumeFilename}</p>
                            <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">#{interview.sessionId.slice(-8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] text-[var(--color-text-muted)] dark:text-[var(--color-text-dark)] rounded-lg text-sm">
                        {interview.totalQuestions} 题
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <StatusIcon interview={interview} />
                          <span className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-dark)]">
                          {getStatusText(interview)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isEvaluateCompleted(interview) && interview.overallScore !== null ? (
                        <div className="flex items-center gap-3">
                            <div className="w-16 h-2 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full ${getScoreColor(interview.overallScore)} rounded-full origin-left`}
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: interview.overallScore / 100 }}
                              transition={{ duration: 0.8, delay: index * 0.05 }}
                            />
                          </div>
                            <span className="font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">{interview.overallScore}</span>
                        </div>
                      ) : isEvaluating(interview) ? (
                          <span className="text-blue-500 dark:text-blue-400 text-sm">生成中...</span>
                      ) : isEvaluateFailed(interview) ? (
                          <span className="text-red-500 dark:text-red-400 text-sm"
                                title={interview.evaluateError}>失败</span>
                      ) : (
                          <span className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">-</span>
                      )}
                    </td>
                      <td className="px-6 py-4 text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">
                      {formatDate(interview.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* 导出按钮 */}
                        {isEvaluateCompleted(interview) && (
                          <button
                            onClick={(e) => handleExport(interview.sessionId, e)}
                            disabled={exporting === interview.sessionId}
                            className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] dark:hover:bg-[var(--color-primary-subtle-dark)] rounded-lg transition-colors disabled:opacity-50"
                            title="导出PDF"
                          >
                            {exporting === interview.sessionId ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        {/* 删除按钮 */}
                        <button
                          onClick={(e) => handleDeleteClick(interview, e)}
                          disabled={deletingSessionId === interview.sessionId}
                          className="p-2 text-red-700 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                          <ChevronRight
                              className="w-5 h-5 text-[var(--color-text-muted)] dark:text-[var(--color-border-dark)] group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all"/>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </motion.div>
      )}

      {/* 删除确认对话框 */}
      <DeleteConfirmDialog
        open={deleteItem !== null}
        item={deleteItem ? { id: deleteItem.id, sessionId: deleteItem.sessionId } : null}
        itemType="面试记录"
        loading={deletingSessionId !== null}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteItem(null)}
      />
    </motion.div>
  );
}
