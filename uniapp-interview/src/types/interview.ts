export interface CreateInterviewRequest {
  resumeId: number;
  resumeText: string;
  questionCount: number;
  jobDescription?: string;
}

export interface InterviewSession {
  sessionId: string;
  resumeText: string;
  totalQuestions: number;
  currentQuestionIndex: number;
  questions: Question[];
  status: 'CREATED' | 'IN_PROGRESS' | 'COMPLETED' | 'EVALUATED';
}

export interface Question {
  index: number;
  content: string;
  category: string;
  keyPoints?: string[];
}

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
