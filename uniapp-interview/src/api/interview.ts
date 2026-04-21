import Taro from '@tarojs/taro';
import request from './request';
import type {
  CreateInterviewRequest,
  CurrentQuestionResponse,
  GrowthCurve,
  InterviewReport,
  InterviewSession,
  JobRoleDTO,
  SubmitAnswerRequest,
  SubmitAnswerResponse
} from '../types/interview';

const baseURL = process.env.API_BASE_URL || 'http://localhost:8080';

export const interviewApi = {
  /**
   * 创建面试会话
   */
  async createSession(req: CreateInterviewRequest): Promise<InterviewSession> {
    return request.post<InterviewSession>('/interview/sessions', req, {
      timeout: 180000, // 3分钟超时，AI生成问题需要时间
    });
  },

  /**
   * 获取岗位列表
   */
  async getJobRoles(): Promise<JobRoleDTO[]> {
    return request.get<JobRoleDTO[]>('/interview/job-roles');
  },

  /**
   * 获取会话信息
   */
  async getSession(sessionId: string): Promise<InterviewSession> {
    return request.get<InterviewSession>(`/interview/sessions/${sessionId}`);
  },

  /**
   * 获取当前问题
   */
  async getCurrentQuestion(sessionId: string): Promise<CurrentQuestionResponse> {
    return request.get<CurrentQuestionResponse>(`/interview/sessions/${sessionId}/question`);
  },

  /**
   * 提交答案
   */
  async submitAnswer(req: SubmitAnswerRequest): Promise<SubmitAnswerResponse> {
    return request.post<SubmitAnswerResponse>(
      `/interview/sessions/${req.sessionId}/answers`,
      { questionIndex: req.questionIndex, answer: req.answer },
      {
        timeout: 180000, // 3分钟超时
      }
    );
  },

  /**
   * 获取面试报告
   */
  async getReport(sessionId: string): Promise<InterviewReport> {
    return request.get<InterviewReport>(`/interview/sessions/${sessionId}/report`, {
      timeout: 180000, // 3分钟超时，AI评估需要时间
    });
  },

  /**
   * 查找未完成的面试会话
   */
  async findUnfinishedSession(resumeId: number): Promise<InterviewSession | null> {
    try {
      return await request.get<InterviewSession>(`/interview/sessions/unfinished/${resumeId}`);
    } catch {
      // 如果没有未完成的会话，返回null
      return null;
    }
  },

  /**
   * 暂存答案（不进入下一题）
   */
  async saveAnswer(req: SubmitAnswerRequest): Promise<void> {
    return request.put<void>(
      `/interview/sessions/${req.sessionId}/answers`,
      { questionIndex: req.questionIndex, answer: req.answer }
    );
  },

  /**
   * 提前交卷
   */
  async completeInterview(sessionId: string): Promise<void> {
    return request.post<void>(`/interview/sessions/${sessionId}/complete`);
  },

  /**
   * 导出面试报告PDF
   */
  async exportReport(sessionId: string): Promise<string> {
    console.log('[exportReport] start, sessionId:', sessionId);
    const downloadRes = await Taro.downloadFile({
      url: `${baseURL}/api/interview/sessions/${sessionId}/export`,
    });
    console.log('[exportReport] downloadRes:', downloadRes.statusCode, downloadRes.tempFilePath);
    if (downloadRes.statusCode !== 200) {
      throw new Error('下载失败');
    }
    const tmp = downloadRes.tempFilePath || '';
    // Windows mp 环境下 tempFilePath 可能返回 HTTP URL，改用 request 获取 arrayBuffer 再写入本地
    if (tmp.includes('://')) {
      console.log('[exportReport] using arrayBuffer approach for HTTP URL');
      const arrayBufferRes = await Taro.request({
        url: `${baseURL}/api/interview/sessions/${sessionId}/export`,
        responseType: 'arraybuffer',
      });
      console.log('[exportReport] arrayBufferRes status:', arrayBufferRes.statusCode, 'data type:', typeof arrayBufferRes.data);
      if (arrayBufferRes.statusCode !== 200) {
        throw new Error('下载失败');
      }
      const fm = Taro.getFileSystemManager();
      const localPath = `${Taro.env.USER_DATA_PATH}/interview_report_${Date.now()}.pdf`;
      console.log('[exportReport] writing to:', localPath);
      await fm.writeFile({
        filePath: localPath,
        data: arrayBufferRes.data as ArrayBuffer,
        encoding: 'binary',
      });
      console.log('[exportReport] write success, returning:', localPath);
      return localPath;
    }
    console.log('[exportReport] using saveFile approach, tmp:', tmp);
    const saveRes = await Taro.saveFile({ tempFilePath: tmp });
    console.log('[exportReport] saveRes:', saveRes.savedFilePath);
    return saveRes.savedFilePath;
  },

  async getGrowthCurve(resumeId: number): Promise<GrowthCurve> {
    return request.get<GrowthCurve>(`/interview/growth?resumeId=${resumeId}`);
  },
};

export default interviewApi;
