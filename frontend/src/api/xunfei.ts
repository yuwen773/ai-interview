import { request } from './request';

export interface XunfeiStreamInfo {
  streamUrl: string;
  streamExtend: string | null;
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
    request.delete('/api/xunfei/avatar/session', { interviewSessionId }),
  sendQuestion: (interviewSessionId, question) =>
    request.post('/api/xunfei/avatar/question', { interviewSessionId, question }),
  stopSpeaking: (interviewSessionId) =>
    request.post('/api/xunfei/avatar/stop', { interviewSessionId }),
};
