import {useEffect, useMemo, useRef, useState, useTransition} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {Virtuoso, type VirtuosoHandle} from 'react-virtuoso';
import {knowledgeBaseApi, type KnowledgeBaseItem, type SortOption} from '../api/knowledgebase';
import {ragChatApi, type RagChatSessionListItem} from '../api/ragChat';
import {formatDateOnly, formatFileSize} from '../utils/date';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import CodeBlock from '../components/CodeBlock';
import {ChevronLeft, ChevronDown, ChevronRight, Edit, MessageSquare, Pin, Plus, Search, Trash2,} from 'lucide-react';

interface KnowledgeBaseQueryPageProps {
  onBack: () => void;
  onUpload: () => void;
}

interface Message {
  id?: number;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface CategoryGroup {
  name: string;
  items: KnowledgeBaseItem[];
  isExpanded: boolean;
}

export default function KnowledgeBaseQueryPage({ onBack, onUpload }: KnowledgeBaseQueryPageProps) {
  // 知识库状态
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseItem[]>([]);
  const [selectedKbIds, setSelectedKbIds] = useState<Set<number>>(new Set());
  const [loadingList, setLoadingList] = useState(true);

  // 搜索和排序状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('time');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['未分类']));

  // 右侧面板状态
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  // 会话状态
  const [sessions, setSessions] = useState<RagChatSessionListItem[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [currentSessionTitle, setCurrentSessionTitle] = useState<string>('');
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionDeleteConfirm, setSessionDeleteConfirm] = useState<{ id: number; title: string } | null>(null);
  const [editingSessionTitle, setEditingSessionTitle] = useState<{ id: number; title: string } | null>(null);
  const [newSessionTitle, setNewSessionTitle] = useState('');

  // 消息状态
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  // refs
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const rafRef = useRef<number>();

  const [, startTransition] = useTransition();

  useEffect(() => {
    loadKnowledgeBases();
    loadSessions();
  }, []);

  useEffect(() => {
    if (!searchKeyword) {
      loadKnowledgeBases();
    }
  }, [sortBy]);

  // Cleanup RAF on unmount to prevent state updates on unmounted component
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const loadKnowledgeBases = async () => {
    setLoadingList(true);
    try {
      // 问答助手只显示向量化完成的知识库
      const list = await knowledgeBaseApi.getAllKnowledgeBases(sortBy, 'COMPLETED');
      setKnowledgeBases(list);
    } catch (err) {
      console.error('加载知识库列表失败', err);
    } finally {
      setLoadingList(false);
    }
  };

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      loadKnowledgeBases();
      return;
    }
    setLoadingList(true);
    try {
      const list = await knowledgeBaseApi.search(searchKeyword.trim());
      setKnowledgeBases(list);
    } catch (err) {
      console.error('搜索知识库失败', err);
    } finally {
      setLoadingList(false);
    }
  };

  const groupedKnowledgeBases = useMemo((): CategoryGroup[] => {
    const groups: Map<string, KnowledgeBaseItem[]> = new Map();

    knowledgeBases.forEach(kb => {
      const category = kb.category || '未分类';
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(kb);
    });

    const result: CategoryGroup[] = [];
    const sortedCategories = Array.from(groups.keys()).sort((a, b) => {
      if (a === '未分类') return 1;
      if (b === '未分类') return -1;
      return a.localeCompare(b);
    });

    sortedCategories.forEach(name => {
      result.push({
        name,
        items: groups.get(name)!,
        isExpanded: expandedCategories.has(name),
      });
    });

    return result;
  }, [knowledgeBases, expandedCategories]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const list = await ragChatApi.listSessions();
      setSessions(list);
    } catch (err) {
      console.error('加载会话列表失败', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const handleToggleKb = (kbId: number) => {
    setSelectedKbIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(kbId)) {
        newSet.delete(kbId);
      } else {
        newSet.add(kbId);
      }
      if (newSet.size !== prev.size && currentSessionId) {
        setCurrentSessionId(null);
        setCurrentSessionTitle('');
        setMessages([]);
      }
      return newSet;
    });
  };

  const handleNewSession = () => {
    setCurrentSessionId(null);
    setCurrentSessionTitle('');
    setMessages([]);
  };

  const handleLoadSession = async (sessionId: number) => {
    try {
      const detail = await ragChatApi.getSessionDetail(sessionId);
      setCurrentSessionId(detail.id);
      setCurrentSessionTitle(detail.title);
      setSelectedKbIds(new Set(detail.knowledgeBases.map(kb => kb.id)));
      setMessages(detail.messages.map(m => ({
        id: m.id,
        type: m.type,
        content: m.content,
        timestamp: new Date(m.createdAt),
      })));
    } catch (err) {
      console.error('加载会话失败', err);
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionDeleteConfirm) return;
    try {
      await ragChatApi.deleteSession(sessionDeleteConfirm.id);
      await loadSessions();
      if (currentSessionId === sessionDeleteConfirm.id) {
        handleNewSession();
      }
      setSessionDeleteConfirm(null);
    } catch (err) {
      console.error('删除会话失败', err);
    }
  };

  const handleEditSessionTitle = (sessionId: number, currentTitle: string) => {
    setEditingSessionTitle({ id: sessionId, title: currentTitle });
    setNewSessionTitle(currentTitle);
  };

  const handleSaveSessionTitle = async () => {
    if (!editingSessionTitle || !newSessionTitle.trim()) return;
    try {
      await ragChatApi.updateSessionTitle(editingSessionTitle.id, newSessionTitle.trim());
      await loadSessions();
      if (currentSessionId === editingSessionTitle.id) {
        setCurrentSessionTitle(newSessionTitle.trim());
      }
      setEditingSessionTitle(null);
      setNewSessionTitle('');
    } catch (err) {
      console.error('更新会话标题失败', err);
    }
  };

  const handleTogglePin = async (sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await ragChatApi.togglePin(sessionId);
      await loadSessions();
    } catch (err) {
      console.error('切换置顶状态失败', err);
    }
  };

  const formatMarkdown = (text: string): string => {
    if (!text) return '';
    return text
      // 处理转义换行符
      .replace(/\\n/g, '\n')
      // 确保标题 # 后有空格
      .replace(/^(#{1,6})([^\s#\n])/gm, '$1 $2')
      // 确保有序列表数字后有空格（如 1.xxx -> 1. xxx）
      .replace(/^(\s*)(\d+)\.([^\s\n])/gm, '$1$2. $3')
      // 确保无序列表 - 或 * 后有空格
      .replace(/^(\s*[-*])([^\s\n-])/gm, '$1 $2')
      // 压缩多余空行
      .replace(/\n{3,}/g, '\n\n');
  };

  const handleSubmitQuestion = async () => {
    if (!question.trim() || selectedKbIds.size === 0 || loading) return;

    const userQuestion = question.trim();
    setQuestion('');
    setLoading(true);

    let sessionId = currentSessionId;
    if (!sessionId) {
      try {
        const session = await ragChatApi.createSession(Array.from(selectedKbIds));
        sessionId = session.id;
        setCurrentSessionId(sessionId);
        setCurrentSessionTitle(session.title);
      } catch (err) {
        console.error('创建会话失败', err);
        setLoading(false);
        return;
      }
    }

    const userMessage: Message = {
      type: 'user',
      content: userQuestion,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    const assistantMessage: Message = {
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };
    setMessages(prev => [...prev, assistantMessage]);

    let fullContent = '';
    const updateAssistantMessage = (content: string, done = false) => {
      setMessages(prev => {
        if (prev.length === 0) return prev;
        const lastIndex = prev.length - 1;
        const last = prev[lastIndex];
        if (last.type !== 'assistant') return prev;
        return [...prev.slice(0, -1), { ...last, content, isStreaming: !done }];
      });
    };

    try {
      await ragChatApi.sendMessageStream(
        sessionId,
        userQuestion,
        (chunk: string) => {
          fullContent += chunk;
          if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
          }
          rafRef.current = requestAnimationFrame(() => {
            startTransition(() => {
              updateAssistantMessage(fullContent);
            });
          });
        },
        () => {
          updateAssistantMessage(fullContent, true);
          setLoading(false);
          loadSessions();
        },
        (error: Error) => {
          console.error('流式查询失败:', error);
          updateAssistantMessage(fullContent || error.message || '回答失败，请重试', true);
          setLoading(false);
        }
      );
    } catch (err) {
      console.error('发起流式查询失败:', err);
      updateAssistantMessage(err instanceof Error ? err.message : '回答失败，请重试', true);
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    if (days < 7) return `${days} 天前`;
    return formatDateOnly(dateStr);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 h-full overflow-hidden flex flex-col">
      {/* 头部 - 充足的上方空间形成视觉呼吸 */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)] tracking-tight">问答助手</h1>
            <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mt-1.5">选择知识库，向 AI 提问</p>
          </div>
          {/* 装饰性琥珀色竖条 */}
          <div className="w-1 h-10 bg-gradient-to-b from-[var(--color-primary)] to-[var(--color-primary-hover)] rounded-full opacity-60" />
        </div>
        <div className="flex gap-3">
          <motion.button
            onClick={onUpload}
            className="px-4 py-2 border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-xl text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] font-medium hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)] transition-all text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            上传知识库
          </motion.button>
          <motion.button
            onClick={onBack}
            className="px-4 py-2 border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-xl text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] font-medium hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)] transition-all text-sm"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            返回
          </motion.button>
        </div>
      </motion.div>

      <div className="flex gap-4 h-[calc(100vh-6rem)] overflow-hidden">
        {/* 左侧：对话历史 - 与中间聊天区保持视觉区隔 */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-64 flex-shrink-0"
        >
          <div
              className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-2xl p-5 shadow-sm h-full flex flex-col border border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] uppercase tracking-wider">对话历史</h2>
              <motion.button
                onClick={handleNewSession}
                disabled={selectedKbIds.size === 0}
                className="p-1.5 text-[var(--color-primary)] hover:bg-[var(--color-primary-subtle)] dark:hover:bg-[var(--color-primary-subtle-dark)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="新建对话"
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingSessions ? (
                <div className="text-center py-6">
                  <motion.div
                    className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full mx-auto"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </div>
              ) : sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 mx-auto mb-3 text-[var(--color-text-muted)] dark:text-[var(--color-border-dark)] opacity-50" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                      <rect x="4" y="8" width="24" height="28" rx="3" fill="currentColor" opacity="0.4"/>
                      <rect x="8" y="8" width="24" height="28" rx="3" fill="currentColor" opacity="0.25"/>
                      <rect x="12" y="8" width="24" height="28" rx="3" fill="currentColor" opacity="0.15"/>
                      <rect x="14" y="15" width="10" height="2" rx="1" fill="#f59e0b" opacity="0.7"/>
                      <rect x="14" y="21" width="8" height="2" rx="1" fill="currentColor" opacity="0.6"/>
                      <rect x="14" y="27" width="6" height="2" rx="1" fill="currentColor" opacity="0.45"/>
                    </svg>
                    <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">暂无对话历史</p>
                    <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mt-1 opacity-70">开始对话后将显示在这里</p>
                  </div>
              ) : (
                <div className="space-y-2.5">
                  {sessions.map((session) => (
                    <motion.div
                      key={session.id}
                      onClick={() => handleLoadSession(session.id)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`p-3.5 rounded-xl cursor-pointer transition-all group ${currentSessionId === session.id
                          ? 'bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)] border border-[var(--color-primary)]'
                          : 'bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)]/50 hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)] border border-transparent'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {session.isPinned && (
                              <Pin className="w-3.5 h-3.5 text-[var(--color-primary)] fill-[var(--color-primary)] flex-shrink-0" />
                            )}
                            <p className="font-medium text-[var(--color-text)] dark:text-[var(--color-text-dark)] text-sm truncate">{session.title}</p>
                          </div>
                          <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mt-1">
                            {session.messageCount} 条消息 · {formatTimeAgo(session.updatedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            onClick={(e) => handleTogglePin(session.id, e)}
                            className={`p-1 rounded transition-colors ${session.isPinned
                              ? 'text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]'
                              : 'text-[var(--color-text-muted)] hover:text-[var(--color-primary)]'
                              }`}
                            title={session.isPinned ? '取消置顶' : '置顶'}
                          >
                            <Pin className={`w-4 h-4 ${session.isPinned ? 'fill-[var(--color-primary)]' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditSessionTitle(session.id, session.title);
                            }}
                            className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] rounded transition-colors"
                            title="编辑标题"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSessionDeleteConfirm({ id: session.id, title: session.title });
                            }}
                            className="p-1 text-[var(--color-text-muted)] hover:text-red-500 rounded transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* 中间：聊天区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="flex-1 min-w-0"
        >
          <div
              className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-2xl shadow-sm flex flex-col h-full border border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
            {selectedKbIds.size > 0 ? (
              <>
                {/* 会话信息 - 紧凑但有呼吸感 */}
                <div className="px-5 py-4 border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
                  <h2 className="text-base font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
                    {currentSessionTitle || (selectedKbIds.size === 1
                      ? knowledgeBases.find(kb => kb.id === Array.from(selectedKbIds)[0])?.name || '新对话'
                      : `${selectedKbIds.size} 个知识库`)}
                  </h2>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {Array.from(selectedKbIds).map(kbId => {
                      const kb = knowledgeBases.find(k => k.id === kbId);
                      return kb ? (
                          <span key={kbId}
                                className="px-2 py-0.5 bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)] text-[var(--color-primary-hover)] dark:text-[var(--color-primary)] text-xs rounded-full">
                          {kb.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* 消息列表 */}
                <div className="flex-1 min-h-0 relative dark:bg-[var(--color-surface-dark)]">
                  {messages.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex flex-col items-center justify-center"
                      >
                      <motion.div
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <MessageSquare className="w-12 h-12 text-[var(--color-text-muted)] dark:text-[var(--color-border-dark)] opacity-30" />
                      </motion.div>
                      <p className="mt-3 text-base text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">开始提问吧！</p>
                      <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] opacity-60 mt-1">AI 正在聆听...</p>
                    </motion.div>
                  ) : (
                    <Virtuoso
                      ref={virtuosoRef}
                      data={messages}
                      initialTopMostItemIndex={messages.length - 1}
                      followOutput="smooth"
                      className="h-full w-full"
                      itemContent={(_index, msg) => (
                          <div className="pb-5 px-5 first:pt-5 last:pb-5 dark:bg-[var(--color-surface-dark)]">
                          <motion.div
                            initial={{ opacity: 0, y: 16, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{
                              type: "spring",
                              stiffness: 280,
                              damping: 24,
                              mass: 0.8,
                            }}
                            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.05, duration: 0.15 }}
                              className={`max-w-2xl rounded-2xl p-5 shadow-sm ${msg.type === 'user'
                                ? 'bg-[var(--color-primary-hover)] text-white'
                                  : 'bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border border-[var(--color-border)] dark:border-[var(--color-border-dark)] text-[var(--color-text)] dark:text-[var(--color-text-muted-dark)]'
                              }`}
                            >
                              {msg.type === 'user' ? (
                                <p className="whitespace-pre-wrap leading-relaxed text-base">{msg.content}</p>
                              ) : (
                                  <div className="prose prose-stone dark:prose-invert max-w-none text-base leading-relaxed">
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      // 自定义代码块渲染
                                      code: ({ className, children }) => {
                                        const match = /language-(\w+)/.exec(className || '');
                                        const isInline = !match;

                                        if (isInline) {
                                          return (
                                              <code
                                                  className="bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] text-[var(--color-primary-hover)] dark:text-[var(--color-primary)] px-1.5 py-0.5 rounded text-xs font-mono">
                                              {children}
                                            </code>
                                          );
                                        }

                                        // 代码块使用 CodeBlock 组件
                                        return (
                                          <CodeBlock language={match[1]}>
                                            {String(children).replace(/\n$/, '')}
                                          </CodeBlock>
                                        );
                                      },
                                      // 禁用默认 pre 渲染，由 CodeBlock 处理
                                      pre: ({ children }) => <>{children}</>,
                                    }}
                                  >
                                    {formatMarkdown(msg.content)}
                                  </ReactMarkdown>
                                  {/* 流式打字光标 - 带琥珀色光晕 */}
                                  {msg.isStreaming && (
                                    <motion.span
                                      className="inline-flex items-center ml-1"
                                      animate={{ opacity: [1, 0.4, 1] }}
                                      transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                      <span className="w-0.5 h-5 bg-[var(--color-primary)] rounded-full shadow-[0_0_8px_var(--color-primary),0_0_16px_var(--color-primary)]" />
                                    </motion.span>
                                  )}
                                </div>
                              )}
                            </motion.div>
                          </motion.div>
                        </div>
                      )}
                    />
                  )}
                </div>

                {/* 输入区域 - 与消息区形成明显区隔 */}
                <div className="p-5 border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)]">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmitQuestion()}
                      placeholder="输入您的问题..."
                      className="flex-1 px-4 py-2.5 border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent text-sm bg-[var(--color-surface)] dark:bg-[var(--color-surface-raised-dark)] text-[var(--color-text)] dark:text-[var(--color-text-dark)] placeholder-[var(--color-text-placeholder)]"
                      disabled={loading}
                    />
                    <motion.button
                      onClick={handleSubmitQuestion}
                      disabled={!question.trim() || selectedKbIds.size === 0 || loading}
                      className="px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm hover:shadow-md"
                      whileHover={loading ? {} : { scale: 1.02, boxShadow: "0 4px 12px rgba(245, 158, 11, 0.35)" }}
                      whileTap={{ scale: loading ? 1 : 0.98 }}
                    >
                      {loading ? (
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="inline-block"
                        >
                          ◌
                        </motion.span>
                      ) : '发送'}
                    </motion.button>
                  </div>
                </div>
              </>
            ) : (
                <div className="flex-1 flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-center"
                >
                  <div className="relative w-14 h-14 mx-auto mb-4">
                    {/* 背景圆环 */}
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-[var(--color-border)] dark:border-[var(--color-border-dark)]"
                      animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.2, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    {/* 中心图标 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <MessageSquare className="w-7 h-7 text-[var(--color-text-muted)] dark:text-[var(--color-border-dark)]" />
                    </div>
                  </div>
                  <p className="text-base text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mb-1">等待选择知识库</p>
                  <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] opacity-70">从右侧面板选择要查询的知识库</p>
                </motion.div>
              </div>
            )}
          </div>
        </motion.div>

        {/* 右侧：知识库选择（简化版） */}
        <AnimatePresence>
          {rightPanelOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
              className="flex-shrink-0 w-[280px]"
            >
              <div
                  className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-2xl p-4 shadow-sm h-full flex flex-col border border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-semibold text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] uppercase tracking-wider">选择知识库</h2>
                  <button
                    onClick={() => setRightPanelOpen(false)}
                    className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] dark:hover:text-[var(--color-text-dark)] rounded"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>

                {/* 搜索框 */}
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="搜索知识库..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-raised-dark)] text-[var(--color-text)] dark:text-[var(--color-text-dark)] placeholder-[var(--color-text-placeholder)]"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
                  </div>
                </div>

                {/* 排序 */}
                <div className="mb-4 relative">
                  <select
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value as SortOption);
                      setSearchKeyword('');
                    }}
                    className="w-full appearance-none pl-4 pr-10 py-2 border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-raised-dark)] text-[var(--color-text)] dark:text-[var(--color-text-dark)] cursor-pointer"
                  >
                    <option value="time">时间排序</option>
                    <option value="size">大小排序</option>
                    <option value="access">访问排序</option>
                    <option value="question">提问排序</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none" />
                </div>

                {/* 知识库列表 */}
                <div className="flex-1 overflow-y-auto py-1">
                  {loadingList ? (
                    <div className="text-center py-6">
                      <motion.div
                        className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full mx-auto"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  ) : knowledgeBases.length === 0 ? (
                      <div className="text-center py-8 text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">
                      <p className="mb-2 text-sm">{searchKeyword ? '未找到' : '暂无知识库'}</p>
                      {!searchKeyword && (
                        <button onClick={onUpload} className="text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] font-medium text-sm">
                          立即上传
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {groupedKnowledgeBases.map((group) => (
                          <div key={group.name}
                               className="border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-xl overflow-hidden">
                          <button
                            onClick={() => toggleCategory(group.name)}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)]/50 hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)] transition-colors"
                          >
                            <div className="flex items-center gap-2.5">
                              <ChevronRight
                                className={`w-3.5 h-3.5 text-[var(--color-text-muted)] transition-transform duration-200 ${group.isExpanded ? 'rotate-90' : ''}`}
                              />
                              <span
                                  className="font-medium text-[var(--color-text)] dark:text-[var(--color-text-muted-dark)] text-sm">{group.name}</span>
                            </div>
                            <span className="text-xs text-[var(--color-text-muted)]">{group.items.length}</span>
                          </button>

                          <AnimatePresence>
                            {group.isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="p-2.5 space-y-1.5">
                                  {group.items.map((kb) => (
                                    <motion.div
                                      key={kb.id}
                                      onClick={() => handleToggleKb(kb.id)}
                                      whileHover={{ scale: 1.01 }}
                                      whileTap={{ scale: 0.99 }}
                                      className={`p-2.5 rounded-lg cursor-pointer transition-all ${selectedKbIds.has(kb.id)
                                          ? 'bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)] border border-[var(--color-primary)]'
                                          : 'bg-[var(--color-surface)] dark:bg-[var(--color-surface-raised-dark)]/50 hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)] border border-transparent'
                                        }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={selectedKbIds.has(kb.id)}
                                          onChange={() => handleToggleKb(kb.id)}
                                          onClick={(e) => e.stopPropagation()}
                                          className="w-3.5 h-3.5 text-[var(--color-primary)] rounded focus:ring-[var(--color-primary)]"
                                        />
                                        <span
                                            className="font-medium text-[var(--color-text)] dark:text-[var(--color-text-dark)] text-xs truncate flex-1">{kb.name}</span>
                                      </div>
                                      <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mt-0.5 ml-5">{formatFileSize(kb.fileSize)}</p>
                                    </motion.div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 收起状态下的展开按钮 */}
        {!rightPanelOpen && (
          <button
            onClick={() => setRightPanelOpen(true)}
            className="flex-shrink-0 w-10 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-2xl shadow-sm border border-[var(--color-border)] dark:border-[var(--color-border-dark)] flex items-center justify-center hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)] transition-colors"
            title="展开知识库面板"
          >
            <ChevronRight className="w-5 h-5 text-[var(--color-text-muted)]" />
          </button>
        )}
      </div>

      {/* 删除会话确认弹窗 */}
      <DeleteConfirmDialog
        open={!!sessionDeleteConfirm}
        item={sessionDeleteConfirm ? { id: 0, title: sessionDeleteConfirm.title } : null}
        itemType="对话"
        onConfirm={handleDeleteSession}
        onCancel={() => setSessionDeleteConfirm(null)}
      />

      {/* 编辑会话标题弹窗 */}
      <AnimatePresence>
        {editingSessionTitle && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setEditingSessionTitle(null);
                setNewSessionTitle('');
              }}
              className="fixed inset-0 bg-[var(--color-bg-dark)]/60 backdrop-blur-sm z-50"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] rounded-2xl shadow-2xl max-w-md w-full p-6 border border-[var(--color-border)] dark:border-[var(--color-border-dark)]"
              >
                <h3 className="text-lg font-semibold text-[var(--color-text)] dark:text-[var(--color-text-dark)] mb-5">编辑标题</h3>
                <input
                  type="text"
                  value={newSessionTitle}
                  onChange={(e) => setNewSessionTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveSessionTitle()}
                  placeholder="请输入新标题"
                  className="w-full px-4 py-3 text-base border border-[var(--color-border)] dark:border-[var(--color-border-dark)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] mb-6 bg-[var(--color-surface)] dark:bg-[var(--color-surface-raised-dark)] text-[var(--color-text)] dark:text-[var(--color-text-dark)] placeholder-[var(--color-text-placeholder)]"
                  autoFocus
                />
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setEditingSessionTitle(null);
                      setNewSessionTitle('');
                    }}
                    className="px-4 py-2 text-sm text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] hover:text-[var(--color-text)] dark:hover:text-[var(--color-text-dark)]"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveSessionTitle}
                    disabled={!newSessionTitle.trim()}
                    className="px-4 py-2 text-sm bg-[var(--color-primary)] text-white rounded-lg hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                  >
                    保存
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
