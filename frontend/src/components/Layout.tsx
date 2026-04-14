import {Link, Outlet, useLocation} from 'react-router-dom';
import {motion} from 'framer-motion';
import {ChevronRight, Database, FileStack, MessageSquare, Moon, Sparkles, Sun, Upload, Users,} from 'lucide-react';
import {useTheme} from '../hooks/useTheme';

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
    const {theme, toggleTheme} = useTheme();

  // 按业务模块组织的导航项
  const navGroups: NavGroup[] = [
    {
      id: 'career',
      title: '简历与面试',
      items: [
        { id: 'upload', path: '/upload', label: '上传简历', icon: Upload, description: 'AI 分析简历' },
        { id: 'resumes', path: '/history', label: '简历库', icon: FileStack, description: '管理所有简历' },
        { id: 'interviews', path: '/interviews', label: '面试记录', icon: Users, description: '查看面试历史' },
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
  ];

  // 判断当前页面是否匹配导航项
  const isActive = (path: string) => {
    if (path === '/upload') {
      return currentPath === '/upload' || currentPath === '/';
    }
    if (path === '/knowledgebase') {
      return currentPath === '/knowledgebase' || currentPath === '/knowledgebase/upload';
    }
    return currentPath.startsWith(path);
  };

  return (
      <div
          className="flex min-h-screen bg-[var(--color-bg)] dark:bg-[var(--color-bg-dark)]">
      {/* 左侧边栏 */}
          <aside
              className="w-64 bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] border-r border-[var(--color-border)] dark:border-[var(--color-border-dark)] fixed h-screen left-0 top-0 z-50 flex flex-col">
        {/* Logo */}
              <div className="p-6 border-b border-[var(--color-border)] dark:border-[var(--color-border-dark)] flex items-center justify-between">
          <Link to="/upload" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--color-primary)] rounded-xl flex items-center justify-center text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
                <span
                    className="text-lg font-bold text-[var(--color-text)] dark:text-[var(--color-text-dark)] tracking-tight block">AI Interview</span>
                <span className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">智能面试助手</span>
            </div>
          </Link>
        </div>

              {/* 主题切换按钮 */}
              <div className="px-4 pb-2">
                  <button
                      onClick={toggleTheme}
                      aria-label={theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:outline-none"
                  >
                      {theme === 'dark' ? (
                          <>
                              <Sun className="w-4 h-4"/>
                              <span className="text-sm font-medium">浅色模式</span>
                          </>
                      ) : (
                          <>
                              <Moon className="w-4 h-4"/>
                              <span className="text-sm font-medium">深色模式</span>
                          </>
                      )}
                  </button>
              </div>

        {/* 导航菜单 */}
        <nav className="flex-1 p-4 overflow-y-auto" aria-label="主导航">
          <div className="space-y-6">
            {navGroups.map((group) => (
              <div key={group.id}>
                {/* 分组标题 */}
                <div className="px-3 mb-2">
                  <span className="text-xs font-semibold text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] uppercase tracking-wider">
                    {group.title}
                  </span>
                </div>
                {/* 分组下的导航项 */}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const active = isActive(item.path);
                    return (
                      <Link
                        key={item.id}
                        to={item.path}
                        aria-current={active ? 'page' : undefined}
                        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                          ${active
                            ? 'bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)] text-[var(--color-primary-hover)] dark:text-[var(--color-primary)]'
                            : 'text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)] hover:text-[var(--color-text)] dark:hover:text-[var(--color-text-dark)]'
                          }`}
                      >
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors
                          ${active
                            ? 'bg-[var(--color-primary-subtle)] dark:bg-[var(--color-primary-subtle-dark)] text-[var(--color-primary-hover)] dark:text-[var(--color-primary)]'
                            : 'bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] group-hover:bg-[var(--color-surface-raised)] dark:group-hover:bg-[var(--color-surface-raised-dark)] group-hover:text-[var(--color-text)] dark:group-hover:text-[var(--color-text-dark)]'
                          }`}
                        >
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
                          <ChevronRight className="w-4 h-4 text-[var(--color-primary)]" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* 底部信息 */}
              <div className="p-4 border-t border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
                  <div
                      className="px-3 py-2 bg-[var(--color-surface-raised)] dark:bg-[var(--color-surface-raised-dark)] rounded-xl border border-[var(--color-border)] dark:border-[var(--color-border-dark)]">
                      <p className="text-xs text-[var(--color-primary-hover)] dark:text-[var(--color-primary)] font-medium">AI 面试助手</p>
                      <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)] mt-0.5">专业面试训练平台</p>
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <main className="flex-1 ml-64 p-10 min-h-screen overflow-y-auto">
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
