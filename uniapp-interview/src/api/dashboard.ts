import request from './request';
import type { DashboardSummary } from '../types/dashboard';

export const dashboardApi = {
  async getSummary(): Promise<DashboardSummary> {
    return request.get<DashboardSummary>('/dashboard/summary');
  },
};

export default dashboardApi;
