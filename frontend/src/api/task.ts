import { request } from './request';

export interface TaskStatus {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  result?: string;
  error?: string;
}

export const taskApi = {
  getStatus: (taskId: string) =>
    request.get<TaskStatus>(`/api/tasks/${taskId}`),
};
