import request from './request';

export interface AuthResponse {
  token: string;
  userId: number;
  nickname: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    request.post<AuthResponse>('/auth/login', { email, password }),

  register: (email: string, password: string, nickname: string) =>
    request.post<AuthResponse>('/auth/register', { email, password, nickname }),
};
