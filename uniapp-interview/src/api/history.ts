import Taro from '@tarojs/taro';
import request from './request';
import type { JobRole } from '../types/interview';

const baseURL = process.env.API_BASE_URL || 'http://localhost:8080';

export type AnalyzeStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type EvaluateStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface ResumeListItem {
  id: number;
  filename: string;
  fileSize: number;
  uploadedAt: string;
  accessCount: number;
  latestScore?: number;
  lastAnalyzedAt?: string;
  interviewCount: number;
  analyzeStatus?: AnalyzeStatus;
  analyzeError?: string;
  storageUrl?: string;
}

export interface ResumeStats {
  totalCount: number;
  totalInterviewCount: number;
  totalAccessCount: number;
}

export interface AnalysisItem {
  id: number;
  overallScore: number;
  contentScore: number;
  structureScore: number;
  skillMatchScore: number;
  expressionScore: number;
  projectScore: number;
  summary: string;
  analyzedAt: string;
  strengths: string[];
  suggestions: unknown[];
}

export interface InterviewItem {
  id: number;
  sessionId: string;
  jobRole?: JobRole;
  jobLabel?: string;
  totalQuestions: number;
  status: string;
  evaluateStatus?: EvaluateStatus;
  evaluateError?: string;
  overallScore: number | null;
  overallFeedback: string | null;
  createdAt: string;
  completedAt: string | null;
  questions?: unknown[];
  strengths?: string[];
  improvements?: string[];
  referenceAnswers?: unknown[];
}

export interface AnswerItem {
  questionIndex: number;
  question: string;
  category: string;
  userAnswer: string;
  score: number;
  feedback: string;
  referenceAnswer?: string;
  keyPoints?: string[];
  answeredAt: string;
}

export interface ResumeDetail {
  id: number;
  filename: string;
  fileSize: number;
  contentType: string;
  storageUrl: string;
  uploadedAt: string;
  accessCount: number;
  resumeText: string;
  analyzeStatus?: AnalyzeStatus;
  analyzeError?: string;
  analyses: AnalysisItem[];
  interviews: InterviewItem[];
}

export interface InterviewDetail extends InterviewItem {
  evaluateStatus?: EvaluateStatus;
  evaluateError?: string;
  answers: AnswerItem[];
}

export interface InterviewHistorySummaryStats {
  totalCount: number;
  completedCount: number;
  averageScore: number;
}

export interface InterviewHistorySummaryItem {
  sessionId: string;
  resumeId: number;
  resumeFilename: string;
  jobRole: JobRole;
  jobLabel: string;
  totalQuestions: number;
  status: string;
  evaluateStatus: EvaluateStatus | null;
  overallScore: number | null;
  createdAt: string;
  completedAt: string | null;
}

export interface InterviewHistorySummary {
  stats: InterviewHistorySummaryStats;
  items: InterviewHistorySummaryItem[];
}

export const historyApi = {
  /**
   * 获取所有简历列表
   */
  async getResumes(): Promise<ResumeListItem[]> {
    return request.get<ResumeListItem[]>('/resumes');
  },

  /**
   * 获取简历详情
   */
  async getResumeDetail(id: number): Promise<ResumeDetail> {
    return request.get<ResumeDetail>(`/resumes/${id}/detail`);
  },

  /**
   * 获取面试详情
   */
  async getInterviewDetail(sessionId: string): Promise<InterviewDetail> {
    return request.get<InterviewDetail>(`/interview/sessions/${sessionId}/details`);
  },

  /**
   * Fetch interview history summary for the redesigned history tab.
   */
  async getInterviewHistorySummary(): Promise<InterviewHistorySummary> {
    return request.get<InterviewHistorySummary>('/interview/history/summary');
  },

  /**
   * 删除简历
   */
  async deleteResume(id: number): Promise<void> {
    return request.delete(`/resumes/${id}`);
  },

  /**
   * 删除面试记录
   */
  async deleteInterview(sessionId: string): Promise<void> {
    return request.delete(`/interview/sessions/${sessionId}`);
  },

  /**
   * 获取简历统计信息
   */
  async getStatistics(): Promise<ResumeStats> {
    return request.get<ResumeStats>('/resumes/statistics');
  },

  /**
   * 重新分析简历
   */
  async reanalyze(id: number): Promise<void> {
    return request.post(`/resumes/${id}/reanalyze`);
  },

  /**
   * 导出简历分析报告PDF
   */
  async exportAnalysisPdf(resumeId: number): Promise<string> {
    const downloadRes = await Taro.downloadFile({
      url: `${baseURL}/api/resumes/${resumeId}/export`,
    });
    if (downloadRes.statusCode !== 200) {
      throw new Error('下载失败');
    }
    const tmp = downloadRes.tempFilePath || '';
    // Windows mp 环境下 tempFilePath 可能返回 HTTP URL，改用 request 获取 arrayBuffer 再写入本地
    if (tmp.includes('://')) {
      const arrayBufferRes = await Taro.request({
        url: `${baseURL}/api/resumes/${resumeId}/export`,
        responseType: 'arraybuffer',
      });
      if (arrayBufferRes.statusCode !== 200) {
        throw new Error('下载失败');
      }
      const fm = Taro.getFileSystemManager();
      const localPath = `${Taro.env.USER_DATA_PATH}/resume_report_${Date.now()}.pdf`;
      await fm.writeFile({
        filePath: localPath,
        data: arrayBufferRes.data as ArrayBuffer,
        encoding: 'binary',
      });
      return localPath;
    }
    const saveRes = await Taro.saveFile({ tempFilePath: tmp });
    return saveRes.savedFilePath;
  },

  /**
   * 导出面试报告PDF
   */
  async exportInterviewPdf(sessionId: string): Promise<string> {
    const filePath = await Taro.downloadFile({
      url: `${baseURL}/api/interview/sessions/${sessionId}/export`,
    }).then(res => {
      if (res.statusCode !== 200) {
        throw new Error('下载失败');
      }
      return Taro.saveFile({ tempFilePath: res.tempFilePath }).then(saveRes => saveRes.savedFilePath);
    });
    return filePath;
  },
};
