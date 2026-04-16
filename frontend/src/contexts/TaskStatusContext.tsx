import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { taskApi } from '../api/task';

export interface Task {
  id: string;
  type: string;
  label: string;
  status: 'pending' | 'done' | 'error';
  result?: string;
  error?: string;
}

interface TaskStatusContextValue {
  tasks: Task[];
  startTask: (id: string, type: string, label: string) => void;
  dismissTask: (id: string) => void;
}

const TaskStatusContext = createContext<TaskStatusContextValue | null>(null);

const POLL_INTERVAL_MS = 3000;

export function TaskStatusProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const timersRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});

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
    (id: string, type: string, label: string) => {
      setTasks(prev => [...prev.filter(t => t.id !== id), { id, type, label, status: 'pending' as const }]);
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
