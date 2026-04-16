import { useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { useTaskStatus, type Task } from '../contexts/TaskStatusContext';

const AUTO_DISMISS_MS = 5000;

function StatusIcon({ status }: { status: Task['status'] }) {
  switch (status) {
    case 'pending':
      return <Loader2 className="w-4 h-4 animate-spin text-[var(--color-primary)]" />;
    case 'done':
      return <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-[var(--color-error)]" />;
  }
}

export function TaskNotification() {
  const { tasks, dismissTask } = useTaskStatus();

  useEffect(() => {
    const doneTasks = tasks.filter(t => t.status === 'done' || t.status === 'error');
    const timers = doneTasks.map(t =>
      setTimeout(() => dismissTask(t.id), AUTO_DISMISS_MS),
    );
    return () => timers.forEach(clearTimeout);
  }, [tasks, dismissTask]);

  if (tasks.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {tasks.map(task => (
        <div
          key={task.id}
          className="animate-fade-in-up flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border border-[var(--color-border)] dark:border-[var(--color-border-dark)] bg-[var(--color-surface)] dark:bg-[var(--color-surface-dark)] min-w-[280px]"
        >
          <StatusIcon status={task.status} />
          <span className="flex-1 text-sm text-[var(--color-text)] dark:text-[var(--color-text-dark)]">
            {task.label}
          </span>
          {(task.status === 'done' || task.status === 'error') && (
            <button
              onClick={() => dismissTask(task.id)}
              className="p-1 rounded hover:bg-[var(--color-surface-raised)] dark:hover:bg-[var(--color-surface-raised-dark)]"
            >
              <X className="w-3 h-3 text-[var(--color-text-muted)]" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
