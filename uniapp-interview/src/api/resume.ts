import request from './request';
import type { UploadResponse, ResumeDetail } from '../types/resume';

export const resumeApi = {
  /**
   * 上传简历并获取分析结果
   */
  async uploadAndAnalyze(filePath: string, fileName: string): Promise<UploadResponse> {
    return request.upload<UploadResponse>('/resumes/upload', filePath, fileName);
  },

  /**
   * 获取简历详情
   */
  async getDetail(id: string | number): Promise<ResumeDetail> {
    return request.get<ResumeDetail>(`/resumes/${id}/detail`);
  },

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ status: string; service: string }> {
    return request.get('/resumes/health');
  },
};

export default resumeApi;
