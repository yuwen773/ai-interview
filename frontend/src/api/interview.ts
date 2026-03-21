import type {
  CandidateInputMode,
  CreateInterviewRequest,
  CurrentQuestionResponse,
  InterviewReport,
  InterviewerOutputMode,
  InterviewSession,
  SubmitAnswerRequest,
  SubmitAnswerResponse,
  VoiceRecognizeResponse
} from '../types/interview';
import { getErrorMessage, request } from './request';

const baseURL = import.meta.env.PROD ? '' : 'http://localhost:8080';

function toBackendOutputMode(mode: InterviewerOutputMode): 'TEXT' | 'TEXT_VOICE' {
  return mode === 'textVoice' ? 'TEXT_VOICE' : 'TEXT';
}

export const interviewApi = {
  inferAudioFileName(file: Blob, preferredName?: string): string {
    if (preferredName) {
      return preferredName;
    }

    const extensionMap: Record<string, string> = {
      'audio/wav': 'wav',
      'audio/wave': 'wav',
      'audio/x-wav': 'wav',
      'audio/webm': 'webm',
      'audio/ogg': 'ogg',
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
    };

    const extension = extensionMap[file.type] ?? 'bin';
    return `answer.${extension}`;
  },
  /**
   * 创建面试会话
   */
  async createSession(req: CreateInterviewRequest): Promise<InterviewSession> {
    return request.post<InterviewSession>('/api/interview/sessions', req, {
      timeout: 180000, // 3分钟超时，AI生成问题需要时间
    });
  },

  /**
   * 获取会话信息
   */
  async getSession(sessionId: string): Promise<InterviewSession> {
    return request.get<InterviewSession>(`/api/interview/sessions/${sessionId}`);
  },

  /**
   * 获取当前问题
   */
  async getCurrentQuestion(sessionId: string): Promise<CurrentQuestionResponse> {
    return request.get<CurrentQuestionResponse>(`/api/interview/sessions/${sessionId}/question`);
  },

  /**
   * 提交答案
   */
  async submitAnswer(req: SubmitAnswerRequest): Promise<SubmitAnswerResponse> {
    return request.post<SubmitAnswerResponse>(
      `/api/interview/sessions/${req.sessionId}/answers`,
      {
        questionIndex: req.questionIndex,
        answer: req.answer,
        interviewerOutputMode: toBackendOutputMode(req.interviewerOutputMode ?? 'text'),
      },
      {
        timeout: 180000, // 3分钟超时
      }
    );
  },

  /**
   * 识别语音答案（仅识别，不推进会话）
   */
  async recognizeVoiceAnswer(req: {
    sessionId: string;
    questionIndex: number;
    file: Blob;
    fileName?: string;
    inputMode?: CandidateInputMode;
  }): Promise<VoiceRecognizeResponse> {
    if (req.inputMode && req.inputMode !== 'voice') {
      throw new Error('当前不是语音答题模式');
    }

    const formData = new FormData();
    formData.append('questionIndex', String(req.questionIndex));
    formData.append('file', req.file, interviewApi.inferAudioFileName(req.file, req.fileName));

    try {
      return await request.upload<VoiceRecognizeResponse>(
        `/api/interview/sessions/${req.sessionId}/answers/voice/recognize`,
        formData,
        { timeout: 120000 }
      );
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  /**
   * 获取面试报告
   */
  async getReport(sessionId: string): Promise<InterviewReport> {
    return request.get<InterviewReport>(`/api/interview/sessions/${sessionId}/report`, {
      timeout: 180000, // 3分钟超时，AI评估需要时间
    });
  },

  /**
   * 查找未完成的面试会话
   */
  async findUnfinishedSession(resumeId: number): Promise<InterviewSession | null> {
    try {
      return await request.get<InterviewSession>(`/api/interview/sessions/unfinished/${resumeId}`);
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
      `/api/interview/sessions/${req.sessionId}/answers`,
      { questionIndex: req.questionIndex, answer: req.answer }
    );
  },

  /**
   * 提前交卷
   */
  async completeInterview(sessionId: string): Promise<void> {
    return request.post<void>(`/api/interview/sessions/${sessionId}/complete`);
  },

  async openQuestionTtsStream(
    text: string,
    signal?: AbortSignal
  ): Promise<ReadableStreamDefaultReader<Uint8Array>> {
    const response = await fetch(`${baseURL}/api/interview/tts/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
      signal,
    });

    if (!response.ok) {
      throw new Error('题目语音生成失败');
    }
    if (!response.body) {
      throw new Error('题目语音流不可用');
    }

    return response.body.getReader();
  },
};
