import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2, X, ExternalLink } from 'lucide-react';
import { cn } from '../utils/cn';
import { useTaskStatus, type Task } from '../contexts/TaskStatusContext';

const AUTO_DISMISS_MS = 8000;

function StatusIcon({ status }: { status: Task['status'] }) {
  switch (status) {
    case 'pending':
      return <Loader2 className="w-4 h-4 animate-spin text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]" />;
    case 'processing':
      return <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />;
    case 'done':
      return <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-[var(--color-error)]" />;
  }
}

function StatusLabel({ status }: { status: Task['status'] }) {
  switch (status) {
    case 'pending':
      return <span className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-text-muted-dark)]">排队中</span>;
    case 'processing':
      return <span className="text-xs text-[var(--color-primary)]">处理中...</span>;
    case 'done':
      return <span className="text-xs text-[var(--color-success)]">已完成</span>;
    case 'error':
      return <span className="text-xs text-[var(--color-error)]">失败</span>;
  }
}

export function TaskNotification() {
  const { tasks, dismissTask } = useTaskStatus();
  const navigate = useNavigate();
  const scheduledRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // 清理所有定时器，防止卸载后继续触发
  useEffect(() => {
    return () => {
      scheduledRef.current.forEach(timer => clearTimeout(timer));
      scheduledRef.current.clear();
    };
  }, []);

  useEffect(() => {
    for (const t of tasks) {
      if ((t.status === 'done' || t.status === 'error') && !scheduledRef.current.has(t.id)) {
        const timer = setTimeout(() => {
          scheduledRef.current.delete(t.id);
          dismissTask(t.id);
        }, AUTO_DISMISS_MS);
        scheduledRef.current.set(t.id, timer);
      }
    }
  }, [tasks, dismissTask]);

  const handleClick = useCallback((task: Task) => {
    if (task.status === 'done' && task.navigateTo) {
      navigate(task.navigateTo);
      dismissTask(task.id);
    }
  }, [navigate, dismissTask]);

  if (tasks.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {tasks.map(task => {
        const isClickable = task.status === 'done' && !!task.navigateTo;
        return (
          <div
            key={task.id}
            onClick={() => handleClick(task)}
            className={cn(
              'animate-fade-in-up group flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border min-w-[280px] transition-all duration-300',
              'border-[var(--color-border)] dark:border-[var(--color-border-dark)]',
              'bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)]',
              task.status === 'processing' && 'border-l-2 border-l-[var(--color-primary)]',
              task.status === 'done' && 'border-l-2 border-l-[var(--color-success)]',
              task.status === 'error' && 'border-l-2 border-l-[var(--color-error)]',
              isClickable && 'cursor-pointer hover:shadow-xl hover:scale-[1.02]',
            )}
          >
            <StatusIcon status={task.status} />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-[var(--color-text)] dark:text-[var(--color-text-dark)] block truncate">
                {task.label}
              </span>
              <StatusLabel status={task.status} />
            </div>
            {isClickable && (
              <ExternalLink className="w-3.5 h-3.5 text-[var(--color-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
            {(task.status === 'done' || task.status === 'error') && (
              <button
                onClick={(e) => { e.stopPropagation(); dismissTask(task.id); }}
                className="p-1 rounded hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)] transition-colors"
              >
                <X className="w-3 h-3 text-[var(--color-text-muted)]" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
