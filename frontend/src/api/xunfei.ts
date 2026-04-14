import { request } from './request';

export interface XunfeiStreamInfo {
  streamUrl: string;
  streamExtend: string | null;
  cid: string | null;
}

export interface XunfeiApi {
  createSession: (interviewSessionId: string) => Promise<XunfeiStreamInfo>;
  destroySession: (interviewSessionId: string) => Promise<void>;
  sendQuestion: (interviewSessionId: string, question: string) => Promise<void>;
  stopSpeaking: (interviewSessionId: string) => Promise<void>;
}

export const xunfeiApi: XunfeiApi = {
  createSession: (interviewSessionId) =>
    request.post<XunfeiStreamInfo>('/api/xunfei/avatar/session', { interviewSessionId }),
  destroySession: (interviewSessionId) =>
    request.delete('/api/xunfei/avatar/session', { data: { interviewSessionId } }),
  sendQuestion: (interviewSessionId, question) =>
    request.post('/api/xunfei/avatar/question', { interviewSessionId, question }),
  stopSpeaking: (interviewSessionId) =>
    request.post('/api/xunfei/avatar/stop', { interviewSessionId }),
};

/** 检查讯飞虚拟人是否启用（轻量接口，不创建会话） */
export async function isXunfeiEnabled(): Promise<boolean> {
  try {
    const enabled = await request.get<boolean>('/api/xunfei/avatar/enabled');
    return !!enabled;
  } catch {
    return false;
  }
}
