/**
 * 路由常量
 */
export const ROUTES = {
  // 主页
  HOME: '/',

  // 简历
  UPLOAD: '/upload',
  RESUME_DETAIL: '/resume/:id',

  // 面试
  INTERVIEWS: '/interviews',
  INTERVIEW_HUB: '/interview-hub',
  INTERVIEW_PAGE: '/interview/:sessionId',
  VOICE_INTERVIEW: '/voice-interview/:sessionId?',
  VOICE_INTERVIEW_LIST: '/voice-interviews',
  VOICE_INTERVIEW_EVALUATION: '/voice-interview/:sessionId/evaluation',
  INTERVIEW_HISTORY: '/interviews/history',
  INTERVIEW_REPORT: '/interview/:sessionId/report',

  // 知识库
  KNOWLEDGE_BASE: '/knowledge-base',
  KNOWLEDGE_BASE_UPLOAD: '/knowledge-base/upload',
  KNOWLEDGE_BASE_MANAGE: '/knowledge-base/manage',
  KNOWLEDGE_BASE_QUERY: '/knowledge-base/query',
  KNOWLEDGE_GRAPH: '/knowledge-base/graph',

  // 用户画像
  PROFILE: '/profile',
  GROWTH_CURVE: '/growth-curve',

  // 设置
  SETTINGS: '/settings',
} as const;

export type RouteKey = keyof typeof ROUTES;
export type RoutePath = typeof ROUTES[RouteKey];