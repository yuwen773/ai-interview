// 面试相关类型定义

export interface InterviewSession {
  sessionId: string;
  resumeText: string;
  jobRole: JobRole;
  jobLabel: string;
  totalQuestions: number;
  currentQuestionIndex: number;
  questions: InterviewQuestion[];
  status: 'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'EVALUATED';
}

export interface InterviewQuestion {
  questionIndex: number;
  question: string;
  type: QuestionType;
  category: string;
  userAnswer: string | null;
  score: number | null;
  feedback: string | null;
}

export type QuestionType = 
  | 'GENERAL'
  | 'PROJECT' 
  | 'JAVA_BASIC' 
  | 'JAVA_COLLECTION' 
  | 'JAVA_CONCURRENT' 
  | 'MYSQL' 
  | 'REDIS' 
  | 'SPRING' 
  | 'SPRING_BOOT'
  | 'JAVASCRIPT_TYPESCRIPT'
  | 'CSS_HTML'
  | 'BROWSER_NETWORK'
  | 'REACT'
  | 'PYTHON_CORE'
  | 'ALGORITHM_DATA_STRUCTURE'
  | 'ENGINEERING';

export type JobRole = 'JAVA_BACKEND' | 'WEB_FRONTEND' | 'PYTHON_ALGORITHM';

export interface JobRoleDTO {
  code: JobRole;
  label: string;
  description: string;
  techKeywords: string[];
}

export interface InterviewPackageOption {
  id: 'warmup' | 'standard' | 'deep' | 'challenge';
  name: string;
  totalQuestions: number;
  estimatedDuration: string;
  description: string;
  mainQuestionCount: number;
}

export interface CreateInterviewRequest {
  resumeText: string;
  questionCount: number;
  resumeId?: number;
  jobRole: JobRole;
  forceCreate?: boolean;  // 是否强制创建新会话（忽略未完成的会话）
}

export interface SubmitAnswerRequest {
  sessionId: string;
  questionIndex: number;
  answer: string;
  interviewerOutputMode?: InterviewerOutputMode;
}

export type CandidateInputMode = 'text' | 'voice';
export type InterviewerOutputMode = 'text' | 'textVoice';

export interface SubmitAnswerResponse {
  recognizedText: string | null;
  hasNextQuestion: boolean;
  nextQuestion: InterviewQuestion | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  interviewerOutputMode?: InterviewerOutputMode;
}

export interface VoiceRecognizeResponse {
  recognizedText: string;
}

export interface CurrentQuestionResponse {
  completed: boolean;
  question?: InterviewQuestion;
  message?: string;
}

export interface InterviewReport {
  sessionId: string;
  jobRole: JobRole;
  jobLabel: string;
  totalQuestions: number;
  overallScore: number;
  categoryScores: CategoryScore[];
  questionDetails: QuestionEvaluation[];
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  referenceAnswers: ReferenceAnswer[];
}

export interface CategoryScore {
  category: string;
  score: number;
  questionCount: number;
}

export interface QuestionEvaluation {
  questionIndex: number;
  question: string;
  category: string;
  userAnswer: string;
  score: number;
  feedback: string;
}

export interface ReferenceAnswer {
  questionIndex: number;
  question: string;
  referenceAnswer: string;
  keyPoints: string[];
}
