import {useCallback, useEffect, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {AnalyzeStatus, historyApi, ResumeListItem, ResumeStats} from '../api/history';
import DeleteConfirmDialog from './DeleteConfirmDialog';
import {getScoreColor} from '../utils/score';
import {formatDate} from '../utils/date';
import {
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileStack,
  FileText,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';

interface HistoryListProps {
  onSelectResume: (id: number) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function StatusIcon({ status, hasScore }: { status?: AnalyzeStatus; hasScore: boolean }) {
  if (status === undefined) {
    if (hasScore) {
      return <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />;
    }
    return <Clock className="w-4 h-4 text-[var(--color-warning)]" />;
  }

  switch (status) {
    case 'COMPLETED':
      return <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />;
    case 'PROCESSING':
      return <Loader2 className="w-4 h-4 text-[var(--color-info)] animate-spin" />;
    case 'PENDING':
      return <Clock className="w-4 h-4 text-[var(--color-warning)]" />;
    case 'FAILED':
      return <AlertCircle className="w-4 h-4 text-[var(--color-error)]" />;
    default:
      return <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />;
  }
}

function getStatusText(status?: AnalyzeStatus, hasScore?: boolean): string {
  if (status === undefined) {
    if (hasScore) return '已完成';
    return '待分析';
  }
  switch (status) {
    case 'COMPLETED': return '已完成';
    case 'PROCESSING': return '分析中';
    case 'PENDING': return '待分析';
    case 'FAILED': return '失败';
    default: return '未知';
  }
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--color-surface)] rounded-xl p-6 shadow-sm border border-[var(--color-border)] dark:border-[var(--color-border-dark)]"
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">{label}</p>
          <p className="text-2xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">{value.toLocaleString()}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function HistoryList({ onSelectResume }: HistoryListProps) {
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);
  const [stats, setStats] = useState<ResumeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteItem, setDeleteItem] = useState<ResumeListItem | null>(null);
  const [reanalyzingId, setReanalyzingId] = useState<number | null>(null);

  const loadDataSilent = useCallback(async () => {
    try {
      const [resumeData, statsData] = await Promise.all([
        historyApi.getResumes(),
        historyApi.getStatistics(),
      ]);
      setResumes(resumeData);
      setStats(statsData);
    } catch (err) {
      console.error('加载数据失败', err);
    }
  }, []);

  const loadResumes = useCallback(async () => {
    setLoading(true);
    try {
      const [resumeData, statsData] = await Promise.all([
        historyApi.getResumes(),
        historyApi.getStatistics(),
      ]);
      setResumes(resumeData);
      setStats(statsData);
    } catch (err) {
      console.error('加载数据失败', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  useEffect(() => {
    const hasPendingItems = resumes.some(
      r => r.analyzeStatus === 'PENDING' ||
        r.analyzeStatus === 'PROCESSING' ||
        (r.analyzeStatus === undefined && r.latestScore === undefined)
    );

    if (hasPendingItems && !loading) {
      const timer = setInterval(() => {
        loadDataSilent();
      }, 5000);

      return () => clearInterval(timer);
    }
  }, [resumes, loading, loadDataSilent]);

  const handleDownload = (resume: ResumeListItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (resume.storageUrl) {
      const link = document.createElement('a');
      link.href = resume.storageUrl;
      link.download = resume.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleReanalyze = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setReanalyzingId(id);
      await historyApi.reanalyze(id);
      await loadDataSilent();
    } catch (err) {
      console.error('重新分析失败', err);
    } finally {
      setReanalyzingId(null);
    }
  };

  const handleDeleteClick = (resume: ResumeListItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteItem(resume);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;
    setDeletingId(deleteItem.id);
    try {
      await historyApi.deleteResume(deleteItem.id);
      await loadResumes();
      setDeleteItem(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除失败，请稍后重试');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredResumes = resumes.filter(resume =>
    resume.filename.toLowerCase().includes(searchTerm.toLowerCase())
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
            <FileStack className="w-7 h-7 text-[var(--color-primary)]" />
            简历库
          </motion.h1>
          <motion.p
            className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            管理您已分析过的所有简历及面试记录
          </motion.p>
        </div>

        <motion.div
          className="flex items-center gap-3 bg-[var(--color-surface)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-xl px-4 py-2.5 min-w-[280px] focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary-subtle)] transition-all"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Search className="w-5 h-5 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]" />
          <input
            type="text"
            aria-label="搜索简历"
            placeholder="搜索简历..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 outline-none text-[var(--color-text)] dark:text-[var(--color-text-dark)] placeholder:text-[var(--color-text-placeholder)] dark:placeholder:text-[var(--color-text-placeholder-dark)]"
          />
        </motion.div>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={FileStack}
            label="简历总数"
            value={stats.totalCount}
            color="bg-[var(--color-primary)]"
          />
          <StatCard
            icon={MessageSquare}
            label="面试总数"
            value={stats.totalInterviewCount}
            color="bg-[var(--color-primary)]"
          />
          <StatCard
            icon={Eye}
            label="总访问次数"
            value={stats.totalAccessCount}
            color="bg-[var(--color-success)]"
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
      {!loading && filteredResumes.length === 0 && (
        <motion.div
          className="text-center py-20 bg-[var(--color-surface)] rounded-2xl shadow-sm border border-[var(--color-border)] dark:border-[var(--color-border-dark)]"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <svg className="w-16 h-16 mx-auto mb-6 text-[var(--color-border)] dark:text-[var(--color-border-dark)]" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <rect x="16" y="10" width="32" height="44" rx="3" fill="currentColor" opacity="0.5"/>
            <rect x="22" y="10" width="24" height="44" rx="3" fill="currentColor" opacity="0.35"/>
            <rect x="28" y="10" width="18" height="44" rx="3" fill="currentColor" opacity="0.2"/>
            <rect x="22" y="22" width="14" height="2" rx="1" fill="#f59e0b" opacity="0.9"/>
            <rect x="22" y="28" width="10" height="2" rx="1" fill="currentColor" opacity="0.8"/>
            <rect x="22" y="34" width="12" height="2" rx="1" fill="currentColor" opacity="0.6"/>
            <rect x="22" y="40" width="8" height="2" rx="1" fill="currentColor" opacity="0.45"/>
            <path d="M38 10 L46 10 L46 18" stroke="#f59e0b" strokeWidth="2" strokeLinejoin="round" fill="none" opacity="0.7"/>
          </svg>
          <h3 className="text-xl font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-2">暂无简历记录</h3>
          <p className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">上传简历开始您的第一次 AI 面试分析</p>
        </motion.div>
      )}

      {/* 表格 */}
      {!loading && filteredResumes.length > 0 && (
        <motion.div
          className="bg-[var(--color-surface)] rounded-xl shadow-sm border border-[var(--color-border)] dark:border-[var(--color-border-dark)] overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <table className="w-full">
            <thead className="bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">名称</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">大小</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">分析状态</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">AI 评分</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">面试</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">上传时间</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">操作</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filteredResumes.map((resume, index) => (
                  <motion.tr
                    key={resume.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onSelectResume(resume.id)}
                    className="border-b border-[var(--color-border-subtle)] dark:border-[var(--color-border-subtle-dark)] hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)] cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]" />
                        <div>
                          <p className="font-medium text-[var(--color-text)] dark:text-[var(--color-text-dark)]">{resume.filename}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">
                      {formatFileSize(resume.fileSize)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <StatusIcon status={resume.analyzeStatus} hasScore={resume.latestScore !== undefined} />
                        <span className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">
                          {getStatusText(resume.analyzeStatus, resume.latestScore !== undefined)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {resume.latestScore !== undefined ? (
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-2 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full ${getScoreColor(resume.latestScore).split(' ')[0]} rounded-full`}
                              initial={{ width: 0 }}
                              animate={{ width: `${resume.latestScore}%` }}
                              transition={{ duration: 0.8, delay: index * 0.05 }}
                            />
                          </div>
                          <span className="font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">{resume.latestScore}</span>
                        </div>
                      ) : (
                        <span className="text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {resume.interviewCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full text-sm font-medium border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-4 h-4" />
                          {resume.interviewCount} 次
                        </span>
                      ) : (
                        <span className="inline-flex px-3 py-1 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] rounded-full text-sm">待面试</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">
                      {formatDate(resume.uploadedAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {resume.storageUrl && (
                          <button
                            onClick={(e) => handleDownload(resume, e)}
                            className="p-2 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] dark:hover:bg-[var(--color-primary-subtle-dark)] rounded-lg transition-colors"
                            title="下载"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        {resume.analyzeStatus === 'FAILED' && (
                          <button
                            onClick={(e) => handleReanalyze(resume.id, e)}
                            disabled={reanalyzingId === resume.id}
                            className="p-2 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] dark:hover:bg-[var(--color-primary-subtle-dark)] rounded-lg transition-colors disabled:opacity-50"
                            title="重新分析"
                          >
                            <RefreshCw className={`w-4 h-4 ${reanalyzingId === resume.id ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDeleteClick(resume, e)}
                          disabled={deletingId === resume.id}
                          className="p-2 text-red-700 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors disabled:opacity-50"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ChevronRight className="w-5 h-5 text-[var(--color-border)] dark:text-[var(--color-border-dark)] group-hover:text-[var(--color-primary)] group-hover:translate-x-1 transition-all" />
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
        item={deleteItem ? { id: deleteItem.id, name: deleteItem.filename } : null}
        itemType="简历"
        loading={deletingId !== null}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteItem(null)}
      />
    </motion.div>
  );
}
