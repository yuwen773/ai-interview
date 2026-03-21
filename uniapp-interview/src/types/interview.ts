export interface CreateInterviewRequest {
  resumeId: number;
  resumeText: string;
  questionCount: number;
  jobRole: JobRole;
  jobDescription?: string;
}

export interface InterviewSession {
  sessionId: string;
  resumeText: string;
  jobRole: JobRole;
  jobLabel: string;
  totalQuestions: number;
  currentQuestionIndex: number;
  questions: Question[];
  status: 'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'EVALUATED';
}

export interface Question {
  index: number;
  content: string;
  type?: QuestionType;
  category: string;
  keyPoints?: string[];
}

export type JobRole = 'JAVA_BACKEND' | 'WEB_FRONTEND' | 'PYTHON_ALGORITHM';

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

export interface CurrentQuestionResponse {
  question: string;
  questionIndex: number;
  totalQuestions: number;
  completed: boolean;
}

export interface SubmitAnswerRequest {
  sessionId: string;
  questionIndex: number;
  answer: string;
}

export interface SubmitAnswerResponse {
  nextQuestion?: string;
  currentIndex: number;
  totalQuestions: number;
  completed: boolean;
  feedback?: AnswerFeedback;
}

export interface AnswerFeedback {
  score: number;
  feedback: string;
  referenceAnswer?: string;
}

export interface InterviewReport {
  sessionId: string;
  jobRole?: JobRole;
  jobLabel?: string;
  totalScore: number;
  dimensions: ReportDimension[];
  suggestions: string[];
  strengths: string[];
  createdAt: string;
}

export interface ReportDimension {
  name: string;
  score: number;
  feedback: string;
}
