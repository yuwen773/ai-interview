import { Link, Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar, ChevronRight, Database, FileStack, GitBranch, MessageSquare,
  Moon, Sparkles, Sun, Upload, Users, Brain, Settings,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface NavItem {
  id: string;
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

export default function Layout() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { theme, toggleTheme } = useTheme();

  const navGroups: NavGroup[] = [
    {
      id: 'resume',
      title: '简历中心',
      items: [
        { id: 'upload', path: '/upload', label: '上传简历', icon: Upload, description: 'AI 分析简历' },
        { id: 'resumes', path: '/history', label: '简历管理', icon: FileStack, description: '管理所有简历' },
      ],
    },
    {
      id: 'interview',
      title: '面试',
      items: [
        { id: 'interview-hub', path: '/interview-hub', label: '模拟面试', icon: Sparkles, description: '文字/语音面试练习' },
        { id: 'interviews', path: '/interviews', label: '面试记录', icon: Users, description: '查看面试历史' },
        { id: 'interview-schedule', path: '/interview-schedule', label: '面试日程', icon: Calendar, description: '管理面试安排' },
      ],
    },
    {
      id: 'growth',
      title: '个人成长',
      items: [
        { id: 'profile', path: '/profile', label: '个人画像', icon: Brain, description: '查看能力画像' },
        { id: 'graph', path: '/graph', label: '知识图谱', icon: GitBranch, description: '题目关联图谱' },
      ],
    },
    {
      id: 'knowledge',
      title: '知识库',
      items: [
        { id: 'kb-manage', path: '/knowledgebase', label: '知识库管理', icon: Database, description: '管理知识文档' },
        { id: 'chat', path: '/knowledgebase/chat', label: '问答助手', icon: MessageSquare, description: '基于知识库问答' },
      ],
    },
    {
      id: 'system',
      title: '系统',
      items: [
        { id: 'settings', path: '/settings', label: '系统设置', icon: Settings, description: '管理模型和语音服务' },
      ],
    },
  ];

  const isActive = (path: string) => {
    if (path === '/history') {
      return currentPath === '/history'
        || currentPath.startsWith('/history/');
    }
    if (path === '/upload') {
      return currentPath === '/upload';
    }
    if (path === '/interview-hub') {
      return currentPath === '/interview-hub'
        || currentPath === '/interview'
        || currentPath.startsWith('/interview/')
        || currentPath.startsWith('/voice-interview');
    }
    if (path === '/knowledgebase') {
      return currentPath === '/knowledgebase' || currentPath === '/knowledgebase/upload';
    }
    return currentPath.startsWith(path);
  };

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)] dark:bg-[var(--color-bg-dark)]">
      {/* 左侧边栏 */}
      <aside className="w-64 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border-r border-[var(--color-border)] dark:border-[var(--color-border-dark)] fixed h-screen left-0 top-0 z-50 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--color-primary)] rounded-xl flex items-center justify-center text-white shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-lg font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)] block leading-tight">AI Interview</span>
              <span className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">智能面试助手</span>
            </div>
          </Link>
        </div>

        {/* 主题切换 */}
        <div className="px-4 py-3">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] hover:bg-[var(--color-surface)] dark:hover:bg-[var(--color-surface-dark)] transition-colors"
          >
            {theme === 'dark' ? (
              <><Sun className="w-4 h-4" /><span className="text-sm font-medium">浅色模式</span></>
            ) : (
              <><Moon className="w-4 h-4" /><span className="text-sm font-medium">深色模式</span></>
            )}
          </button>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 px-3 overflow-y-auto scrollbar-hidden" aria-label="主导航">
          <div className="space-y-6">
            {navGroups.map((group) => (
              <div key={group.id}>
                <div className="px-3 mb-2">
                  <span className="text-xs font-semibold text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] uppercase tracking-wider">
                    {group.title}
                  </span>
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.id}
                        to={item.path}
                        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                          active
                            ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] dark:text-[var(--color-primary)]'
                            : 'text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)] hover:text-[var(--color-text)] dark:hover:text-[var(--color-text-dark)]'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                          active
                            ? 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]'
                            : 'bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] group-hover:text-[var(--color-text)] dark:group-hover:text-[var(--color-text-dark)]'
                        }`}>
                          <item.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm block ${active ? 'font-semibold' : 'font-medium'}`}>
                            {item.label}
                          </span>
                          {item.description && (
                            <span className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] truncate block">
                              {item.description}
                            </span>
                          )}
                        </div>
                        {active && (
                          <ChevronRight className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* 底部 */}
        <div className="p-4 border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
          <div className="px-3 py-2 rounded-xl bg-[var(--color-primary)]/5 dark:bg-[var(--color-primary)]/10">
            <p className="text-xs font-medium text-[var(--color-primary)]">AI 面试助手 v1.0</p>
            <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mt-0.5">Powered by AI</p>
          </div>
        </div>
      </aside>

      {/* 主内容区 — 渐变背景 */}
      <main
        className="flex-1 ml-64 p-10 min-h-screen overflow-y-auto"
        style={{
          background: theme === 'dark'
            ? 'linear-gradient(135deg, var(--color-bg-dark) 0%, color-mix(in srgb, var(--color-bg-dark) 95%, var(--color-primary)) 100%)'
            : 'linear-gradient(135deg, var(--color-bg) 0%, color-mix(in srgb, var(--color-bg) 95%, var(--color-primary)) 100%)',
        }}
      >
        <motion.div
          key={currentPath}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
