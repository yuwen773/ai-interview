import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { taskApi } from '../api/task';

export interface Task {
  id: string;
  type: string;
  label: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  result?: string;
  error?: string;
  /** 完成后点击可跳转的路径 */
  navigateTo?: string;
}

interface TaskStatusContextValue {
  tasks: Task[];
  startTask: (id: string, type: string, label: string, navigateTo?: string) => void;
  dismissTask: (id: string) => void;
}

const TaskStatusContext = createContext<TaskStatusContextValue | null>(null);

const POLL_INTERVAL_MS = 3000;

export function TaskStatusProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const timersRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  // 清理所有定时器，防止卸载后继续触发
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearInterval);
      timersRef.current = {};
    };
  }, []);

  const updateTask = useCallback((id: string, patch: Partial<Task>) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const stopPolling = useCallback((id: string) => {
    const timer = timersRef.current[id];
    if (timer) {
      clearInterval(timer);
      delete timersRef.current[id];
    }
  }, []);

  const pollTask = useCallback(
    (id: string) => {
      const timer = setInterval(async () => {
        try {
          const res = await taskApi.getStatus(id);
          if (res.status === 'COMPLETED') {
            updateTask(id, { status: 'done', result: res.result });
            stopPolling(id);
          } else if (res.status === 'FAILED') {
            updateTask(id, { status: 'error', error: res.error });
            stopPolling(id);
          } else if (res.status === 'PROCESSING') {
            updateTask(id, { status: 'processing' });
          }
        } catch {
          // Network error — keep polling
        }
      }, POLL_INTERVAL_MS);
      timersRef.current[id] = timer;
    },
    [updateTask, stopPolling],
  );

  const startTask = useCallback(
    (id: string, type: string, label: string, navigateTo?: string) => {
      setTasks(prev => [
        ...prev.filter(t => t.id !== id),
        { id, type, label, status: 'pending' as const, navigateTo },
      ]);
      pollTask(id);
    },
    [pollTask],
  );

  const dismissTask = useCallback(
    (id: string) => {
      stopPolling(id);
      setTasks(prev => prev.filter(t => t.id !== id));
    },
    [stopPolling],
  );

  return (
    <TaskStatusContext.Provider value={{ tasks, startTask, dismissTask }}>
      {children}
    </TaskStatusContext.Provider>
  );
}

export function useTaskStatus(): TaskStatusContextValue {
  const ctx = useContext(TaskStatusContext);
  if (!ctx) throw new Error('useTaskStatus must be used within TaskStatusProvider');
  return ctx;
}
