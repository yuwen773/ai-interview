import {useCallback, useEffect, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {
  AlertCircle,
  Check,
  CheckCircle,
  ChevronDown,
  Clock,
  Database,
  Download,
  Edit3,
  Eye,
  FileText,
  HardDrive,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {knowledgeBaseApi, KnowledgeBaseItem, KnowledgeBaseStats, PreviewMeta, SortOption, TextPreview, VectorStatus} from '../api/knowledgebase';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import FilePreviewModal from '../components/FilePreviewModal';
import {formatDateTime} from '../utils/date';

interface KnowledgeBaseManagePageProps {
  onUpload: () => void;
  onChat: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function StatusIcon({ status }: { status: VectorStatus }) {
  switch (status) {
    case 'COMPLETED':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'PROCESSING':
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    case 'PENDING':
      return <Clock className="w-4 h-4 text-yellow-500" />;
    case 'FAILED':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    default:
      return <CheckCircle className="w-4 h-4 text-green-500" />;
  }
}

function getStatusText(status: VectorStatus): string {
  switch (status) {
    case 'COMPLETED':
      return '已完成';
    case 'PROCESSING':
      return '处理中';
    case 'PENDING':
      return '待处理';
    case 'FAILED':
      return '失败';
    default:
      return '未知';
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
      className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-100 dark:border-slate-700"
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{value.toLocaleString()}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function KnowledgeBaseManagePage({ onUpload, onChat }: KnowledgeBaseManagePageProps) {
  const [stats, setStats] = useState<KnowledgeBaseStats | null>(null);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('time');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [deleteItem, setDeleteItem] = useState<KnowledgeBaseItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMeta, setPreviewMeta] = useState<PreviewMeta | null>(null);
  const [previewText, setPreviewText] = useState<TextPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewPdfError, setPreviewPdfError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);

  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryValue, setEditingCategoryValue] = useState('');
  const [savingCategory, setSavingCategory] = useState(false);
  const categoryInputRef = useRef<HTMLInputElement>(null);

  const [revectorizing, setRevectorizing] = useState<number | null>(null);

  const loadDataSilent = useCallback(async () => {
    try {
      const [statsData, kbList, categoryList] = await Promise.all([
        knowledgeBaseApi.getStatistics(),
        searchKeyword
          ? knowledgeBaseApi.search(searchKeyword)
          : selectedCategory
          ? knowledgeBaseApi.getByCategory(selectedCategory)
          : knowledgeBaseApi.getAllKnowledgeBases(sortBy),
        knowledgeBaseApi.getAllCategories(),
      ]);
      setStats(statsData);
      setKnowledgeBases(kbList);
      setCategories(categoryList);
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  }, [searchKeyword, sortBy, selectedCategory]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsData, kbList, categoryList] = await Promise.all([
        knowledgeBaseApi.getStatistics(),
        searchKeyword
          ? knowledgeBaseApi.search(searchKeyword)
          : selectedCategory
          ? knowledgeBaseApi.getByCategory(selectedCategory)
          : knowledgeBaseApi.getAllKnowledgeBases(sortBy),
        knowledgeBaseApi.getAllCategories(),
      ]);
      setStats(statsData);
      setKnowledgeBases(kbList);
      setCategories(categoryList);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  }, [searchKeyword, sortBy, selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const hasPendingItems = knowledgeBases.some(
      kb => kb.vectorStatus === 'PENDING' || kb.vectorStatus === 'PROCESSING'
    );

    if (hasPendingItems && !loading) {
      const timer = setInterval(() => {
        loadDataSilent();
      }, 5000);

      return () => clearInterval(timer);
    }
  }, [knowledgeBases, loading, loadDataSilent]);

  const handleRevectorize = async (id: number) => {
    try {
      setRevectorizing(id);
      await knowledgeBaseApi.revectorize(id);
      await loadDataSilent();
    } catch (error) {
      console.error('重新向量化失败:', error);
    } finally {
      setRevectorizing(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      setDeleting(true);
      await knowledgeBaseApi.deleteKnowledgeBase(deleteItem.id);
      if (previewMeta?.sourceId === deleteItem.id) {
        handlePreviewClose();
      }
      setDeleteItem(null);
      await loadData();
    } catch (error) {
      console.error('删除失败:', error);
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async (kb: KnowledgeBaseItem) => {
    try {
      const blob = await knowledgeBaseApi.downloadKnowledgeBase(kb.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = kb.originalFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('下载失败:', error);
    }
  };

  const handleStartEditCategory = (kb: KnowledgeBaseItem) => {
    setEditingCategoryId(kb.id);
    setEditingCategoryValue(kb.category || '');
    setTimeout(() => {
      categoryInputRef.current?.focus();
    }, 50);
  };

  const handleCancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryValue('');
  };

  const handleSaveCategory = async (id: number) => {
    try {
      setSavingCategory(true);
      const categoryToSave = editingCategoryValue.trim() || null;
      await knowledgeBaseApi.updateCategory(id, categoryToSave);
      setEditingCategoryId(null);
      setEditingCategoryValue('');
      await loadData();
    } catch (error) {
      console.error('更新分类失败:', error);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleCategoryKeyDown = (e: React.KeyboardEvent, id: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveCategory(id);
    } else if (e.key === 'Escape') {
      handleCancelEditCategory();
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // Preview modal handlers
  const loadPreview = useCallback(async (kbId: number) => {
    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewPdfError(null);
    setNumPages(0);
    setPreviewMeta(null);
    setPreviewText(null);

    try {
      const meta = await knowledgeBaseApi.getPreviewMeta(kbId);
      setPreviewMeta(meta);

      if (meta.previewType === 'text' && meta.textUrl) {
        const text = await knowledgeBaseApi.getPreviewText(kbId);
        setPreviewText(text);
      }
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : '预览加载失败');
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const handlePreviewOpen = async (kb: KnowledgeBaseItem) => {
    setPreviewOpen(true);
    await loadPreview(kb.id);
  };

  const handlePreviewClose = () => {
    setPreviewOpen(false);
    setPreviewMeta(null);
    setPreviewText(null);
    setPreviewError(null);
    setPreviewPdfError(null);
    setNumPages(0);
  };

  const handlePreviewReload = async () => {
    if (previewMeta?.sourceId) {
      await loadPreview(previewMeta.sourceId);
    }
  };

  const handlePreviewDownload = async () => {
    if (!previewMeta?.downloadUrl) return;
    try {
      const targetUrl = new URL(previewMeta.downloadUrl, window.location.origin);
      if (targetUrl.origin === window.location.origin) {
        const response = await fetch(targetUrl.toString(), { credentials: 'include' });
        if (!response.ok) throw new Error(`下载失败 (${response.status})`);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = previewMeta.filename ?? '';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
        return;
      }
    } catch {
      // fall through
    }
    window.open(previewMeta.downloadUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Database className="w-7 h-7 text-primary-500" />
            知识库管理
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">管理您的知识库文件，查看使用统计</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onUpload}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Upload className="w-4 h-4" />
            上传知识库
          </button>
          <button
            onClick={onChat}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            问答助手
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard icon={Database} label="知识库总数" value={stats.totalCount} color="bg-primary-500" />
          <StatCard icon={MessageSquare} label="总提问次数" value={stats.totalQuestionCount} color="bg-primary-500" />
          <StatCard icon={Eye} label="总访问次数" value={stats.totalAccessCount} color="bg-emerald-500" />
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索知识库名称..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </form>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortOption);
                setSearchKeyword('');
                setSelectedCategory(null);
              }}
              className="appearance-none pl-4 pr-10 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="time">按时间排序</option>
              <option value="size">按大小排序</option>
              <option value="access">按访问排序</option>
              <option value="question">按提问排序</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={selectedCategory || ''}
              onChange={(e) => {
                setSelectedCategory(e.target.value || null);
                setSearchKeyword('');
              }}
              className="appearance-none pl-4 pr-10 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white cursor-pointer"
            >
              <option value="">全部分类</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div
          className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden min-w-0"
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
          ) : knowledgeBases.length === 0 ? (
            <div className="text-center py-20">
              <HardDrive className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">暂无知识库</p>
              <button
                onClick={onUpload}
                className="mt-4 text-primary-500 hover:text-primary-600"
              >
                上传第一个知识库
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-600">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                      名称
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                      分类
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                      大小
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                      状态
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                      提问
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                      上传时间
                    </th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {knowledgeBases.map((kb, index) => (
                    <motion.tr
                      key={kb.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-slate-400" />
                          <div>
                            <p className="font-medium text-slate-800 dark:text-white">{kb.name}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500">{kb.originalFilename}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <AnimatePresence mode="wait">
                          {editingCategoryId === kb.id ? (
                            <motion.div
                              key="editing"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center gap-2"
                            >
                              <input
                                ref={categoryInputRef}
                                type="text"
                                value={editingCategoryValue}
                                onChange={(e) => setEditingCategoryValue(e.target.value)}
                                onKeyDown={(e) => handleCategoryKeyDown(e, kb.id)}
                                placeholder="输入分类名称"
                                list="category-suggestions"
                                className="w-24 px-2 py-1 text-sm border border-primary-300 dark:border-primary-600 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                                disabled={savingCategory}
                              />
                              <datalist id="category-suggestions">
                                {categories.map((cat) => (
                                  <option key={cat} value={cat} />
                                ))}
                              </datalist>
                              <button
                                onClick={() => handleSaveCategory(kb.id)}
                                disabled={savingCategory}
                                className="p-1 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors disabled:opacity-50"
                                title="保存"
                              >
                                {savingCategory ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={handleCancelEditCategory}
                                disabled={savingCategory}
                                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 rounded transition-colors disabled:opacity-50"
                                title="取消"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="display"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex items-center gap-2 group/category"
                            >
                              {kb.category ? (
                                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-sm">
                                  {kb.category}
                                </span>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500 text-sm">未分类</span>
                              )}
                              <button
                                onClick={() => handleStartEditCategory(kb)}
                                className="p-1 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded opacity-0 group-hover/category:opacity-100 transition-all"
                                title="编辑分类"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {formatFileSize(kb.fileSize)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <StatusIcon status={kb.vectorStatus} />
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            {getStatusText(kb.vectorStatus)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {kb.questionCount}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                        {formatDateTime(kb.uploadedAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleDownload(kb)}
                            className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                            title="下载"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => void handlePreviewOpen(kb)}
                            className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                            title="预览"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {kb.vectorStatus === 'FAILED' && (
                            <button
                              onClick={() => handleRevectorize(kb.id)}
                              disabled={revectorizing === kb.id}
                              className="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors disabled:opacity-50"
                              title="重新向量化"
                            >
                              <RefreshCw className={`w-4 h-4 ${revectorizing === kb.id ? 'animate-spin' : ''}`} />
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteItem(kb)}
                            className="p-2 text-red-700 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <DeleteConfirmDialog
        open={deleteItem !== null}
        item={deleteItem}
        itemType="知识库"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
      />

      <FilePreviewModal
        open={previewOpen}
        meta={previewMeta}
        text={previewText}
        loading={previewLoading}
        error={previewError}
        pdfError={previewPdfError}
        numPages={numPages}
        onClose={handlePreviewClose}
        onDownload={handlePreviewDownload}
        onReload={handlePreviewReload}
        onLoadSuccess={setNumPages}
        onLoadError={setPreviewPdfError}
      />
    </div>
  );
}
