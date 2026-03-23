export interface CreateInterviewRequest {
  resumeId: number;
  resumeText: string;
  questionCount: number;
  jobRole: JobRole;
  jobDescription?: string;
  forceCreate?: boolean;
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
  questionIndex: number;
  question: string;
  type: QuestionType;
  category: string;
  userAnswer?: string | null;
  score?: number | null;
  feedback?: string | null;
  isFollowUp?: boolean;
  parentQuestionIndex?: number | null;
}

export type JobRole = 'JAVA_BACKEND' | 'WEB_FRONTEND' | 'PYTHON_ALGORITHM';

export interface JobRoleDTO {
  code: JobRole;
  label: string;
  description: string;
  techKeywords: string[];
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

export interface CurrentQuestionResponse {
  completed: boolean;
  question?: Question;
  message?: string;
}

export interface SubmitAnswerRequest {
  sessionId: string;
  questionIndex: number;
  answer: string;
}

export interface SubmitAnswerResponse {
  hasNextQuestion: boolean;
  nextQuestion?: Question | null;
  currentQuestionIndex: number;
  currentIndex?: number;
  totalQuestions: number;
  recognizedText?: string | null;
  interviewerOutputMode?: 'TEXT' | 'TEXT_VOICE';
}

export interface InterviewReport {
  sessionId: string;
  jobRole: JobRole;
  jobLabel: string;
  totalQuestions: number;
  overallScore: number;
  categoryScores: ReportDimension[];
  questionDetails: QuestionEvaluation[];
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  referenceAnswers: ReferenceAnswer[];
}

export interface ReportDimension {
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

// 答题卡状态
export type AnswerCardStatus = 'answered' | 'saved' | 'unanswered';

// 答题卡条目
export interface AnswerCardItem {
  questionIndex: number;    // 题号（0-based，与 API 一致）
  displayIndex: number;     // 显示用题号（1-based，Q1, Q2...）
  status: AnswerCardStatus;
  question: string;         // 题目内容
  savedAnswer?: string;     // 用户回答（answered/saved 状态时有值）
}
